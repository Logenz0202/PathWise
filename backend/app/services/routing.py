"""Road routes between two cities from OSRM (OpenStreetMap road data), cached in the database.

The public OSRM server needs no API key; its usage policy asks for at most one request per second
and an identifying User-Agent. Each city pair is fetched once and stored, so reopening a trip
costs nothing. If OSRM is disabled (OSRM_URL empty) or unreachable, an estimate is used instead.
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, replace
from typing import Literal, Optional

import httpx
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.road_route import RoadRouteCache
from app.services.geo import calculate_road_distance

logger = logging.getLogger(__name__)

USER_AGENT = "PathWise/1.0 (transport comparison MVP)"

# Coaches may not go faster than this on any road (EU speed limit for buses)
COACH_MAX_SPEED_KMH = 100

# Used only when there is no real route: typical average driving speeds (km/h)
ESTIMATE_CAR_SPEED_KMH = 80
ESTIMATE_BUS_SPEED_KMH = 70

# The map line is simplified: points closer than this to the line are dropped (degrees, ~50 m)
SIMPLIFY_TOLERANCE_DEG = 0.0005

# Public server's fair-use limit
MIN_REQUEST_INTERVAL_SECONDS = 1.0

LatLng = tuple[float, float]


@dataclass(frozen=True)
class RoadRoute:
    distance_km: float
    # OSRM driving time: follows the speed limits of the roads used, no traffic or breaks
    car_drive_minutes: float
    # The same roads driven no faster than COACH_MAX_SPEED_KMH
    bus_drive_minutes: float
    # Points along the road for the map; None for estimates
    geometry: Optional[list[LatLng]]
    source: Literal["osrm", "estimate"]

    def scaled_to(self, distance_km: float) -> "RoadRoute":
        """The same route stretched to a user-given distance (e.g. a detour); times scale with it."""
        if self.distance_km <= 0:
            return replace(self, distance_km=distance_km)
        factor = distance_km / self.distance_km
        return replace(
            self,
            distance_km=distance_km,
            car_drive_minutes=self.car_drive_minutes * factor,
            bus_drive_minutes=self.bus_drive_minutes * factor,
        )


def coach_drive_minutes(distances_m: list[float], durations_s: list[float]) -> float:
    """Driving time over the route's road segments with each one capped at coach speed."""
    max_speed_ms = COACH_MAX_SPEED_KMH / 3.6
    return sum(max(t, d / max_speed_ms) for d, t in zip(distances_m, durations_s, strict=True)) / 60


def simplify(points: list[LatLng], tolerance: float = SIMPLIFY_TOLERANCE_DEG) -> list[LatLng]:
    """Douglas-Peucker line simplification: keeps the shape with far fewer points."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        (y1, x1), (y2, x2) = points[start], points[end]
        dy, dx = y2 - y1, x2 - x1
        length = (dx * dx + dy * dy) ** 0.5
        farthest, max_dist = None, tolerance
        for i in range(start + 1, end):
            y, x = points[i]
            if length == 0:
                dist = ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
            else:
                dist = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length
            if dist > max_dist:
                farthest, max_dist = i, dist
        if farthest is not None:
            keep[farthest] = True
            stack += [(start, farthest), (farthest, end)]
    return [p for p, k in zip(points, keep, strict=True) if k]


def parse_osrm(data: dict) -> RoadRoute:
    """Turn an OSRM /route response into a RoadRoute. Raises ValueError if it has no route."""
    if data.get("code") != "Ok" or not data.get("routes"):
        raise ValueError(f"OSRM returned no route: {data.get('code')} {data.get('message', '')}".strip())
    route = data["routes"][0]
    distances = [d for leg in route["legs"] for d in leg["annotation"]["distance"]]
    durations = [t for leg in route["legs"] for t in leg["annotation"]["duration"]]
    points = [(round(lat, 5), round(lng, 5)) for lng, lat in route["geometry"]["coordinates"]]
    return RoadRoute(
        distance_km=round(route["distance"] / 1000, 1),
        car_drive_minutes=route["duration"] / 60,
        bus_drive_minutes=coach_drive_minutes(distances, durations),
        geometry=simplify(points),
        source="osrm",
    )


_last_request_at = 0.0


async def fetch_osrm_route(origin: dict, destination: dict) -> RoadRoute:
    """Ask the OSRM server for the driving route between two cities."""
    global _last_request_at
    wait = MIN_REQUEST_INTERVAL_SECONDS - (time.monotonic() - _last_request_at)
    if wait > 0:
        await asyncio.sleep(wait)
    _last_request_at = time.monotonic()

    coordinates = f"{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
    async with httpx.AsyncClient(
        timeout=settings.OSRM_TIMEOUT_SECONDS, headers={"User-Agent": USER_AGENT}
    ) as client:
        response = await client.get(
            f"{settings.OSRM_URL.rstrip('/')}/route/v1/driving/{coordinates}",
            params={"overview": "full", "geometries": "geojson", "annotations": "distance,duration"},
        )
    response.raise_for_status()
    return parse_osrm(response.json())


def estimate_road_route(origin: dict, destination: dict) -> RoadRoute:
    """Fallback without a routing service: straight-line distance times a road factor."""
    km = calculate_road_distance(origin["name"], destination["name"])
    return RoadRoute(
        distance_km=km,
        car_drive_minutes=km / ESTIMATE_CAR_SPEED_KMH * 60,
        bus_drive_minutes=km / ESTIMATE_BUS_SPEED_KMH * 60,
        geometry=None,
        source="estimate",
    )


def _load_cached(db: Session, origin_id: str, destination_id: str) -> Optional[RoadRoute]:
    city_a, city_b = sorted((origin_id, destination_id))
    row = db.query(RoadRouteCache).filter_by(city_a=city_a, city_b=city_b).first()
    if row is None:
        return None
    geometry = [tuple(p) for p in json.loads(row.geometry)]
    if origin_id != city_a:
        geometry.reverse()
    return RoadRoute(row.distance_km, row.car_drive_minutes, row.bus_drive_minutes, geometry, "osrm")


def _store(db: Session, origin_id: str, destination_id: str, route: RoadRoute) -> None:
    city_a, city_b = sorted((origin_id, destination_id))
    geometry = route.geometry if origin_id == city_a else list(reversed(route.geometry or []))
    db.add(
        RoadRouteCache(
            city_a=city_a,
            city_b=city_b,
            distance_km=route.distance_km,
            car_drive_minutes=route.car_drive_minutes,
            bus_drive_minutes=route.bus_drive_minutes,
            geometry=json.dumps(geometry),
        )
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # another request stored the same pair first


async def get_road_route(db: Session, origin: dict, destination: dict) -> RoadRoute:
    """Road route between two cities: from the cache, from OSRM, or estimated as a last resort."""
    cached = _load_cached(db, origin["id"], destination["id"])
    if cached:
        return cached
    if settings.OSRM_URL:
        try:
            route = await fetch_osrm_route(origin, destination)
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            logger.warning("OSRM route %s -> %s failed, using an estimate: %s", origin["id"], destination["id"], exc)
        else:
            _store(db, origin["id"], destination["id"], route)
            return route
    return estimate_road_route(origin, destination)
