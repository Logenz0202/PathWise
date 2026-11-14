import pytest

from app.models.comparison import TransportMode
from app.services.calculator import calculate_car_costs, calculate_comparison, calculate_transport_option


def test_comparison_without_car_profile_uses_average_car():
    result = calculate_comparison(distance_km=100)

    assert set(result) == {"car", "train", "bus"}
    car, train, bus = result["car"], result["train"], result["bus"]
    # Car: 80 km/h, no access time, 0.12 EUR/km, 0.171 kg/km
    assert (car.time_minutes, car.cost_eur, car.co2_kg) == (75.0, 12.0, 17.1)
    # Train: 120 km/h + 40 min to the station, 0.15 EUR/km, 0.041 kg/km
    assert (train.time_minutes, train.cost_eur, train.co2_kg) == (90.0, 15.0, 4.1)
    # Bus: 70 km/h + 30 min to the stop, 0.08 EUR/km, 0.089 kg/km
    assert (bus.time_minutes, bus.cost_eur, bus.co2_kg) == (115.7, 8.0, 8.9)


def test_petrol_profile_cost_and_emissions():
    # 200 km at 6 L/100km = 12 L; 12 L * 1.50 EUR = 18 EUR; 12 L * 2.31 kg = 27.72 kg
    cost, co2 = calculate_car_costs(200, "petrol", 6, 1.5)
    assert cost == pytest.approx(18.0)
    assert co2 == pytest.approx(27.72)


def test_electric_profile_uses_kwh_and_grid_emissions():
    # 100 km at 18 kWh/100km = 18 kWh; 18 * 0.30 EUR = 5.40 EUR; 18 * 0.25 kg = 4.5 kg
    cost, co2 = calculate_car_costs(100, "electric", 18, 0.3)
    assert cost == pytest.approx(5.4)
    assert co2 == pytest.approx(4.5)


def test_fuel_type_is_case_insensitive_and_unknown_falls_back_to_petrol():
    assert calculate_car_costs(100, "DIESEL", 5, 1.6) == calculate_car_costs(100, "diesel", 5, 1.6)
    assert calculate_car_costs(100, "hydrogen", 5, 1.6) == calculate_car_costs(100, "petrol", 5, 1.6)


@pytest.mark.parametrize(
    "profile",
    [(None, 6, 1.5), ("petrol", None, 1.5), ("petrol", 6, None)],
)
def test_incomplete_car_profile_falls_back_to_average_car(profile):
    assert calculate_car_costs(100, *profile) == pytest.approx((12.0, 17.1))


def test_car_profile_only_affects_the_car():
    plain = calculate_comparison(distance_km=300)
    with_profile = calculate_comparison(300, "diesel", 5, 1.6)

    assert with_profile["car"] != plain["car"]
    assert with_profile["train"] == plain["train"]
    assert with_profile["bus"] == plain["bus"]


def test_public_transport_includes_access_time_so_car_wins_short_trips():
    car = calculate_transport_option(TransportMode.CAR, 20)
    train = calculate_transport_option(TransportMode.TRAIN, 20)
    assert car.time_minutes < train.time_minutes
