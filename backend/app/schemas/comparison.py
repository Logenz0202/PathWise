from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.comparison import TransportMode


class ComparisonRequest(BaseModel):
    origin: str = Field(..., description="Starting city")
    destination: str = Field(..., description="Destination city")
    distance_km: Optional[float] = Field(None, gt=0, description="Distance in kilometers (auto-calculated if omitted)")

    # Car configuration
    car_fuel_type: Optional[str] = Field(None, description="Fuel type: petrol, diesel, lpg, electric")
    # Field names say "liter" for historical reasons (they're also DB columns); for electric cars
    # the values are kWh/100km and EUR/kWh
    car_consumption_l_per_100km: Optional[float] = Field(
        None, gt=0, description="Consumption per 100 km: litres, or kWh for electric"
    )
    car_fuel_price_per_liter: Optional[float] = Field(
        None, gt=0, description="Energy price in EUR per litre, or per kWh for electric"
    )


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
    created_at: datetime


class ComparisonResponse(ComparisonListResponse):
    """Full comparison, including the car profile and the AI recommendation."""

    car_fuel_type: Optional[str]
    car_consumption_l_per_100km: Optional[float]
    car_fuel_price_per_liter: Optional[float]
    ai_recommendation: Optional[str]
