import { Car } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/i18n/LanguageContext'
import { useCurrency } from '@/utils/currency'
import { fuelProfile } from '@/utils/vehicle'
import type { Comparison } from '@/types'

// Formats a value the API may leave empty
const orDash = (value: number | null, format: (v: number) => string) => (value == null ? '—' : format(value))

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

// The car the comparison was calculated for, or a note that an average car was used
export default function CarDetails({ comparison, carLabel }: { comparison: Comparison; carLabel: string }) {
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()

  if (!comparison.car_fuel_type) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Car className="size-4" />
        {t('results.averageCar')}
      </p>
    )
  }

  const { labelKey, unit, priceKey } = fuelProfile(comparison.car_fuel_type)
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
        <p className="flex items-center gap-2 text-sm">
          <Car className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('results.carParams')}:</span>
          <span className="font-medium">{carLabel}</span>
        </p>
        <dl className="grid grid-cols-3 gap-6 text-sm">
          <Spec label={t('results.fuelType')} value={t(labelKey)} />
          <Spec
            label={t('results.avgConsumption')}
            value={`${orDash(comparison.car_consumption_l_per_100km, formatNumber)} ${unit}/100km`}
          />
          <Spec label={t(priceKey)} value={`${orDash(comparison.car_fuel_price_per_liter, formatMoney)}/${unit}`} />
        </dl>
      </CardContent>
    </Card>
  )
}
