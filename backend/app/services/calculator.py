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


def calculate_car_costs(
    distance_km: float,
    fuel_type: Optional[str],
    consumption_l_per_100km: Optional[float],
    fuel_price_per_liter: Optional[float]
) -> tuple[float, float]:
    """Calculate car cost and CO2 based on fuel parameters."""
    if not all([fuel_type, consumption_l_per_100km, fuel_price_per_liter]):
        # Default estimates
        return distance_km * 0.12, distance_km * EMISSION_FACTORS[TransportMode.CAR]
    
    # Fuel consumption for the trip
    fuel_needed_l = (distance_km / 100) * consumption_l_per_100km
    cost = fuel_needed_l * fuel_price_per_liter
    
    # CO2 varies by fuel type
    co2_per_liter = {
        "petrol": 2.31,
        "diesel": 2.68,
        "lpg": 1.51,
        "electric": 0.0,  # Depends on grid, simplified
    }.get(fuel_type.lower(), 2.31)
    
    co2_kg = fuel_needed_l * co2_per_liter
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