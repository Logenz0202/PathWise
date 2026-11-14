import pytest

from app.services.geo import calculate_road_distance, find_city, haversine_km


def test_known_corridor_distance_works_in_both_directions():
    assert calculate_road_distance("Warsaw", "Krakow") == 295.0
    assert calculate_road_distance("Krakow", "Warsaw") == 295.0


@pytest.mark.parametrize("name", ["Kraków", "krakow", "  KRAKOW ", "Krakow"])
def test_city_lookup_ignores_case_whitespace_and_diacritics(name):
    assert find_city(name)["id"] == "krakow"


def test_city_lookup_accepts_local_names():
    assert find_city("Warszawa")["id"] == "warsaw"
    assert find_city("Łódź")["id"] == "lodz"


def test_same_city_is_zero_km():
    assert calculate_road_distance("Warsaw", "Warszawa") == 0.0


def test_other_pairs_use_straight_line_times_road_factor():
    warsaw, lodz = find_city("Warsaw"), find_city("Lodz")
    straight = haversine_km(warsaw["lat"], warsaw["lng"], lodz["lat"], lodz["lng"])

    assert calculate_road_distance("Warsaw", "Lodz") == round(straight * 1.23, 1)


def test_haversine_matches_a_known_distance():
    # Warsaw - Krakow is about 252 km in a straight line
    assert haversine_km(52.2298, 21.0118, 50.0614, 19.9366) == pytest.approx(252, abs=3)


def test_unknown_city_falls_back_to_default_distance():
    assert find_city("Atlantis") is None
    assert calculate_road_distance("Atlantis", "Warsaw") == 350.0
