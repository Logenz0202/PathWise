import logging
from typing import Optional

import httpx

from app.core.config import settings
from app.schemas.comparison import TransportOption

logger = logging.getLogger("uvicorn.error")

SYSTEM_PROMPT = (
    "You are an expert eco-travel advisor. Provide concise, personalized recommendations "
    "comparing transport options based on time, cost, and environmental impact."
)

# Text for the offline fallback recommendation, per UI language
FALLBACK_TEXT = {
    "en": {
        "modes": {"car": "Car", "train": "Train", "bus": "Bus"},
        "all": "🏆 **{mode}** wins across all criteria — fastest, cheapest, and lowest emissions!",
        "fastest": "🏃 **Fastest**: {mode} ({value})",
        "cheapest": "💰 **Cheapest**: {mode} ({value})",
        "greenest": "🌱 **Greenest**: {mode} ({value})",
        "speed_eco": "\n✨ **Recommendation**: {mode} gives you both speed and sustainability!",
        "money_eco": "\n✨ **Recommendation**: {mode} saves money AND the planet!",
        "priority": "\n🤔 **Choose based on priority**: Speed → {fast}, Budget → {cheap}, Eco → {green}",
    },
    "pl": {
        "modes": {"car": "Samochód", "train": "Pociąg", "bus": "Autobus"},
        "all": "🏆 **{mode}** wygrywa we wszystkich kategoriach — najszybszy, najtańszy i najbardziej ekologiczny!",
        "fastest": "🏃 **Najszybciej**: {mode} ({value})",
        "cheapest": "💰 **Najtaniej**: {mode} ({value})",
        "greenest": "🌱 **Najbardziej ekologicznie**: {mode} ({value})",
        "speed_eco": "\n✨ **Rekomendacja**: {mode} łączy szybkość z ekologią!",
        "money_eco": "\n✨ **Rekomendacja**: {mode} oszczędza pieniądze i planetę!",
        "priority": "\n🤔 **Wybierz według priorytetu**: szybkość → {fast}, budżet → {cheap}, ekologia → {green}",
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
        currency: str = "EUR",
        language: str = "en",
    ) -> str:
        """Get AI recommendation for transport choice."""

        if not self.api_key:
            return self._fallback_recommendation(car, train, bus, currency, language)

        prompt = self._build_prompt(origin, destination, distance_km, car, train, bus, car_fuel_type, currency)
        system_prompt = SYSTEM_PROMPT + (" Always answer in Polish." if language == "pl" else "")

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
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": 300,
                        "temperature": 0.7,
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            # Any API problem (network, quota, bad model ID) falls back to the offline advice
            logger.warning("Eco-Coach AI request failed, using offline fallback: %s", exc)
            return self._fallback_recommendation(car, train, bus, currency, language)

    def _build_prompt(
        self,
        origin: str,
        destination: str,
        distance_km: float,
        car: TransportOption,
        train: TransportOption,
        bus: TransportOption,
        car_fuel_type: Optional[str] = None,
        currency: str = "EUR",
    ) -> str:
        car_label = f"Car ({car_fuel_type})" if car_fuel_type else "Car"
        return f"""
Trip: {origin} → {destination} ({distance_km} km)

Options:
🚗 {car_label}: {car.time_minutes:.0f} min, {format_money(car.cost_eur, currency)}, {car.co2_kg:.1f} kg CO₂
🚂 Train: {train.time_minutes:.0f} min, {format_money(train.cost_eur, currency)}, {train.co2_kg:.1f} kg CO₂
🚌 Bus: {bus.time_minutes:.0f} min, {format_money(bus.cost_eur, currency)}, {bus.co2_kg:.1f} kg CO₂

Provide a concise recommendation (2-3 sentences) considering:
- Time vs money trade-off
- Environmental impact
- Best choice for different priorities (speed, budget, eco)
"""

    def _fallback_recommendation(
        self,
        car: TransportOption,
        train: TransportOption,
        bus: TransportOption,
        currency: str = "EUR",
        language: str = "en",
    ) -> str:
        """Offline fallback recommendation logic."""
        text = FALLBACK_TEXT.get(language, FALLBACK_TEXT["en"])
        modes = text["modes"]
        options = [
            (modes["car"], car),
            (modes["train"], train),
            (modes["bus"], bus),
        ]

        # Find best for each criterion
        fastest = min(options, key=lambda o: o[1].time_minutes)
        cheapest = min(options, key=lambda o: o[1].cost_eur)
        greenest = min(options, key=lambda o: o[1].co2_kg)

        if fastest[0] == cheapest[0] == greenest[0]:
            return text["all"].format(mode=fastest[0])

        lines = [
            text["fastest"].format(mode=fastest[0], value=f"{fastest[1].time_minutes:.0f} min"),
            text["cheapest"].format(mode=cheapest[0], value=format_money(cheapest[1].cost_eur, currency, language)),
            text["greenest"].format(
                mode=greenest[0], value=f"{format_number(greenest[1].co2_kg, 1, language)} kg CO₂"
            ),
        ]

        if fastest[0] == greenest[0]:
            lines.append(text["speed_eco"].format(mode=fastest[0]))
        elif cheapest[0] == greenest[0]:
            lines.append(text["money_eco"].format(mode=cheapest[0]))
        else:
            lines.append(text["priority"].format(fast=fastest[0], cheap=cheapest[0], green=greenest[0]))

        return "\n".join(lines)


eco_coach = EcoCoachService()
