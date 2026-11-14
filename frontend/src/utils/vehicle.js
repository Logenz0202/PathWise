// Per-fuel units and sensible defaults for the car profile.
// Electric cars are measured in kWh instead of litres; the API keeps one pair of fields
// (car_consumption_l_per_100km / car_fuel_price_per_liter) and interprets them in these units.
// Prices are typical pump/charging prices in each currency (not converted from each other).
export const FUEL_PROFILES = {
  petrol: { label: 'Petrol', unit: 'L', priceLabel: 'Fuel price', consumption: '7.2', price: { EUR: '1.75', PLN: '6.20' } },
  diesel: { label: 'Diesel', unit: 'L', priceLabel: 'Fuel price', consumption: '6.0', price: { EUR: '1.70', PLN: '6.30' } },
  lpg: { label: 'LPG', unit: 'L', priceLabel: 'LPG price', consumption: '9.5', price: { EUR: '0.80', PLN: '3.10' } },
  electric: { label: 'Electric', unit: 'kWh', priceLabel: 'Electricity price', consumption: '17', price: { EUR: '0.30', PLN: '1.10' } },
}

export const fuelProfile = (fuelType) => FUEL_PROFILES[fuelType] || FUEL_PROFILES.petrol
