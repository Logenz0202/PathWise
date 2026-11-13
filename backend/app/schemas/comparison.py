from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.comparison import TransportMode


class ComparisonRequest(BaseModel):
    origin: str = Field(..., description="Starting city")
    destination: str = Field(..., description="Destination city")
    distance_km: float = Field(..., gt=0, description="Distance in kilometers")
    
    # Car configuration
    car_fuel_type: Optional[str] = Field(None, description="Fuel type: petrol, diesel, lpg, electric")
    car_consumption_l_per_100km: Optional[float] = Field(None, gt=0, description="Fuel consumption in L/100km")
    car_fuel_price_per_liter: Optional[float] = Field(None, gt=0, description="Fuel price per liter in EUR")


class TransportOption(BaseModel):
    mode: TransportMode
    time_minutes: float
    cost_eur: float
    co2_kg: float


class ComparisonResponse(BaseModel):
    id: int
    origin: str
    destination: str
    distance_km: float
    car_fuel_type: Optional[str]
    car_consumption_l_per_100km: Optional[float]
    car_fuel_price_per_liter: Optional[float]
    
    car: Optional[TransportOption]
    train: Optional[TransportOption]
    bus: Optional[TransportOption]
    
    ai_recommendation: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ComparisonListResponse(BaseModel):
    id: int
    origin: str
    destination: str
    distance_km: float
    created_at: datetime
    
    class Config:
        from_attributes = True