from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.session import Base
import enum


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
    
    # Car specific
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
    
    # AI Recommendation
    ai_recommendation = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())