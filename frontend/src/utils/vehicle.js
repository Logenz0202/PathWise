import { Fuel, Gauge, Zap } from 'lucide-react'

// Per-fuel units, icons and typical values used as defaults when creating a car preset.
// Electric cars are measured in kWh instead of litres. Labels are translation keys
// (see i18n/translations.js). Prices are typical pump/charging prices in each currency
// (not converted from each other).
export const FUEL_PROFILES = {
  petrol: { labelKey: 'fuel.petrol', icon: Fuel, unit: 'L', priceKey: 'price.fuel', consumption: '7.2', price: { EUR: '1.75', PLN: '6.20' } },
  diesel: { labelKey: 'fuel.diesel', icon: Fuel, unit: 'L', priceKey: 'price.fuel', consumption: '6.0', price: { EUR: '1.70', PLN: '6.30' } },
  lpg: { labelKey: 'fuel.lpg', icon: Gauge, unit: 'L', priceKey: 'price.lpg', consumption: '9.5', price: { EUR: '0.80', PLN: '3.10' } },
  electric: { labelKey: 'fuel.electric', icon: Zap, unit: 'kWh', priceKey: 'price.electricity', consumption: '17', price: { EUR: '0.30', PLN: '1.10' } },
}

export const fuelProfile = (fuelType) => FUEL_PROFILES[fuelType] || FUEL_PROFILES.petrol

// "Diesel · 5,4 L/100km · 6,89 zł/L" for a saved car preset (formatters come from the i18n and
// currency contexts so the text follows the chosen language and currency)
export function describeCar(car, { t, formatNumber, formatMoney }) {
  const { labelKey, unit } = fuelProfile(car.fuel_type)
  return `${t(labelKey)} · ${formatNumber(car.consumption_per_100km)} ${unit}/100km · ${formatMoney(car.energy_price_eur)}/${unit}`
}
