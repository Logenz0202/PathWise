import enum
import json

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.core.time import utc_now
from app.db.session import Base


class TransportMode(str, enum.Enum):
    CAR = "car"
    TRAIN = "train"
    BUS = "bus"


class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    # Where the road distance and driving times came from: "osrm" or "estimate"
    route_source = Column(String, nullable=False)

    # Car used (copied from the selected preset, so it survives renaming/deleting the preset;
    # all empty means the average-car estimate was used)
    car_name = Column(String, nullable=True)
    car_fuel_type = Column(String, nullable=True)
    car_consumption_l_per_100km = Column(Float, nullable=True)
    car_fuel_price_per_liter = Column(Float, nullable=True)

    # Results per mode. Car and bus use distance_km; the train runs on its own (estimated) rail distance
    car_time_minutes = Column(Float, nullable=False)
    car_cost_eur = Column(Float, nullable=False)
    car_co2_kg = Column(Float, nullable=False)

    train_distance_km = Column(Float, nullable=False)
    train_time_minutes = Column(Float, nullable=False)
    train_cost_eur = Column(Float, nullable=False)
    train_co2_kg = Column(Float, nullable=False)

    bus_time_minutes = Column(Float, nullable=False)
    bus_cost_eur = Column(Float, nullable=False)
    bus_co2_kg = Column(Float, nullable=False)

    # What the advice was based on: the traveller's priority and optional note
    priority = Column(String, nullable=False)
    notes = Column(String, nullable=True)

    # The Eco-Coach's structured advice, stored as JSON
    ai_recommendation = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def _option(self, mode: TransportMode) -> dict:
        """Group the flat `<mode>_*` result columns into one transport option."""
        prefix = mode.value
        return {
            "mode": mode,
            "distance_km": self.train_distance_km if mode == TransportMode.TRAIN else self.distance_km,
            "time_minutes": getattr(self, f"{prefix}_time_minutes"),
            "cost_eur": getattr(self, f"{prefix}_cost_eur"),
            "co2_kg": getattr(self, f"{prefix}_co2_kg"),
        }

    @property
    def car(self) -> dict:
        return self._option(TransportMode.CAR)

    @property
    def train(self) -> dict:
        return self._option(TransportMode.TRAIN)

    @property
    def bus(self) -> dict:
        return self._option(TransportMode.BUS)

    @property
    def ai_advice(self) -> dict:
        return json.loads(self.ai_recommendation)
