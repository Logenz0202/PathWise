import { useState, type FormEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import Alert from '../ui/Alert'
import ChoiceButton from '../ui/ChoiceButton'
import TextInput from '../ui/TextInput'
import { FUEL_PROFILES, FUEL_TYPES, fuelProfile } from '../../utils/vehicle'
import { useCurrency } from '../../utils/currency'
import { useI18n } from '../../i18n/LanguageContext'
import type { CarProfile, CarProfileInput, FuelType } from '../../types'

interface CarFormProps {
  car?: CarProfile
  onSave: (data: CarProfileInput) => Promise<void>
  onCancel: () => void
}

// Input values are kept as typed (strings) and parsed on submit
interface FormState {
  name: string
  fuelType: FuelType
  consumption: string
  price: string
}

// Small label above a form control
function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="block text-xs font-semibold text-slate-600 mb-1">{children}</span>
}

// Create/edit form for a car preset. The price is typed in the display currency and sent in EUR.
export default function CarForm({ car, onSave, onCancel }: CarFormProps) {
  const { t } = useI18n()
  const { currency, symbol, toEur, fromEur } = useCurrency()

  const [form, setForm] = useState<FormState>(() =>
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
  const [error, setError] = useState<string | null>(null)
  const profile = fuelProfile(form.fuelType)

  const set = (field: 'name' | 'consumption' | 'price', value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Units differ between fuels (L vs kWh), so switching type loads that type's typical values
  const selectFuelType = (fuelType: FuelType) => {
    const typical = fuelProfile(fuelType)
    setForm((prev) => ({ ...prev, fuelType, consumption: typical.consumption, price: typical.price[currency] }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-4 border-primary-200">
      <label className="block">
        <FieldLabel>{t('cars.name')}</FieldLabel>
        <TextInput
          autoFocus
          required
          maxLength={60}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('cars.namePlaceholder')}
        />
      </label>

      <div>
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t('car.fuelType')}</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          {FUEL_TYPES.map((value) => {
            const { labelKey, icon: Icon } = FUEL_PROFILES[value]
            return (
              <ChoiceButton
                key={value}
                aria-pressed={form.fuelType === value}
                selected={form.fuelType === value}
                onClick={() => selectFuelType(value)}
                className="p-2 flex items-center gap-2"
              >
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                <span>{t(labelKey)}</span>
              </ChoiceButton>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <FieldLabel>{t('car.consumption')}</FieldLabel>
          <TextInput
            type="number"
            required
            min="0.1"
            max="100"
            step="0.1"
            value={form.consumption}
            onChange={(e) => set('consumption', e.target.value)}
            suffix={`${profile.unit}/100km`}
            className="pr-24"
          />
        </label>
        <label className="block">
          <FieldLabel>{t(profile.priceKey)}</FieldLabel>
          <TextInput
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            suffix={`${symbol}/${profile.unit}`}
            className="pr-16"
          />
        </label>
      </div>

      {error && <Alert size="sm">{error}</Alert>}

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
