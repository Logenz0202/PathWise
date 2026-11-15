import json
import math
import unicodedata
from pathlib import Path
from typing import Optional

# Cities with 15k+ population in Poland and its neighbours (Germany, Czechia, Slovakia, Ukraine,
# Belarus, Lithuania). Generated from GeoNames by scripts/build_cities.mjs; sorted by population.
CITY_LIST = json.loads((Path(__file__).resolve().parent.parent / "data" / "cities.json").read_text(encoding="utf-8"))


def _normalize(s: str) -> str:
    s = unicodedata.normalize("NFD", s.strip().lower().replace("ł", "l"))
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")


# Lookup by normalized id, name and aliases -> city dict. Bigger cities win on collisions.
CITIES: dict = {}
for _city in CITY_LIST:
    for _key in [_city["id"], _city["name"], *_city.get("alt", [])]:
        CITIES.setdefault(_normalize(_key), _city)


def find_city(name: str) -> Optional[dict]:
    return CITIES.get(_normalize(name)) if name else None


# Highway distances for popular corridors
KNOWN_ROAD_DISTANCES = {
    ("warsaw", "berlin"): 572.0,
    ("warsaw", "krakow"): 295.0,
    ("warsaw", "wroclaw"): 355.0,
    ("warsaw", "gdansk"): 342.0,
    ("warsaw", "poznan"): 310.0,
    ("warsaw", "prague"): 678.0,
    ("warsaw", "bratislava"): 650.0,
    ("warsaw", "vilnius"): 460.0,
    ("warsaw", "minsk"): 550.0,
    ("warsaw", "brest"): 200.0,
    ("warsaw", "grodno"): 270.0,
    ("warsaw", "lviv"): 395.0,
    ("warsaw", "kyiv"): 780.0,
    ("krakow", "prague"): 535.0,
    ("krakow", "bratislava"): 380.0,
    ("krakow", "wroclaw"): 270.0,
    ("krakow", "gdansk"): 590.0,
    ("krakow", "berlin"): 600.0,
    ("krakow", "lviv"): 330.0,
    ("wroclaw", "berlin"): 340.0,
    ("wroclaw", "prague"): 330.0,
    ("berlin", "prague"): 350.0,
    ("berlin", "munich"): 585.0,
    ("berlin", "hamburg"): 290.0,
    ("berlin", "cologne"): 575.0,
    ("berlin", "frankfurt"): 550.0,
    ("berlin", "leipzig"): 190.0,
    ("berlin", "dresden"): 190.0,
    ("prague", "bratislava"): 330.0,
    ("prague", "brno"): 205.0,
    ("prague", "ostrava"): 370.0,
    ("bratislava", "kosice"): 400.0,
    ("minsk", "brest"): 350.0,
    ("minsk", "grodno"): 290.0,
    ("minsk", "gomel"): 310.0,
    ("vilnius", "kaunas"): 105.0,
    ("vilnius", "klaipeda"): 310.0,
    ("kyiv", "lviv"): 540.0,
    ("kyiv", "odesa"): 475.0,
    ("kyiv", "kharkiv"): 480.0,
    ("kyiv", "dnipro"): 480.0,
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def calculate_road_distance(origin: str, destination: str) -> float:
    """Calculate realistic road driving distance in kilometers between two cities."""
    city1 = find_city(origin)
    city2 = find_city(destination)

    if city1 and city2:
        if city1["id"] == city2["id"]:
            return 0.0
        k1, k2 = city1["id"], city2["id"]
        if (k1, k2) in KNOWN_ROAD_DISTANCES:
            return KNOWN_ROAD_DISTANCES[(k1, k2)]
        if (k2, k1) in KNOWN_ROAD_DISTANCES:
            return KNOWN_ROAD_DISTANCES[(k2, k1)]
        straight_km = haversine_km(city1["lat"], city1["lng"], city2["lat"], city2["lng"])
        return round(straight_km * 1.23, 1)

    return 350.0


def resolve_trip(origin: str, destination: str) -> tuple[dict, dict]:
    """Both cities of a trip from the city list. Raises ValueError for unknown or identical cities."""
    cities = []
    for name in (origin, destination):
        city = find_city(name)
        if city is None:
            raise ValueError(f"Unknown city: {name}")
        cities.append(city)
    if cities[0]["id"] == cities[1]["id"]:
        raise ValueError("Origin and destination are the same city")
    return cities[0], cities[1]
