from fastapi import APIRouter

from app.services.geo import CITY_LIST, calculate_road_distance

router = APIRouter(prefix="/api/geo", tags=["geo"])


@router.get("/cities")
def list_cities():
    """List all supported cities, biggest first."""
    return CITY_LIST


@router.get("/distance")
def get_distance(origin: str, destination: str):
    """Estimate the road distance in kilometers between two cities."""
    distance = calculate_road_distance(origin, destination)
    return {"origin": origin, "destination": destination, "distance_km": distance}
