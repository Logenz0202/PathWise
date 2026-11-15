"""Door-to-door time, cost and CO2 of each transport mode for one trip.

Car and bus follow the real road route (see routing.py); the train is estimated from typical
long-distance train speeds per country, because no free rail router covers the whole region.
"""

import math
from typing import Optional

from app.models.comparison import TransportMode
from app.schemas.comparison import TransportOption
from app.services.geo import haversine_km
from app.services.routing import RoadRoute

# Emission factors (kg CO2 per km per passenger)
EMISSION_FACTORS = {
    TransportMode.CAR: 0.171,  # Average petrol car
    TransportMode.TRAIN: 0.041,  # Electric train
    TransportMode.BUS: 0.089,  # Coach bus
}

# Door-to-door overhead for public transport: getting to the station/stop and waiting (minutes).
# Makes the car competitive on short trips. Mirrored as accessMinutes in frontend/src/utils/transport.ts
ACCESS_MINUTES = {
    TransportMode.CAR: 0,
    TransportMode.TRAIN: 40,
    TransportMode.BUS: 30,
}

# Ticket cost per km for public transport (EUR); car cost comes from the car profile
FARE_PER_KM = {
    TransportMode.TRAIN: 0.15,
    TransportMode.BUS: 0.08,
}

# Car estimate when no car profile is given (EUR per km)
DEFAULT_CAR_COST_PER_KM = 0.12

# kg CO2 per unit of energy burned: litres for combustion fuels, kWh for electric
CO2_PER_UNIT = {
    "petrol": 2.31,
    "diesel": 2.68,
    "lpg": 1.51,
    # Charging from the grid isn't emission-free; ~EU average generation mix
    "electric": 0.25,
}

# Routing times assume empty roads; allow for traffic (car and bus share the roads)
ROAD_TRAFFIC_FACTOR = 1.05
# Drivers stop for 15 minutes after every 4 hours at the wheel
CAR_BREAK_EVERY_MINUTES = 240
CAR_BREAK_MINUTES = 15
# Waiting at a road border outside Schengen (passport and customs checks)
ROAD_BORDER_MINUTES = 90

# Coach (driving time is already capped at coach speed by the router): a short stop roughly every
# 100 km and the 45-minute driver break EU rules require after 4.5 hours of driving
BUS_STOP_MINUTES_PER_100KM = 5
BUS_BREAK_EVERY_MINUTES = 270
BUS_BREAK_MINUTES = 45

# Train: track is less direct than a straight line
RAIL_DETOUR_FACTOR = 1.2
# Typical average speed of long-distance trains including stops (km/h)
RAIL_SPEED_KMH = {"DE": 115, "PL": 105, "CZ": 85, "SK": 85, "LT": 70, "BY": 70, "UA": 80}
DEFAULT_RAIL_SPEED_KMH = 90
# Short trips run on slower regional trains
REGIONAL_MAX_KM = 150
REGIONAL_SPEED_FACTOR = 0.75
# Crossing a border: a short stop inside Schengen, passport control outside it, and changing trains
# (or bogies) where standard gauge meets the 1520 mm broad gauge of Lithuania, Belarus and Ukraine
SCHENGEN = {"PL", "DE", "CZ", "SK", "LT"}
BROAD_GAUGE = {"LT", "BY", "UA"}
SCHENGEN_BORDER_MINUTES = 10
PASSPORT_CONTROL_MINUTES = 120
GAUGE_CHANGE_MINUTES = 60


def rest_breaks(drive_minutes: float, every: float, length: float) -> float:
    """Total break time when stopping after every `every` minutes of driving (none at the end)."""
    return max(0, math.ceil(drive_minutes / every) - 1) * length


def road_border_minutes(origin: Optional[dict], destination: Optional[dict]) -> float:
    """Border wait for a road trip: none inside Schengen, passport checks outside it."""
    if not origin or not destination or origin["code"] == destination["code"]:
        return 0
    inside_schengen = origin["code"] in SCHENGEN and destination["code"] in SCHENGEN
    return 0 if inside_schengen else ROAD_BORDER_MINUTES


def car_minutes(route: RoadRoute, border: float = 0) -> float:
    drive = route.car_drive_minutes * ROAD_TRAFFIC_FACTOR
    return drive + rest_breaks(drive, CAR_BREAK_EVERY_MINUTES, CAR_BREAK_MINUTES) + border


def bus_minutes(route: RoadRoute, border: float = 0) -> float:
    drive = route.bus_drive_minutes * ROAD_TRAFFIC_FACTOR
    stops = route.distance_km / 100 * BUS_STOP_MINUTES_PER_100KM
    breaks = rest_breaks(drive, BUS_BREAK_EVERY_MINUTES, BUS_BREAK_MINUTES)
    return drive + stops + breaks + border + ACCESS_MINUTES[TransportMode.BUS]


def border_minutes(country_a: str, country_b: str) -> float:
    if country_a == country_b:
        return 0
    both_schengen = country_a in SCHENGEN and country_b in SCHENGEN
    minutes = SCHENGEN_BORDER_MINUTES if both_schengen else PASSPORT_CONTROL_MINUTES
    if (country_a in BROAD_GAUGE) != (country_b in BROAD_GAUGE):
        minutes += GAUGE_CHANGE_MINUTES
    return minutes


def train_trip(origin: Optional[dict], destination: Optional[dict], road_km: float) -> tuple[float, float]:
    """Estimated rail distance (km) and door-to-door time (minutes) between two cities."""
    if origin and destination:
        km = haversine_km(origin["lat"], origin["lng"], destination["lat"], destination["lng"]) * RAIL_DETOUR_FACTOR
        speeds = [RAIL_SPEED_KMH.get(city["code"], DEFAULT_RAIL_SPEED_KMH) for city in (origin, destination)]
        speed = sum(speeds) / len(speeds)
        border = border_minutes(origin["code"], destination["code"])
    else:
        km, speed, border = road_km, DEFAULT_RAIL_SPEED_KMH, 0
    if km < REGIONAL_MAX_KM:
        speed *= REGIONAL_SPEED_FACTOR
    return km, km / speed * 60 + border + ACCESS_MINUTES[TransportMode.TRAIN]


def calculate_car_costs(
    distance_km: float,
    fuel_type: Optional[str],
    consumption_per_100km: Optional[float],
    price_per_unit: Optional[float]
) -> tuple[float, float]:
    """Calculate car cost and CO2 from the car profile.

    Units follow the fuel type: L/100km and EUR/L for petrol, diesel and LPG;
    kWh/100km and EUR/kWh for electric.
    """
    if not all([fuel_type, consumption_per_100km, price_per_unit]):
        return distance_km * DEFAULT_CAR_COST_PER_KM, distance_km * EMISSION_FACTORS[TransportMode.CAR]

    energy_used = (distance_km / 100) * consumption_per_100km
    cost = energy_used * price_per_unit
    co2_kg = energy_used * CO2_PER_UNIT.get(fuel_type.lower(), CO2_PER_UNIT["petrol"])
    return cost, co2_kg


def _option(mode: TransportMode, distance_km: float, minutes: float, cost: float, co2: float) -> TransportOption:
    return TransportOption(
        mode=mode,
        distance_km=round(distance_km, 1),
        time_minutes=round(minutes, 1),
        cost_eur=round(cost, 2),
        co2_kg=round(co2, 2),
    )


def calculate_comparison(
    route: RoadRoute,
    origin: Optional[dict] = None,
    destination: Optional[dict] = None,
    car_fuel_type: Optional[str] = None,
    car_consumption_l_per_100km: Optional[float] = None,
    car_fuel_price_per_liter: Optional[float] = None,
) -> dict[str, TransportOption]:
    """Time, cost and CO2 of car, train and bus for a trip along `route` between two cities."""
    road_km = route.distance_km
    car_cost, car_co2 = calculate_car_costs(
        road_km, car_fuel_type, car_consumption_l_per_100km, car_fuel_price_per_liter
    )
    rail_km, rail_minutes = train_trip(origin, destination, road_km)
    border = road_border_minutes(origin, destination)

    return {
        "car": _option(TransportMode.CAR, road_km, car_minutes(route, border), car_cost, car_co2),
        "train": _option(
            TransportMode.TRAIN,
            rail_km,
            rail_minutes,
            rail_km * FARE_PER_KM[TransportMode.TRAIN],
            rail_km * EMISSION_FACTORS[TransportMode.TRAIN],
        ),
        "bus": _option(
            TransportMode.BUS,
            road_km,
            bus_minutes(route, border),
            road_km * FARE_PER_KM[TransportMode.BUS],
            road_km * EMISSION_FACTORS[TransportMode.BUS],
        ),
    }
