import { Car } from 'lucide-react'
import { useI18n } from '../../i18n/LanguageContext'
import { useCurrency } from '../../utils/currency'
import { fuelProfile } from '../../utils/vehicle'
import type { Comparison } from '../../types'
import { cx } from '../../utils/cx'

// Formats a value the API may leave empty
const orDash = (value: number | null, format: (v: number) => string) => (value == null ? '—' : format(value))

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200">
      <span className="text-slate-400 block mb-0.5">{label}</span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  )
}

// The car the comparison was calculated for, or a note that an average car was used
export default function CarDetails({ comparison, carLabel }: { comparison: Comparison; carLabel: string }) {
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()

  if (!comparison.car_fuel_type) {
    return (
      <p className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3">
        <Car className="w-4 h-4 text-slate-400" />
        {t('results.averageCar')}
      </p>
    )
  }

  const { labelKey, unit, priceKey } = fuelProfile(comparison.car_fuel_type)
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <Car className="w-4 h-4 text-primary-600" />
        {t('results.carParams')}
        <span
          className={cx(
            'px-2 py-0.5 bg-white border border-slate-200 rounded-md',
            'normal-case tracking-normal font-semibold text-slate-800'
          )}
        >
          {carLabel}
        </span>
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Spec label={t('results.fuelType')} value={t(labelKey)} />
        <Spec
          label={t('results.avgConsumption')}
          value={`${orDash(comparison.car_consumption_l_per_100km, formatNumber)} ${unit} / 100km`}
        />
        <Spec label={t(priceKey)} value={`${orDash(comparison.car_fuel_price_per_liter, formatMoney)} / ${unit}`} />
      </div>
    </div>
  )
}
