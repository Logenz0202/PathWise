import pytest

from app.services.calculator import (
    BUS_BREAK_MINUTES,
    PASSPORT_CONTROL_MINUTES,
    ROAD_BORDER_MINUTES,
    ROAD_TRAFFIC_FACTOR,
    border_minutes,
    bus_minutes,
    calculate_car_costs,
    calculate_comparison,
    car_minutes,
    rest_breaks,
    train_trip,
)
from app.services.geo import find_city
from app.services.routing import RoadRoute

WARSAW, KRAKOW, BERLIN, KYIV, LODZ = (find_city(n) for n in ("Warsaw", "Krakow", "Berlin", "Kyiv", "Lodz"))


def road(km=300.0, car=200.0, bus=None):
    """A road route of `km` km; car/bus driving minutes as a router would return them."""
    return RoadRoute(km, car, bus if bus is not None else car, None, "osrm")


# --- Car and bus ------------------------------------------------------------------------------


def test_rest_breaks_only_between_driving_blocks():
    assert rest_breaks(239, 240, 15) == 0
    assert rest_breaks(240, 240, 15) == 0  # arriving exactly after 4 h: no break needed
    assert rest_breaks(241, 240, 15) == 15
    assert rest_breaks(500, 240, 15) == 30


def test_car_time_adds_traffic_and_breaks():
    assert car_minutes(road(car=100)) == pytest.approx(100 * ROAD_TRAFFIC_FACTOR)
    # 300 min of driving with traffic -> one 15-minute break
    assert car_minutes(road(car=300)) == pytest.approx(300 * ROAD_TRAFFIC_FACTOR + 15)


def test_bus_is_slower_than_car_on_the_same_road():
    # Same roads, but the bus is capped at coach speed, stops on the way and needs 30 min to the stop
    route = road(km=570, car=343, bus=371)
    assert bus_minutes(route) > car_minutes(route)


def test_bus_driver_takes_the_legal_break_after_4_5_hours():
    short = bus_minutes(road(km=300, bus=200))
    long = bus_minutes(road(km=300, bus=300))
    assert long - short == pytest.approx(100 * ROAD_TRAFFIC_FACTOR + BUS_BREAK_MINUTES)


def test_road_border_wait_only_outside_schengen():
    route = road(km=800, car=600, bus=700)
    inside = calculate_comparison(route, WARSAW, BERLIN)
    outside = calculate_comparison(route, WARSAW, KYIV)
    assert outside["car"].time_minutes - inside["car"].time_minutes == pytest.approx(ROAD_BORDER_MINUTES, abs=0.1)
    assert outside["bus"].time_minutes - inside["bus"].time_minutes == pytest.approx(ROAD_BORDER_MINUTES, abs=0.1)


# --- Train ------------------------------------------------------------------------------------


def test_border_minutes():
    assert border_minutes("PL", "PL") == 0
    assert border_minutes("PL", "DE") == 10  # Schengen
    assert border_minutes("PL", "LT") == 10 + 60  # Schengen, but broad gauge in Lithuania
    assert border_minutes("PL", "UA") == PASSPORT_CONTROL_MINUTES + 60
    assert border_minutes("BY", "UA") == PASSPORT_CONTROL_MINUTES  # both broad gauge


def test_domestic_train_runs_at_the_country_speed():
    km_pl, minutes_pl = train_trip(WARSAW, KRAKOW, 300)
    assert 250 < km_pl < 350
    domestic_speed = km_pl / (minutes_pl - 40) * 60
    assert domestic_speed == pytest.approx(105, abs=1)


def test_short_train_trips_use_slower_regional_trains():
    km, minutes = train_trip(WARSAW, LODZ, 130)
    assert km < 150
    assert km / (minutes - 40) * 60 == pytest.approx(105 * 0.75, abs=1)


def test_train_without_known_cities_uses_road_distance():
    km, minutes = train_trip(None, None, 300)
    assert km == 300
    assert minutes == pytest.approx(300 / 90 * 60 + 40)


# --- Whole comparison and car costs -----------------------------------------------------------


def test_comparison_without_car_profile_uses_average_car():
    result = calculate_comparison(road(km=100, car=60), WARSAW, KRAKOW)

    assert set(result) == {"car", "train", "bus"}
    car, train, bus = result["car"], result["train"], result["bus"]
    # Car: 0.12 EUR/km, 0.171 kg/km over the road distance
    assert (car.distance_km, car.cost_eur, car.co2_kg) == (100, 12.0, 17.1)
    # Bus: 0.08 EUR/km, 0.089 kg/km over the road distance
    assert (bus.distance_km, bus.cost_eur, bus.co2_kg) == (100, 8.0, 8.9)
    # Train: priced on its own rail distance
    assert train.cost_eur == pytest.approx(train.distance_km * 0.15, abs=0.01)


def test_car_profile_only_affects_the_car():
    route = road()
    plain = calculate_comparison(route, WARSAW, KRAKOW)
    with_profile = calculate_comparison(route, WARSAW, KRAKOW, "diesel", 5, 1.6)

    assert with_profile["car"] != plain["car"]
    assert with_profile["train"] == plain["train"]
    assert with_profile["bus"] == plain["bus"]


def test_public_transport_access_time_lets_the_car_win_short_trips():
    result = calculate_comparison(road(km=20, car=20), WARSAW, LODZ)
    assert result["car"].time_minutes < result["train"].time_minutes
    assert result["car"].time_minutes < result["bus"].time_minutes


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
