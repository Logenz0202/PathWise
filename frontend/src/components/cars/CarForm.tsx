import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FUEL_PROFILES, FUEL_TYPES, fuelProfile } from '@/utils/vehicle'
import { useCurrency } from '@/utils/currency'
import { useI18n } from '@/i18n/LanguageContext'
import type { CarProfile, CarProfileInput, FuelType } from '@/types'

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

// Number input with its unit shown inside on the right
function UnitInput({ unit, ...props }: React.ComponentProps<typeof Input> & { unit: string }) {
  return (
    <div className="relative">
      <Input type="number" required className="pr-20 tabular-nums" {...props} />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
        {unit}
      </span>
    </div>
  )
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-primary/40 bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="car-name">{t('cars.name')}</Label>
        <Input
          id="car-name"
          autoFocus
          required
          maxLength={60}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('cars.namePlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t('car.fuelType')}</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={form.fuelType}
          // Radix sends '' when the active item is clicked again; keep the current value then
          onValueChange={(value) => value && selectFuelType(value as FuelType)}
          aria-label={t('car.fuelType')}
          className="grid w-full grid-cols-2 sm:grid-cols-4"
        >
          {FUEL_TYPES.map((value) => {
            const { labelKey, icon: Icon } = FUEL_PROFILES[value]
            return (
              <ToggleGroupItem key={value} value={value} className="data-[state=on]:text-primary">
                <Icon />
                {t(labelKey)}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="car-consumption">{t('car.consumption')}</Label>
          <UnitInput
            id="car-consumption"
            min="0.1"
            max="100"
            step="0.1"
            value={form.consumption}
            onChange={(e) => set('consumption', e.target.value)}
            unit={`${profile.unit}/100km`}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="car-price">{t(profile.priceKey)}</Label>
          <UnitInput
            id="car-price"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            unit={`${symbol}/${profile.unit}`}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cars.cancel')}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {t('cars.save')}
        </Button>
      </div>
    </form>
  )
}
