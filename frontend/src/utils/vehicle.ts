import { Fuel, Gauge, Zap, type LucideIcon } from 'lucide-react'
import type { I18n } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import type { CarProfileInput, Comparison, ComparisonSummary, Currency, FuelType, SelectableCar } from '@/types'

interface FuelProfile {
  labelKey: TranslationKey
  icon: LucideIcon
  unit: 'L' | 'kWh'
  priceKey: TranslationKey
  // Typical values, used as defaults when creating a car preset (strings: they prefill inputs)
  consumption: string
  price: Record<Currency, string>
}

// Per-fuel units, icons and typical values. Electric cars are measured in kWh instead of litres.
// Prices are typical pump/charging prices in each currency (not converted from each other).
export const FUEL_PROFILES: Record<FuelType, FuelProfile> = {
  petrol: { labelKey: 'fuel.petrol', icon: Fuel, unit: 'L', priceKey: 'price.fuel', consumption: '7.2', price: { EUR: '1.75', PLN: '6.20' } },
  diesel: { labelKey: 'fuel.diesel', icon: Fuel, unit: 'L', priceKey: 'price.fuel', consumption: '6.0', price: { EUR: '1.70', PLN: '6.30' } },
  lpg: { labelKey: 'fuel.lpg', icon: Gauge, unit: 'L', priceKey: 'price.lpg', consumption: '9.5', price: { EUR: '0.80', PLN: '3.10' } },
  electric: { labelKey: 'fuel.electric', icon: Zap, unit: 'kWh', priceKey: 'price.electricity', consumption: '17', price: { EUR: '0.30', PLN: '1.10' } },
}

export const FUEL_TYPES = Object.keys(FUEL_PROFILES) as FuelType[]

export const fuelProfile = (fuelType: FuelType | null | undefined): FuelProfile =>
  (fuelType && FUEL_PROFILES[fuelType]) || FUEL_PROFILES.petrol

interface Formatters {
  t: I18n['t']
  formatNumber: I18n['formatNumber']
  formatMoney: (eur: number) => string
}

// "Diesel · 5,4 L/100km · 6,89 zł/L" for a car (formatters come from the i18n and currency
// contexts so the text follows the chosen language and currency)
export function describeCar(car: Omit<CarProfileInput, 'name'>, { t, formatNumber, formatMoney }: Formatters) {
  const { labelKey, unit } = fuelProfile(car.fuel_type)
  return `${t(labelKey)} · ${formatNumber(car.consumption_per_100km)} ${unit}/100km · ${formatMoney(car.energy_price_eur)}/${unit}`
}

// Which car a saved comparison used: the preset's name, the average car of its fuel type when
// no preset was used, or "average car" when no car data was sent at all
export function comparisonCarLabel(comparison: ComparisonSummary | Comparison, t: I18n['t']) {
  if (comparison.car_name) return comparison.car_name
  if (comparison.car_fuel_type) return t(`car.avg.${comparison.car_fuel_type}`)
  return t('car.average')
}

// Name shown for a selectable car: the preset's own name, or "Average diesel car" etc.
export const carDisplayName = (car: SelectableCar, t: I18n['t']) =>
  'isAverage' in car ? t(`car.avg.${car.fuel_type}`) : car.name
