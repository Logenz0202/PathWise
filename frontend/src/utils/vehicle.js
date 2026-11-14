// Per-fuel units and sensible defaults for the car profile.
// Electric cars are measured in kWh instead of litres; the API keeps one pair of fields
// (car_consumption_l_per_100km / car_fuel_price_per_liter) and interprets them in these units.
export const FUEL_PROFILES = {
  petrol: { label: 'Petrol', unit: 'L', priceLabel: 'Fuel price', consumption: '7.2', price: '1.75' },
  diesel: { label: 'Diesel', unit: 'L', priceLabel: 'Fuel price', consumption: '6.0', price: '1.70' },
  lpg: { label: 'LPG', unit: 'L', priceLabel: 'LPG price', consumption: '9.5', price: '0.80' },
  electric: { label: 'Electric', unit: 'kWh', priceLabel: 'Electricity price', consumption: '17', price: '0.30' },
}

export const fuelProfile = (fuelType) => FUEL_PROFILES[fuelType] || FUEL_PROFILES.petrol
