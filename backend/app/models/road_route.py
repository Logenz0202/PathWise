from sqlalchemy import Column, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.db.session import Base


class RoadRouteCache(Base):
    """A road route fetched from OSRM, stored so each city pair is requested only once.

    One row per unordered pair: `city_a` is the alphabetically first city id, and the geometry runs
    from city_a to city_b (it is reversed when the trip goes the other way).
    """

    __tablename__ = "road_routes"
    __table_args__ = (UniqueConstraint("city_a", "city_b"),)

    id = Column(Integer, primary_key=True)
    city_a = Column(String, nullable=False)
    city_b = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    car_drive_minutes = Column(Float, nullable=False)
    bus_drive_minutes = Column(Float, nullable=False)
    # JSON list of [lat, lng] points
    geometry = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
