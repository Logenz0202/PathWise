def test_health(client):
    assert client.get("/health").json() == {"status": "healthy"}


def test_cities_list(client):
    cities = client.get("/api/geo/cities").json()

    assert len(cities) > 1000
    assert {"id", "name", "lat", "lng"} <= set(cities[0])
    # Sorted by population, biggest first
    assert cities[0]["pop"] >= cities[-1]["pop"]


def test_distance_endpoint(client):
    response = client.get("/api/geo/distance", params={"origin": "Warszawa", "destination": "Berlin"})
    assert response.json() == {"origin": "Warszawa", "destination": "Berlin", "distance_km": 572.0}


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
