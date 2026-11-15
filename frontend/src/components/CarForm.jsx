import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FUEL_PROFILES, fuelProfile } from '../utils/vehicle'
import { useCurrency } from '../utils/currency'
import { useI18n } from '../i18n/LanguageContext'

const inputClass =
  'w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'

// Create/edit form for a car preset. The price is typed in the display currency and sent in EUR.
export default function CarForm({ car, onSave, onCancel }) {
  const { t } = useI18n()
  const { currency, symbol, toEur, fromEur } = useCurrency()

  const [form, setForm] = useState(() =>
    car
      ? {
          name: car.name,
          fuelType: car.fuel_type,
          consumption: String(car.consumption_per_100km),
          price: fromEur(car.energy_price_eur).toFixed(2),
        }
      : {
          name: '',
          fuelType: 'petrol',
          consumption: FUEL_PROFILES.petrol.consumption,
          price: FUEL_PROFILES.petrol.price[currency],
        }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const profile = fuelProfile(form.fuelType)

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  // Units differ between fuels (L vs kWh), so switching type loads that type's typical values
  const selectFuelType = (fuelType) => {
    const typical = fuelProfile(fuelType)
    setForm((prev) => ({ ...prev, fuelType, consumption: typical.consumption, price: typical.price[currency] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: form.name.trim(),
        fuel_type: form.fuelType,
        consumption_per_100km: parseFloat(form.consumption),
        energy_price_eur: toEur(parseFloat(form.price)),
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-4 border-primary-200">
      <label className="block">
        <span className="block text-xs font-semibold text-slate-600 mb-1">{t('cars.name')}</span>
        <input
          autoFocus
          required
          maxLength={60}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('cars.namePlaceholder')}
          className={inputClass}
        />
      </label>

      <div>
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t('car.fuelType')}</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          {Object.entries(FUEL_PROFILES).map(([value, { labelKey, icon: Icon }]) => (
            <button
              key={value}
              type="button"
              onClick={() => selectFuelType(value)}
              aria-pressed={form.fuelType === value}
              className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                form.fuelType === value
                  ? 'border-primary-500 bg-primary-50/80 text-primary-900 font-bold shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1">{t('car.consumption')}</span>
          <span className="relative block">
            <input
              type="number"
              required
              min="0.1"
              max="100"
              step="0.1"
              value={form.consumption}
              onChange={(e) => set('consumption', e.target.value)}
              className={`${inputClass} pr-24`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
              {profile.unit}/100km
            </span>
          </span>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1">{t(profile.priceKey)}</span>
          <span className="relative block">
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={`${inputClass} pr-16`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
              {symbol}/{profile.unit}
            </span>
          </span>
        </label>
      </div>

      {error && <p className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200">
          {t('cars.cancel')}
        </button>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('cars.save')}
        </button>
      </div>
    </form>
  )
}
