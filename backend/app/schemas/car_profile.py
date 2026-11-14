from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

FuelType = Literal["petrol", "diesel", "lpg", "electric"]


class CarProfileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=60, description="Name shown in the car picker")
    fuel_type: FuelType
    consumption_per_100km: float = Field(..., gt=0, le=100, description="Litres, or kWh for electric")
    energy_price_eur: float = Field(..., gt=0, le=20, description="EUR per litre, or per kWh for electric")


class CarProfileCreate(CarProfileBase):
    pass


class CarProfileUpdate(CarProfileBase):
    """Full replacement of a car preset (PUT)."""


class CarProfileResponse(CarProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
