import { useEffect, useRef, useState } from 'react'
import { Fuel, Gauge, Zap, Pencil } from 'lucide-react'
import { FUEL_PROFILES, fuelProfile } from '../utils/vehicle'
import { CURRENCIES, useCurrency } from '../utils/currency'

const FUEL_ICONS = { petrol: Fuel, diesel: Fuel, lpg: Gauge, electric: Zap }

const inputClass =
  'w-full pl-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'

// Car profile state. The price is entered in the chosen display currency; `priceEur` is what the API gets.
export function useCarConfig() {
  const { currency, toEur } = useCurrency()
  const [config, setConfig] = useState(() => ({
    fuelType: 'petrol',
    consumption: FUEL_PROFILES.petrol.consumption,
    price: FUEL_PROFILES.petrol.price[currency],
    priceEdited: false,
  }))

  // When the currency changes: show that currency's typical price, or convert the user's own price
  const prevCurrency = useRef(currency)
  useEffect(() => {
    const from = prevCurrency.current
    if (from === currency) return
    prevCurrency.current = currency
    setConfig((prev) => {
      if (!prev.priceEdited) return { ...prev, price: fuelProfile(prev.fuelType).price[currency] }
      const converted = (parseFloat(prev.price) / CURRENCIES[from].rate) * CURRENCIES[currency].rate
      return { ...prev, price: Number.isFinite(converted) ? converted.toFixed(2) : prev.price }
    })
  }, [currency])

  // Units differ between fuels (L vs kWh), so switching type loads that type's typical values
  const selectFuelType = (fuelType) => {
    const profile = fuelProfile(fuelType)
    setConfig({ fuelType, consumption: profile.consumption, price: profile.price[currency], priceEdited: false })
  }

  const setField = (field, value) =>
    setConfig((prev) => ({ ...prev, [field]: value, ...(field === 'price' ? { priceEdited: true } : {}) }))

  const price = parseFloat(config.price)
  return {
    config,
    selectFuelType,
    setField,
    consumption: parseFloat(config.consumption) || undefined,
    priceEur: price > 0 ? toEur(price) : undefined,
  }
}

// One-line summary of the car profile; clicking it opens an editing panel above it.
export default function CarSettings({ config, selectFuelType, setField }) {
  const { symbol } = useCurrency()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const profile = fuelProfile(config.fuelType)
  const Icon = FUEL_ICONS[config.fuelType]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full px-3 py-2 rounded-xl border flex items-center gap-2 text-xs transition-colors ${
          open ? 'border-primary-400 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <Icon className="w-4 h-4 text-primary-600 shrink-0" />
        <span className="text-slate-500 shrink-0">Your car:</span>
        <span className="font-semibold text-slate-800 truncate">
          {profile.label} · {config.consumption || '–'} {profile.unit}/100km · {config.price || '–'} {symbol}/
          {profile.unit}
        </span>
        <Pencil className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3.5 space-y-3 text-xs bg-white rounded-xl border border-slate-200 shadow-xl z-20">
          <div>
            <span className="block font-medium text-slate-600 mb-1.5">Fuel type</span>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(FUEL_PROFILES).map(([value, { label }]) => {
                const FuelIcon = FUEL_ICONS[value]
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectFuelType(value)}
                    className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                      config.fuelType === value
                        ? 'border-primary-500 bg-primary-50/80 text-primary-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <FuelIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block font-medium text-slate-600 mb-1">Consumption</span>
              <span className="relative block">
                <input
                  type="number"
                  value={config.consumption}
                  onChange={(e) => setField('consumption', e.target.value)}
                  step="0.1"
                  min="0.1"
                  className={`${inputClass} pr-20`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {profile.unit}/100km
                </span>
              </span>
            </label>
            <label className="block">
              <span className="block font-medium text-slate-600 mb-1">{profile.priceLabel}</span>
              <span className="relative block">
                <input
                  type="number"
                  value={config.price}
                  onChange={(e) => setField('price', e.target.value)}
                  step="0.01"
                  min="0.01"
                  className={`${inputClass} pr-14`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {symbol}/{profile.unit}
                </span>
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
