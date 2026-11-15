from sqlalchemy import Column, DateTime, Float, Integer, String

from app.core.time import utc_now
from app.db.session import Base


class CarProfile(Base):
    """A saved car preset the user can pick when comparing.

    Units follow the fuel type: litres for petrol/diesel/LPG, kWh for electric.
    The energy price is stored in EUR; the frontend converts it for display.
    """

    __tablename__ = "car_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    fuel_type = Column(String, nullable=False)
    consumption_per_100km = Column(Float, nullable=False)
    energy_price_eur = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
