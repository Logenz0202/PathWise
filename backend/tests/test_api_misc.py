import pytest


def test_health(client):
    assert client.get("/health").json() == {"status": "healthy"}


def test_cities_list(client):
    cities = client.get("/api/geo/cities").json()

    assert len(cities) > 1000
    assert {"id", "name", "lat", "lng"} <= set(cities[0])
    # Sorted by population, biggest first
    assert cities[0]["pop"] >= cities[-1]["pop"]


def test_route_endpoint_returns_distance_and_times_per_mode(client):
    # OSRM is disabled in tests, so this is the estimate (known corridor distance, no map line)
    body = client.get("/api/geo/route", params={"origin": "Warszawa", "destination": "Berlin"}).json()

    assert (body["origin"], body["destination"]) == ("Warsaw", "Berlin")  # names from the city list
    assert body["distance_km"] == 572.0
    assert body["source"] == "estimate"
    assert body["geometry"] is None
    for mode in ("car", "train", "bus"):
        assert body[mode]["time_minutes"] > 0 and body[mode]["distance_km"] > 0



def test_route_endpoint_scales_times_to_a_typed_distance(client):
    params = {"origin": "Warsaw", "destination": "Berlin"}
    normal = client.get("/api/geo/route", params=params).json()
    longer = client.get("/api/geo/route", params={**params, "distance_km": 700}).json()

    assert longer["distance_km"] == 700
    assert longer["car"]["time_minutes"] > normal["car"]["time_minutes"]
    assert client.get("/api/geo/route", params={**params, "distance_km": 0}).status_code == 422


@pytest.mark.parametrize(
    "params, message",
    [
        ({"origin": "Atlantis", "destination": "Berlin"}, "Unknown city: Atlantis"),
        ({"origin": "Warsaw", "destination": "Warszawa"}, "Origin and destination are the same city"),
    ],
)
def test_route_endpoint_rejects_unknown_and_identical_cities(client, params, message):
    response = client.get("/api/geo/route", params=params)
    assert response.status_code == 422
    assert response.json()["detail"] == message


def test_cors_allows_the_frontend_origin(client):
    response = client.options(
        "/api/cars/",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_other_origins(client):
    response = client.options(
        "/api/cars/",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in response.headers
