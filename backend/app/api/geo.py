from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.comparison import RouteResponse
from app.services.calculator import calculate_comparison
from app.services.geo import CITY_LIST, resolve_trip
from app.services.routing import get_road_route

router = APIRouter(prefix="/api/geo", tags=["geo"])


@router.get("/cities")
def list_cities():
    """List all supported cities, biggest first."""
    return CITY_LIST


@router.get("/route", response_model=RouteResponse)
async def get_route(
    origin: str,
    destination: str,
    distance_km: Optional[float] = Query(None, gt=0, description="Distance typed by the user, e.g. a detour"),
    db: Session = Depends(get_db),
):
    """Road route between two cities (line for the map, distance) and door-to-door times per mode
    for an average car. Used by the planner before a comparison is saved."""
    try:
        origin_city, destination_city = resolve_trip(origin, destination)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc

    route = await get_road_route(db, origin_city, destination_city)
    if distance_km:
        route = route.scaled_to(distance_km)
    options = calculate_comparison(route, origin_city, destination_city)
    return RouteResponse(
        origin=origin_city["name"],
        destination=destination_city["name"],
        distance_km=route.distance_km,
        source=route.source,
        geometry=route.geometry,
        **options,
    )
