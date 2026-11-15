import asyncio

import httpx
import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services import routing
from app.services.geo import find_city
from app.services.routing import RoadRoute, coach_drive_minutes, get_road_route, parse_osrm, simplify

WARSAW, BERLIN = find_city("Warsaw"), find_city("Berlin")


def osrm_reply(distance_m=570_800, duration_s=20_580, segments=((1000, 30), (1000, 60))):
    """A minimal OSRM /route response: two legs' worth of annotation and a short line."""
    return {
        "code": "Ok",
        "routes": [
            {
                "distance": distance_m,
                "duration": duration_s,
                "geometry": {"coordinates": [[21.0122, 52.2298], [17.0, 52.4], [13.4105, 52.5244]]},
                "legs": [
                    {
                        "annotation": {
                            "distance": [d for d, _ in segments],
                            "duration": [t for _, t in segments],
                        }
                    }
                ],
            }
        ],
    }


# --- Parsing and geometry (no network, no database) -------------------------------------------


def test_coach_is_capped_at_100_kmh_per_segment():
    # 1 km in 30 s is 120 km/h -> the coach needs 36 s; 1 km in 60 s (60 km/h) is unchanged
    assert coach_drive_minutes([1000, 1000], [30, 60]) == pytest.approx((36 + 60) / 60)


def test_parse_osrm_reads_distance_times_and_lat_lng_geometry():
    route = parse_osrm(osrm_reply())

    assert route.source == "osrm"
    assert route.distance_km == 570.8
    assert route.car_drive_minutes == pytest.approx(343)
    assert route.bus_drive_minutes == pytest.approx(96 / 60)
    # OSRM sends [lng, lat]; the app uses (lat, lng)
    assert route.geometry[0] == (52.2298, 21.0122)
    assert route.geometry[-1] == (52.5244, 13.4105)


@pytest.mark.parametrize("reply", [{"code": "NoRoute", "message": "Impossible route"}, {"code": "Ok", "routes": []}])
def test_parse_osrm_rejects_replies_without_a_route(reply):
    with pytest.raises(ValueError):
        parse_osrm(reply)


def test_simplify_drops_points_on_a_straight_line_but_keeps_corners():
    straight = [(0.0, x / 10) for x in range(11)]
    assert simplify(straight) == [(0.0, 0.0), (0.0, 1.0)]

    corner = [(0.0, 0.0), (0.0, 0.5), (0.0, 1.0), (0.5, 1.0), (1.0, 1.0)]
    assert simplify(corner) == [(0.0, 0.0), (0.0, 1.0), (1.0, 1.0)]


def test_scaled_route_stretches_times_with_the_distance():
    route = RoadRoute(100, 60, 70, None, "osrm").scaled_to(150)
    assert (route.distance_km, route.car_drive_minutes, route.bus_drive_minutes) == (150, 90, 105)


# --- Fetching, caching and fallback (HTTP mocked, PostgreSQL test database) -------------------


@pytest.fixture
def empty_cache(db_engine):
    with db_engine.begin() as conn:
        conn.execute(text("TRUNCATE road_routes RESTART IDENTITY"))
    return db_engine


@pytest.fixture
def osrm(monkeypatch, empty_cache):
    """Enable OSRM against a mocked transport; returns the list of requests made."""
    calls = []
    real_client = httpx.AsyncClient

    def install(handler):
        def recording_handler(request):
            calls.append(request)
            return handler(request)

        monkeypatch.setattr(routing.settings, "OSRM_URL", "https://osrm.test")
        monkeypatch.setattr(routing, "MIN_REQUEST_INTERVAL_SECONDS", 0)
        monkeypatch.setattr(
            routing.httpx,
            "AsyncClient",
            lambda **kwargs: real_client(transport=httpx.MockTransport(recording_handler), **kwargs),
        )
        return calls

    return install


def route_between(db_engine, origin, destination):
    with Session(db_engine) as db:
        return asyncio.run(get_road_route(db, origin, destination))


def test_route_is_fetched_once_then_served_from_the_database(osrm, db_engine):
    calls = osrm(lambda request: httpx.Response(200, json=osrm_reply()))

    first = route_between(db_engine, WARSAW, BERLIN)
    second = route_between(db_engine, WARSAW, BERLIN)

    assert len(calls) == 1
    assert calls[0].headers["User-Agent"].startswith("PathWise/")
    # OSRM takes lng,lat pairs
    expected = f"{WARSAW['lng']},{WARSAW['lat']};{BERLIN['lng']},{BERLIN['lat']}"
    assert f"/route/v1/driving/{expected}?" in str(calls[0].url)
    assert first == second


def test_reverse_trip_reuses_the_cached_route_with_the_line_reversed(osrm, db_engine):
    calls = osrm(lambda request: httpx.Response(200, json=osrm_reply()))

    there = route_between(db_engine, WARSAW, BERLIN)
    back = route_between(db_engine, BERLIN, WARSAW)

    assert len(calls) == 1
    assert back.geometry == list(reversed(there.geometry))
    assert back.distance_km == there.distance_km


@pytest.mark.parametrize(
    "handler",
    [
        lambda request: httpx.Response(503),
        lambda request: httpx.Response(200, json={"code": "NoRoute"}),
        lambda request: (_ for _ in ()).throw(httpx.ConnectError("offline")),
    ],
    ids=["server error", "no route", "offline"],
)
def test_osrm_problems_fall_back_to_an_uncached_estimate(osrm, db_engine, handler):
    calls = osrm(handler)

    route = route_between(db_engine, WARSAW, BERLIN)

    assert route.source == "estimate"
    assert route.geometry is None
    assert route.distance_km == 572.0  # known corridor
    # Not cached: the next request tries OSRM again
    route_between(db_engine, WARSAW, BERLIN)
    assert len(calls) == 2


def test_disabled_osrm_uses_the_estimate_without_any_request(empty_cache):
    route = route_between(empty_cache, WARSAW, BERLIN)
    assert route.source == "estimate"
    assert route.car_drive_minutes == pytest.approx(572 / 80 * 60)
