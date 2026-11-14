import enum
import json

from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

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

    # Car used (copied from the selected preset, so it survives renaming/deleting the preset;
    # all empty means the average-car estimate was used)
    car_name = Column(String, nullable=True)
    car_fuel_type = Column(String, nullable=True)
    car_consumption_l_per_100km = Column(Float, nullable=True)
    car_fuel_price_per_liter = Column(Float, nullable=True)

    # Results
    car_time_minutes = Column(Float, nullable=True)
    car_cost_eur = Column(Float, nullable=True)
    car_co2_kg = Column(Float, nullable=True)

    train_time_minutes = Column(Float, nullable=True)
    train_cost_eur = Column(Float, nullable=True)
    train_co2_kg = Column(Float, nullable=True)

    bus_time_minutes = Column(Float, nullable=True)
    bus_cost_eur = Column(Float, nullable=True)
    bus_co2_kg = Column(Float, nullable=True)

    # What the advice was based on: the traveller's priority and optional note
    priority = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    # AI recommendation: structured advice stored as JSON (older rows hold plain text)
    ai_recommendation = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def _option(self, mode: TransportMode) -> dict | None:
        """Group the flat `<mode>_*` result columns into one transport option."""
        prefix = mode.value
        time_minutes = getattr(self, f"{prefix}_time_minutes")
        if time_minutes is None:
            return None
        return {
            "mode": mode,
            "time_minutes": time_minutes,
            "cost_eur": getattr(self, f"{prefix}_cost_eur"),
            "co2_kg": getattr(self, f"{prefix}_co2_kg"),
        }

    @property
    def car(self) -> dict | None:
        return self._option(TransportMode.CAR)

    @property
    def train(self) -> dict | None:
        return self._option(TransportMode.TRAIN)

    @property
    def bus(self) -> dict | None:
        return self._option(TransportMode.BUS)

    def _stored_advice(self) -> dict | None:
        try:
            data = json.loads(self.ai_recommendation or "")
        except ValueError:
            return None
        return data if isinstance(data, dict) else None

    @property
    def ai_advice(self) -> dict | None:
        return self._stored_advice()

    @property
    def ai_text(self) -> str | None:
        return None if self._stored_advice() is not None else self.ai_recommendation
