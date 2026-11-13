import math
from typing import Optional, Tuple

# Major cities in Poland and all its neighbours (Germany, Czechia, Slovakia, Ukraine, Belarus, Lithuania)
CITIES = {
    # Poland
    "warsaw": {"name": "Warsaw", "country": "Poland", "code": "PL", "lat": 52.2297, "lng": 21.0122},
    "warszawa": {"name": "Warsaw", "country": "Poland", "code": "PL", "lat": 52.2297, "lng": 21.0122},
    "krakow": {"name": "Kraków", "country": "Poland", "code": "PL", "lat": 50.0647, "lng": 19.9450},
    "kraków": {"name": "Kraków", "country": "Poland", "code": "PL", "lat": 50.0647, "lng": 19.9450},
    "wroclaw": {"name": "Wrocław", "country": "Poland", "code": "PL", "lat": 51.1079, "lng": 17.0385},
    "wrocław": {"name": "Wrocław", "country": "Poland", "code": "PL", "lat": 51.1079, "lng": 17.0385},
    "gdansk": {"name": "Gdańsk", "country": "Poland", "code": "PL", "lat": 54.3520, "lng": 18.6466},
    "gdańsk": {"name": "Gdańsk", "country": "Poland", "code": "PL", "lat": 54.3520, "lng": 18.6466},
    "poznan": {"name": "Poznań", "country": "Poland", "code": "PL", "lat": 52.4064, "lng": 16.9252},
    "poznań": {"name": "Poznań", "country": "Poland", "code": "PL", "lat": 52.4064, "lng": 16.9252},
    "lodz": {"name": "Łódź", "country": "Poland", "code": "PL", "lat": 51.7592, "lng": 19.4560},
    "łódź": {"name": "Łódź", "country": "Poland", "code": "PL", "lat": 51.7592, "lng": 19.4560},
    "szczecin": {"name": "Szczecin", "country": "Poland", "code": "PL", "lat": 53.4285, "lng": 14.5528},
    "katowice": {"name": "Katowice", "country": "Poland", "code": "PL", "lat": 50.2649, "lng": 19.0238},
    "lublin": {"name": "Lublin", "country": "Poland", "code": "PL", "lat": 51.2465, "lng": 22.5684},
    "bialystok": {"name": "Białystok", "country": "Poland", "code": "PL", "lat": 53.1325, "lng": 23.1688},
    "białystok": {"name": "Białystok", "country": "Poland", "code": "PL", "lat": 53.1325, "lng": 23.1688},
    "rzeszow": {"name": "Rzeszów", "country": "Poland", "code": "PL", "lat": 50.0412, "lng": 21.9991},
    "rzeszów": {"name": "Rzeszów", "country": "Poland", "code": "PL", "lat": 50.0412, "lng": 21.9991},

    # Germany
    "berlin": {"name": "Berlin", "country": "Germany", "code": "DE", "lat": 52.5200, "lng": 13.4050},
    "hamburg": {"name": "Hamburg", "country": "Germany", "code": "DE", "lat": 53.5511, "lng": 9.9937},
    "munich": {"name": "Munich", "country": "Germany", "code": "DE", "lat": 48.1351, "lng": 11.5820},
    "münchen": {"name": "Munich", "country": "Germany", "code": "DE", "lat": 48.1351, "lng": 11.5820},
    "cologne": {"name": "Cologne", "country": "Germany", "code": "DE", "lat": 50.9375, "lng": 6.9603},
    "köln": {"name": "Cologne", "country": "Germany", "code": "DE", "lat": 50.9375, "lng": 6.9603},
    "frankfurt": {"name": "Frankfurt", "country": "Germany", "code": "DE", "lat": 50.1109, "lng": 8.6821},
    "stuttgart": {"name": "Stuttgart", "country": "Germany", "code": "DE", "lat": 48.7758, "lng": 9.1829},
    "leipzig": {"name": "Leipzig", "country": "Germany", "code": "DE", "lat": 51.3397, "lng": 12.3731},
    "dresden": {"name": "Dresden", "country": "Germany", "code": "DE", "lat": 51.0504, "lng": 13.7373},
    "nuremberg": {"name": "Nuremberg", "country": "Germany", "code": "DE", "lat": 49.4521, "lng": 11.0767},
    "nürnberg": {"name": "Nuremberg", "country": "Germany", "code": "DE", "lat": 49.4521, "lng": 11.0767},

    # Czechia
    "prague": {"name": "Prague", "country": "Czechia", "code": "CZ", "lat": 50.0755, "lng": 14.4378},
    "praha": {"name": "Prague", "country": "Czechia", "code": "CZ", "lat": 50.0755, "lng": 14.4378},
    "brno": {"name": "Brno", "country": "Czechia", "code": "CZ", "lat": 49.1951, "lng": 16.6068},
    "ostrava": {"name": "Ostrava", "country": "Czechia", "code": "CZ", "lat": 49.8209, "lng": 18.2625},
    "plzen": {"name": "Plzeň", "country": "Czechia", "code": "CZ", "lat": 49.7384, "lng": 13.3736},
    "plzeń": {"name": "Plzeň", "country": "Czechia", "code": "CZ", "lat": 49.7384, "lng": 13.3736},

    # Slovakia
    "bratislava": {"name": "Bratislava", "country": "Slovakia", "code": "SK", "lat": 48.1486, "lng": 17.1077},
    "kosice": {"name": "Košice", "country": "Slovakia", "code": "SK", "lat": 48.7164, "lng": 21.2611},
    "košice": {"name": "Košice", "country": "Slovakia", "code": "SK", "lat": 48.7164, "lng": 21.2611},
    "zilina": {"name": "Žilina", "country": "Slovakia", "code": "SK", "lat": 49.2231, "lng": 18.7394},
    "žilina": {"name": "Žilina", "country": "Slovakia", "code": "SK", "lat": 49.2231, "lng": 18.7394},

    # Lithuania
    "vilnius": {"name": "Vilnius", "country": "Lithuania", "code": "LT", "lat": 54.6872, "lng": 25.2797},
    "kaunas": {"name": "Kaunas", "country": "Lithuania", "code": "LT", "lat": 54.8985, "lng": 23.9036},
    "klaipeda": {"name": "Klaipėda", "country": "Lithuania", "code": "LT", "lat": 55.7033, "lng": 21.1443},
    "klaipėda": {"name": "Klaipėda", "country": "Lithuania", "code": "LT", "lat": 55.7033, "lng": 21.1443},
    "siauliai": {"name": "Šiauliai", "country": "Lithuania", "code": "LT", "lat": 55.9333, "lng": 23.3167},
    "šiauliai": {"name": "Šiauliai", "country": "Lithuania", "code": "LT", "lat": 55.9333, "lng": 23.3167},

    # Belarus
    "minsk": {"name": "Minsk", "country": "Belarus", "code": "BY", "lat": 53.9006, "lng": 27.5590},
    "brest": {"name": "Brest", "country": "Belarus", "code": "BY", "lat": 52.0976, "lng": 23.7341},
    "grodno": {"name": "Grodno", "country": "Belarus", "code": "BY", "lat": 53.6694, "lng": 23.8131},
    "gomel": {"name": "Gomel", "country": "Belarus", "code": "BY", "lat": 52.4345, "lng": 30.9754},
    "vitebsk": {"name": "Vitebsk", "country": "Belarus", "code": "BY", "lat": 55.1904, "lng": 30.2049},
    "mogilev": {"name": "Mogilev", "country": "Belarus", "code": "BY", "lat": 53.9168, "lng": 30.3449},

    # Ukraine
    "kyiv": {"name": "Kyiv", "country": "Ukraine", "code": "UA", "lat": 50.4501, "lng": 30.5234},
    "kiev": {"name": "Kyiv", "country": "Ukraine", "code": "UA", "lat": 50.4501, "lng": 30.5234},
    "kharkiv": {"name": "Kharkiv", "country": "Ukraine", "code": "UA", "lat": 49.9935, "lng": 36.2304},
    "odesa": {"name": "Odesa", "country": "Ukraine", "code": "UA", "lat": 46.4825, "lng": 30.7233},
    "odessa": {"name": "Odesa", "country": "Ukraine", "code": "UA", "lat": 46.4825, "lng": 30.7233},
    "dnipro": {"name": "Dnipro", "country": "Ukraine", "code": "UA", "lat": 48.4647, "lng": 35.0462},
    "lviv": {"name": "Lviv", "country": "Ukraine", "code": "UA", "lat": 49.8397, "lng": 24.0297},
    "zaporizhzhia": {"name": "Zaporizhzhia", "country": "Ukraine", "code": "UA", "lat": 47.8388, "lng": 35.1396},
}

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
    k1 = origin.strip().lower()
    k2 = destination.strip().lower()

    if (k1, k2) in KNOWN_ROAD_DISTANCES:
        return KNOWN_ROAD_DISTANCES[(k1, k2)]
    if (k2, k1) in KNOWN_ROAD_DISTANCES:
        return KNOWN_ROAD_DISTANCES[(k2, k1)]

    city1 = CITIES.get(k1)
    city2 = CITIES.get(k2)

    if city1 and city2:
        straight_km = haversine_km(city1["lat"], city1["lng"], city2["lat"], city2["lng"])
        return round(straight_km * 1.23, 1)

    return 350.0
