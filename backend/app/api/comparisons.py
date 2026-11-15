from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.comparison import Comparison
from app.schemas.comparison import (
    ComparisonListResponse,
    ComparisonRequest,
    ComparisonResponse,
)
from app.services.calculator import calculate_comparison
from app.services.eco_coach import eco_coach
from app.services.geo import resolve_trip
from app.services.routing import get_road_route

router = APIRouter(prefix="/api/comparisons", tags=["comparisons"])


def get_comparison_or_404(comparison_id: int, db: Session) -> Comparison:
    comparison = db.get(Comparison, comparison_id)
    if not comparison:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comparison not found")
    return comparison


@router.post("/", response_model=ComparisonResponse, status_code=status.HTTP_201_CREATED)
async def create_comparison(
    request: ComparisonRequest,
    db: Session = Depends(get_db)
):
    """Create a new transport comparison."""
    try:
        origin, destination = resolve_trip(request.origin, request.destination)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc

    # Real road route; a distance typed by the user (e.g. a detour) stretches it
    route = await get_road_route(db, origin, destination)
    if request.distance_km:
        route = route.scaled_to(request.distance_km)
    distance_km = route.distance_km

    results = calculate_comparison(
        route,
        origin,
        destination,
        car_fuel_type=request.car_fuel_type,
        car_consumption_l_per_100km=request.car_consumption_l_per_100km,
        car_fuel_price_per_liter=request.car_fuel_price_per_liter,
    )

    # Get AI recommendation
    notes = (request.notes or "").strip() or None
    advice = await eco_coach.get_recommendation(
        origin=request.origin,
        destination=request.destination,
        distance_km=distance_km,
        car=results["car"],
        train=results["train"],
        bus=results["bus"],
        car_fuel_type=request.car_fuel_type,
        car_name=request.car_name,
        priority=request.priority,
        notes=notes,
        currency=request.currency,
        language=request.language,
    )

    # Save to database
    comparison = Comparison(
        origin=request.origin,
        destination=request.destination,
        distance_km=distance_km,
        route_source=route.source,
        car_name=request.car_name,
        priority=request.priority,
        notes=notes,
        car_fuel_type=request.car_fuel_type,
        car_consumption_l_per_100km=request.car_consumption_l_per_100km,
        car_fuel_price_per_liter=request.car_fuel_price_per_liter,
        car_time_minutes=results["car"].time_minutes,
        car_cost_eur=results["car"].cost_eur,
        car_co2_kg=results["car"].co2_kg,
        train_distance_km=results["train"].distance_km,
        train_time_minutes=results["train"].time_minutes,
        train_cost_eur=results["train"].cost_eur,
        train_co2_kg=results["train"].co2_kg,
        bus_time_minutes=results["bus"].time_minutes,
        bus_cost_eur=results["bus"].cost_eur,
        bus_co2_kg=results["bus"].co2_kg,
        ai_recommendation=advice.model_dump_json(),
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
    return get_comparison_or_404(comparison_id, db)


@router.delete("/{comparison_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comparison(
    comparison_id: int,
    db: Session = Depends(get_db)
):
    """Delete a comparison."""
    comparison = get_comparison_or_404(comparison_id, db)

    db.delete(comparison)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
