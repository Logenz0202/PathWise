from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.comparison import TransportMode

Priority = Literal["balanced", "fastest", "cheapest", "greenest"]


class ComparisonRequest(BaseModel):
    origin: str = Field(..., description="Starting city")
    destination: str = Field(..., description="Destination city")
    distance_km: Optional[float] = Field(None, gt=0, description="Distance in kilometers (auto-calculated if omitted)")

    # Car configuration (all empty = average car)
    car_name: Optional[str] = Field(None, max_length=60, description="Name of the car preset used")
    # What the traveller cares about; used by the Eco-Coach when choosing what to recommend
    priority: Priority = Field("balanced", description="balanced, fastest, cheapest or greenest")
    notes: Optional[str] = Field(None, max_length=200, description="Free-text context for the AI, e.g. luggage")
    car_fuel_type: Optional[str] = Field(None, description="Fuel type: petrol, diesel, lpg, electric")
    # Field names say "liter" for historical reasons (they're also DB columns); for electric cars
    # the values are kWh/100km and EUR/kWh
    car_consumption_l_per_100km: Optional[float] = Field(
        None, gt=0, description="Consumption per 100 km: litres, or kWh for electric"
    )
    car_fuel_price_per_liter: Optional[float] = Field(
        None, gt=0, description="Energy price in EUR per litre, or per kWh for electric"
    )
    # Only affect how the AI recommendation is written; all amounts are EUR
    currency: Literal["EUR", "PLN"] = Field("EUR", description="Currency for the recommendation text")
    language: Literal["en", "pl"] = Field("en", description="Language for the recommendation text")


class Advice(BaseModel):
    """The Eco-Coach's structured recommendation (from the LLM, or the offline fallback)."""

    recommended: TransportMode
    headline: str = Field(..., min_length=1, max_length=160)
    reason: str = Field(..., min_length=1, max_length=600)
    tips: List[str] = Field(default_factory=list, max_length=2)


class TransportOption(BaseModel):
    mode: TransportMode
    time_minutes: float
    cost_eur: float
    co2_kg: float


class ComparisonListResponse(BaseModel):
    """Summary shown in the history list."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    origin: str
    destination: str
    distance_km: float
    car: Optional[TransportOption]
    train: Optional[TransportOption]
    bus: Optional[TransportOption]
    car_name: Optional[str]
    car_fuel_type: Optional[str]
    created_at: datetime


class ComparisonResponse(ComparisonListResponse):
    """Full comparison, including the car profile and the AI recommendation."""

    car_consumption_l_per_100km: Optional[float]
    car_fuel_price_per_liter: Optional[float]
    priority: Optional[str]
    notes: Optional[str]
    ai_advice: Optional[Advice]
    # Plain-text recommendation saved by earlier versions (before structured advice)
    ai_text: Optional[str]
