import pytest

CAR = {"name": "Family Skoda", "fuel_type": "diesel", "consumption_per_100km": 5.5, "energy_price_eur": 1.6}


def test_car_crud_flow(client):
    created = client.post("/api/cars/", json=CAR)
    assert created.status_code == 201
    car = created.json()
    assert car["id"] > 0 and car["created_at"]
    assert {k: car[k] for k in CAR} == CAR

    assert client.get(f"/api/cars/{car['id']}").json() == car
    assert client.get("/api/cars/").json() == [car]

    updated = client.put(f"/api/cars/{car['id']}", json={**CAR, "name": "Tesla", "fuel_type": "electric"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Tesla" and updated.json()["fuel_type"] == "electric"

    assert client.delete(f"/api/cars/{car['id']}").status_code == 204
    assert client.get("/api/cars/").json() == []


def test_cars_are_listed_oldest_first(client):
    for name in ["First", "Second", "Third"]:
        client.post("/api/cars/", json={**CAR, "name": name})

    assert [c["name"] for c in client.get("/api/cars/").json()] == ["First", "Second", "Third"]


@pytest.mark.parametrize(
    "method, body",
    [("get", None), ("put", CAR), ("delete", None)],
)
def test_missing_car_returns_404(client, method, body):
    response = client.request(method, "/api/cars/999", json=body)
    assert response.status_code == 404
    assert response.json()["detail"] == "Car not found"


@pytest.mark.parametrize(
    "override",
    [
        {"fuel_type": "steam"},
        {"name": ""},
        {"name": "x" * 61},
        {"consumption_per_100km": 0},
        {"energy_price_eur": 25},
    ],
)
def test_invalid_car_is_rejected(client, override):
    assert client.post("/api/cars/", json={**CAR, **override}).status_code == 422
    assert client.get("/api/cars/").json() == []
