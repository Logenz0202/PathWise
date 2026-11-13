from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.comparison import Comparison
from app.schemas.comparison import (
    ComparisonRequest,
    ComparisonResponse,
    ComparisonListResponse,
)
from app.services.calculator import calculate_comparison
from app.services.eco_coach import eco_coach
from app.services.geo import calculate_road_distance

router = APIRouter(prefix="/api/comparisons", tags=["comparisons"])


@router.post("/", response_model=ComparisonResponse)
async def create_comparison(
    request: ComparisonRequest,
    db: Session = Depends(get_db)
):
    """Create a new transport comparison."""
    # Determine distance (auto-calculate if not provided)
    distance_km = request.distance_km
    if distance_km is None or distance_km <= 0:
        distance_km = calculate_road_distance(request.origin, request.destination)

    # Calculate all options
    results = calculate_comparison(
        distance_km=distance_km,
        car_fuel_type=request.car_fuel_type,
        car_consumption_l_per_100km=request.car_consumption_l_per_100km,
        car_fuel_price_per_liter=request.car_fuel_price_per_liter,
    )

    # Get AI recommendation
    ai_recommendation = await eco_coach.get_recommendation(
        origin=request.origin,
        destination=request.destination,
        distance_km=distance_km,
        car=results["car"],
        train=results["train"],
        bus=results["bus"],
    )

    # Save to database
    comparison = Comparison(
        origin=request.origin,
        destination=request.destination,
        distance_km=distance_km,
        car_fuel_type=request.car_fuel_type,
        car_consumption_l_per_100km=request.car_consumption_l_per_100km,
        car_fuel_price_per_liter=request.car_fuel_price_per_liter,
        car_time_minutes=results["car"].time_minutes,
        car_cost_eur=results["car"].cost_eur,
        car_co2_kg=results["car"].co2_kg,
        train_time_minutes=results["train"].time_minutes,
        train_cost_eur=results["train"].cost_eur,
        train_co2_kg=results["train"].co2_kg,
        bus_time_minutes=results["bus"].time_minutes,
        bus_cost_eur=results["bus"].cost_eur,
        bus_co2_kg=results["bus"].co2_kg,
        ai_recommendation=ai_recommendation,
    )

    db.add(comparison)
    db.commit()
    db.refresh(comparison)

    return comparison


@router.get("/", response_model=List[ComparisonListResponse])
def list_comparisons(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all saved comparisons."""
    comparisons = db.query(Comparison).order_by(Comparison.created_at.desc()).offset(skip).limit(limit).all()
    return comparisons


@router.get("/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(
    comparison_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific comparison by ID."""
    comparison = db.query(Comparison).filter(Comparison.id == comparison_id).first()
    if not comparison:
        raise HTTPException(status_code=404, detail="Comparison not found")
    return comparison


@router.delete("/{comparison_id}")
def delete_comparison(
    comparison_id: int,
    db: Session = Depends(get_db)
):
    """Delete a comparison."""
    comparison = db.query(Comparison).filter(Comparison.id == comparison_id).first()
    if not comparison:
        raise HTTPException(status_code=404, detail="Comparison not found")

    db.delete(comparison)
    db.commit()
    return {"message": "Comparison deleted successfully"}
