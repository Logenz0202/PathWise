from datetime import datetime, timedelta, timezone

import pytest

TRIP = {"origin": "Warsaw", "destination": "Krakow"}


def test_create_comparison_calculates_distance_options_and_advice(client):
    response = client.post("/api/comparisons/", json=TRIP)

    assert response.status_code == 201
    body = response.json()
    assert body["distance_km"] == 295.0  # known corridor, filled in by the API
    assert body["route_source"] == "estimate"  # OSRM is disabled in tests
    for mode in ("car", "train", "bus"):
        assert body[mode]["mode"] == mode
        assert body[mode]["time_minutes"] > 0 and body[mode]["cost_eur"] > 0
    # Car and bus drive the road; the train has its own rail distance
    assert body["car"]["distance_km"] == body["bus"]["distance_km"] == 295.0
    assert body["train"]["distance_km"] != 295.0
    assert body["priority"] == "balanced"
    assert body["ai_advice"]["recommended"] in {"car", "train", "bus"}
    assert body["ai_advice"]["headline"]


def test_create_comparison_with_car_profile_and_preferences(client):
    response = client.post(
        "/api/comparisons/",
        json={
            **TRIP,
            "distance_km": 100,
            "car_name": "Tesla",
            "car_fuel_type": "electric",
            "car_consumption_l_per_100km": 18,
            "car_fuel_price_per_liter": 0.3,
            "priority": "cheapest",
            "notes": "  travelling with a dog  ",
            "currency": "PLN",
            "language": "pl",
        },
    )

    body = response.json()
    assert body["distance_km"] == 100  # the typed distance replaces the route's
    assert body["car"]["cost_eur"] == 5.4  # 18 kWh * 0.30 EUR; amounts stay in EUR
    assert body["car_name"] == "Tesla"
    assert body["notes"] == "travelling with a dog"  # trimmed before saving
    # Cheapest is the electric car; offline advice is written in Polish with PLN amounts
    assert body["ai_advice"]["recommended"] == "car"
    assert "zł" in body["ai_advice"]["reason"]


def test_list_get_and_delete_comparisons(client):
    first = client.post("/api/comparisons/", json=TRIP).json()
    second = client.post("/api/comparisons/", json={"origin": "Berlin", "destination": "Prague"}).json()

    listed = client.get("/api/comparisons/").json()
    assert [c["id"] for c in listed] == [second["id"], first["id"]]  # newest first
    assert "ai_advice" not in listed[0]  # the list is a summary

    assert client.get(f"/api/comparisons/{first['id']}").json() == first

    assert client.delete(f"/api/comparisons/{first['id']}").status_code == 204
    assert client.get(f"/api/comparisons/{first['id']}").status_code == 404
    assert [c["id"] for c in client.get("/api/comparisons/").json()] == [second["id"]]


def test_list_supports_paging(client):
    ids = [client.post("/api/comparisons/", json=TRIP).json()["id"] for _ in range(3)]

    page = client.get("/api/comparisons/", params={"skip": 1, "limit": 1}).json()
    assert [c["id"] for c in page] == [ids[1]]


def test_missing_comparison_returns_404(client):
    assert client.get("/api/comparisons/999").status_code == 404
    assert client.delete("/api/comparisons/999").status_code == 404


def test_timestamps_are_sent_as_utc(client):
    # SQLite stores datetimes without a time zone; the API must still mark them as UTC, or browsers
    # would read them as local time ("5 min ago" would be off by the UTC offset)
    created = client.post("/api/comparisons/", json=TRIP).json()
    car = {"name": "Golf", "fuel_type": "petrol", "consumption_per_100km": 6, "energy_price_eur": 1.7}
    timestamps = [
        created["created_at"],  # just saved
        client.get(f"/api/comparisons/{created['id']}").json()["created_at"],  # read back from SQLite
        client.get("/api/comparisons/").json()[0]["created_at"],
        client.post("/api/cars/", json=car).json()["created_at"],
    ]

    for value in timestamps:
        parsed = datetime.fromisoformat(value)
        assert parsed.utcoffset() == timedelta(0)
        assert abs(parsed - datetime.now(timezone.utc)) < timedelta(minutes=1)


@pytest.mark.parametrize(
    "trip, message",
    [
        ({"origin": "Atlantis", "destination": "Krakow"}, "Unknown city: Atlantis"),
        ({"origin": "Krakow", "destination": "Kraków"}, "Origin and destination are the same city"),
    ],
)
def test_comparison_needs_two_different_known_cities(client, trip, message):
    response = client.post("/api/comparisons/", json=trip)
    assert response.status_code == 422
    assert response.json()["detail"] == message
    assert client.get("/api/comparisons/").json() == []


@pytest.mark.parametrize(
    "override",
    [
        {"origin": None},
        {"distance_km": 0},
        {"priority": "scenic"},
        {"notes": "x" * 201},
        {"currency": "USD"},
        {"language": "de"},
        {"car_consumption_l_per_100km": -1},
    ],
)
def test_invalid_comparison_is_rejected(client, override):
    assert client.post("/api/comparisons/", json={**TRIP, **override}).status_code == 422
    assert client.get("/api/comparisons/").json() == []
