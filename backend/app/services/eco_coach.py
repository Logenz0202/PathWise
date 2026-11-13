import httpx
import json
from typing import Optional
from app.core.config import settings
from app.schemas.comparison import TransportOption


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
        bus: TransportOption
    ) -> str:
        """Get AI recommendation for transport choice."""
        
        if not self.api_key:
            return self._fallback_recommendation(car, train, bus)
        
        prompt = self._build_prompt(origin, destination, distance_km, car, train, bus)
        
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
                            {
                                "role": "system",
                                "content": "You are an expert eco-travel advisor. Provide concise, personalized recommendations comparing transport options based on time, cost, and environmental impact."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 300,
                        "temperature": 0.7,
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return self._fallback_recommendation(car, train, bus)
    
    def _build_prompt(
        self,
        origin: str,
        destination: str,
        distance_km: float,
        car: TransportOption,
        train: TransportOption,
        bus: TransportOption
    ) -> str:
        return f"""
Trip: {origin} → {destination} ({distance_km} km)

Options:
🚗 Car: {car.time_minutes:.0f} min, €{car.cost_eur:.2f}, {car.co2_kg:.1f} kg CO₂
🚂 Train: {train.time_minutes:.0f} min, €{train.cost_eur:.2f}, {train.co2_kg:.1f} kg CO₂
🚌 Bus: {bus.time_minutes:.0f} min, €{bus.cost_eur:.2f}, {bus.co2_kg:.1f} kg CO₂

Provide a concise recommendation (2-3 sentences) considering:
- Time vs money trade-off
- Environmental impact
- Best choice for different priorities (speed, budget, eco)
"""
    
    def _fallback_recommendation(
        self,
        car: TransportOption,
        train: TransportOption,
        bus: TransportOption
    ) -> str:
        """Offline fallback recommendation logic."""
        options = [
            ("Car", car.time_minutes, car.cost_eur, car.co2_kg),
            ("Train", train.time_minutes, train.cost_eur, train.co2_kg),
            ("Bus", bus.time_minutes, bus.cost_eur, bus.co2_kg),
        ]
        
        # Find best for each criterion
        fastest = min(options, key=lambda x: x[1])
        cheapest = min(options, key=lambda x: x[2])
        greenest = min(options, key=lambda x: x[3])
        
        if fastest[0] == cheapest[0] == greenest[0]:
            return f"🏆 **{fastest[0]}** wins across all criteria — fastest, cheapest, and lowest emissions!"
        
        lines = [
            f"🏃 **Fastest**: {fastest[0]} ({fastest[1]:.0f} min)",
            f"💰 **Cheapest**: {cheapest[0]} (€{cheapest[2]:.2f})",
            f"🌱 **Greenest**: {greenest[0]} ({greenest[3]:.1f} kg CO₂)",
        ]
        
        if fastest[0] == greenest[0]:
            lines.append(f"\n✨ **Recommendation**: {fastest[0]} gives you both speed and sustainability!")
        elif cheapest[0] == greenest[0]:
            lines.append(f"\n✨ **Recommendation**: {cheapest[0]} saves money AND the planet!")
        else:
            lines.append(f"\n🤔 **Choose based on priority**: Speed → {fastest[0]}, Budget → {cheapest[0]}, Eco → {greenest[0]}")
        
        return "\n".join(lines)


eco_coach = EcoCoachService()