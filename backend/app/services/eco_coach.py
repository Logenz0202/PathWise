import json
import logging
from typing import Optional

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.models.comparison import TransportMode
from app.schemas.comparison import Advice, TransportOption

logger = logging.getLogger("uvicorn.error")

SYSTEM_PROMPT = (
    "You are an eco-travel advisor helping someone choose between car, train and bus for one trip. "
    "Weigh travel time, cost and CO2 emissions, and be honest about trade-offs. "
    "Use only the numbers you are given; never invent prices, timetables or other facts. "
    "Reply with a single JSON object and nothing else (no markdown, no code fences)."
)

LANGUAGE_NAMES = {"en": "English", "pl": "Polish"}

# Text for the offline fallback advice, per UI language
FALLBACK_TEXT = {
    "en": {
        "modes": {"car": "Car", "train": "Train", "bus": "Bus"},
        "headline_all": "{mode} wins on every count",
        "reason_all": "It is the fastest ({time}), the cheapest ({cost}) and the greenest ({co2}) option.",
        "headline": "{mode} is the best all-round choice",
        "reason": "Fastest: {fast} ({time}). Cheapest: {cheap} ({cost}). Greenest: {green} ({co2}).",
        "tip_shared": "Travelling with others? The car's {cost} can be split between you.",
        "tip_green": "Want the lowest footprint? {mode} emits only {co2} per person.",
        "duration": lambda h, m: f"{h}h {m}m" if h else f"{m}m",
    },
    "pl": {
        "modes": {"car": "Samochód", "train": "Pociąg", "bus": "Autobus"},
        "headline_all": "{mode} wygrywa w każdej kategorii",
        "reason_all": "To najszybsza ({time}), najtańsza ({cost}) i najbardziej ekologiczna ({co2}) opcja.",
        "headline": "{mode} to najlepszy wybór",
        "reason": "Najszybciej: {fast} ({time}). Najtaniej: {cheap} ({cost}). Najmniejsza emisja: {green} ({co2}).",
        "tip_shared": "Jedziesz z kimś? Koszt auta ({cost}) możecie podzielić.",
        "tip_green": "Liczy się ślad węglowy? {mode} emituje tylko {co2} na osobę.",
        "duration": lambda h, m: f"{h} h {m} min" if h else f"{m} min",
    },
}


def format_number(value: float, digits: int, language: str = "en") -> str:
    """Format a number with the language's decimal separator (95.1 / 95,1)."""
    text = f"{value:.{digits}f}"
    return text.replace(".", ",") if language == "pl" else text


def format_money(eur: float, currency: str = "EUR", language: str = "en") -> str:
    """Format an EUR amount in the user's display currency and language."""
    if currency == "PLN":
        return f"{format_number(eur * settings.EUR_TO_PLN_RATE, 2, language)} zł"
    amount = format_number(eur, 2, language)
    return f"{amount} €" if language == "pl" else f"€{amount}"


def format_duration(minutes: float, language: str = "en") -> str:
    total = round(minutes)
    return FALLBACK_TEXT.get(language, FALLBACK_TEXT["en"])["duration"](total // 60, total % 60)


def winners(options: dict) -> tuple[str, str, str]:
    """(fastest, cheapest, greenest) mode keys."""
    return (
        min(options, key=lambda m: options[m].time_minutes),
        min(options, key=lambda m: options[m].cost_eur),
        min(options, key=lambda m: options[m].co2_kg),
    )


def parse_advice(content: str) -> Advice:
    """Validate the model's reply; tolerate stray text or code fences around the JSON object."""
    start, end = content.find("{"), content.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object in reply")
    return Advice.model_validate(json.loads(content[start : end + 1]))


class EcoCoachService:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL

    async def get_recommendation(
        self,
        origin: str,
        destination: str,
        distance_km: float,
        car: TransportOption,
        train: TransportOption,
        bus: TransportOption,
        car_fuel_type: Optional[str] = None,
        car_name: Optional[str] = None,
        currency: str = "EUR",
        language: str = "en",
    ) -> Advice:
        """Structured advice from the LLM, or the offline fallback if that isn't possible."""
        options = {"car": car, "train": train, "bus": bus}

        if not self.api_key:
            return self._fallback_advice(options, currency, language)

        prompt = self._build_prompt(origin, destination, distance_km, options, car_fuel_type, car_name, currency, language)
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "PathWise",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt},
                        ],
                        "response_format": {"type": "json_object"},
                        "max_tokens": 400,
                        "temperature": 0.3,
                    },
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                return parse_advice(content)
        except (httpx.HTTPError, KeyError, ValueError, ValidationError) as exc:
            # Network/quota problems or a reply that isn't valid advice: use the offline advice
            logger.warning("Eco-Coach AI request failed, using offline fallback: %s", exc)
            return self._fallback_advice(options, currency, language)

    def _build_prompt(
        self,
        origin: str,
        destination: str,
        distance_km: float,
        options: dict,
        car_fuel_type: Optional[str],
        car_name: Optional[str],
        currency: str,
        language: str,
    ) -> str:
        # Numbers are pre-formatted in the user's language, and the winners pre-computed, so the
        # model only has to explain the trade-off rather than do (and possibly get wrong) the maths
        money = lambda eur: format_money(eur, currency, language)  # noqa: E731
        car_desc = ", ".join(filter(None, [car_name and f'"{car_name}"', car_fuel_type])) or "average car"
        lines = []
        for mode, opt in options.items():
            label = f"car ({car_desc})" if mode == "car" else mode
            line = (
                f"- {label}: {format_duration(opt.time_minutes, language)}, {money(opt.cost_eur)}, "
                f"{format_number(opt.co2_kg, 1, language)} kg CO2"
            )
            lines.append(line)
        fastest, cheapest, greenest = winners(options)

        return f"""Trip for one person: {origin} → {destination}, {distance_km:.0f} km.
Train and bus are priced per ticket; the car values are for the whole car.

{chr(10).join(lines)}

Facts (already computed, do not contradict them): fastest = {fastest}, cheapest = {cheapest}, greenest = {greenest}.

Return a JSON object with exactly these keys:
- "recommended": "car", "train" or "bus" — the best overall choice for this trip
- "headline": one short sentence (max 12 words) with the recommendation
- "reason": 1-2 sentences explaining the trade-off, quoting the numbers exactly as written above
- "tips": a list of 0-2 short, practical tips for this trip
Write the headline, reason and tips in {LANGUAGE_NAMES.get(language, "English")}."""

    def _fallback_advice(self, options: dict, currency: str, language: str) -> Advice:
        """Rule-based advice in the same structure as the LLM's, used when the AI isn't available."""
        text = FALLBACK_TEXT.get(language, FALLBACK_TEXT["en"])
        name = lambda mode: text["modes"][mode]  # noqa: E731
        money = lambda eur: format_money(eur, currency, language)  # noqa: E731
        co2 = lambda kg: f"{format_number(kg, 1, language)} kg CO₂"  # noqa: E731

        duration = lambda minutes: format_duration(minutes, language)  # noqa: E731
        fastest, cheapest, greenest = winners(options)

        # Recommend the mode that wins the most criteria; on a tie, the greenest one
        wins = [fastest, cheapest, greenest]
        recommended = max(options, key=lambda m: (wins.count(m), m == greenest))

        if fastest == cheapest == greenest:
            headline = text["headline_all"].format(mode=name(fastest))
            reason = text["reason_all"].format(
                time=duration(options[fastest].time_minutes),
                cost=money(options[fastest].cost_eur),
                co2=co2(options[fastest].co2_kg),
            )
        else:
            headline = text["headline"].format(mode=name(recommended))
            reason = text["reason"].format(
                fast=name(fastest),
                time=duration(options[fastest].time_minutes),
                cheap=name(cheapest),
                cost=money(options[cheapest].cost_eur),
                green=name(greenest),
                co2=co2(options[greenest].co2_kg),
            )

        tips = []
        if cheapest != "car":
            tips.append(text["tip_shared"].format(cost=money(options["car"].cost_eur)))
        if greenest != recommended:
            tips.append(text["tip_green"].format(mode=name(greenest), co2=co2(options[greenest].co2_kg)))

        return Advice(
            recommended=TransportMode(recommended), headline=headline, reason=reason, tips=tips[:2]
        )


eco_coach = EcoCoachService()
