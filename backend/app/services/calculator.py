from typing import Optional

from app.models.comparison import TransportMode
from app.schemas.comparison import TransportOption


# Emission factors (kg CO2 per km per passenger)
EMISSION_FACTORS = {
    TransportMode.CAR: 0.171,  # Average petrol car
    TransportMode.TRAIN: 0.041,  # Electric train
    TransportMode.BUS: 0.089,  # Coach bus
}

# Average speeds (km/h)
AVERAGE_SPEEDS = {
    TransportMode.CAR: 80,
    TransportMode.TRAIN: 120,
    TransportMode.BUS: 70,
}

# Base costs per km (EUR)
BASE_COSTS_PER_KM = {
    TransportMode.CAR: 0.0,  # Calculated from fuel
    TransportMode.TRAIN: 0.15,
    TransportMode.BUS: 0.08,
}


# kg CO2 per unit of energy burned: litres for combustion fuels, kWh for electric
CO2_PER_UNIT = {
    "petrol": 2.31,
    "diesel": 2.68,
    "lpg": 1.51,
    # Charging from the grid isn't emission-free; ~EU average generation mix
    "electric": 0.25,
}


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
        # Default estimates
        return distance_km * 0.12, distance_km * EMISSION_FACTORS[TransportMode.CAR]

    energy_used = (distance_km / 100) * consumption_per_100km
    cost = energy_used * price_per_unit
    co2_kg = energy_used * CO2_PER_UNIT.get(fuel_type.lower(), CO2_PER_UNIT["petrol"])
    return cost, co2_kg


def calculate_transport_option(
    mode: TransportMode,
    distance_km: float,
    car_fuel_type: Optional[str] = None,
    car_consumption_l_per_100km: Optional[float] = None,
    car_fuel_price_per_liter: Optional[float] = None
) -> TransportOption:
    """Calculate time, cost, and CO2 for a transport mode."""
    speed = AVERAGE_SPEEDS[mode]
    time_minutes = (distance_km / speed) * 60

    if mode == TransportMode.CAR:
        cost, co2 = calculate_car_costs(
            distance_km, car_fuel_type, car_consumption_l_per_100km, car_fuel_price_per_liter
        )
    else:
        cost = distance_km * BASE_COSTS_PER_KM[mode]
        co2 = distance_km * EMISSION_FACTORS[mode]

    return TransportOption(
        mode=mode,
        time_minutes=round(time_minutes, 1),
        cost_eur=round(cost, 2),
        co2_kg=round(co2, 2)
    )


def calculate_comparison(
    distance_km: float,
    car_fuel_type: Optional[str] = None,
    car_consumption_l_per_100km: Optional[float] = None,
    car_fuel_price_per_liter: Optional[float] = None
) -> dict:
    """Calculate all transport options for a given distance."""
    car = calculate_transport_option(
        TransportMode.CAR, distance_km, car_fuel_type, car_consumption_l_per_100km, car_fuel_price_per_liter
    )
    train = calculate_transport_option(TransportMode.TRAIN, distance_km)
    bus = calculate_transport_option(TransportMode.BUS, distance_km)

    return {
        "car": car,
        "train": train,
        "bus": bus,
    }
