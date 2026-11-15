import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import CarDetails from './CarDetails'
import EcoCoachCard from './EcoCoachCard'
import ModeCard from './ModeCard'
import { bestByMetric } from './metrics'
import { useI18n } from '../../i18n/LanguageContext'
import { useCurrency } from '../../utils/currency'
import { MODE_KEYS } from '../../utils/transport'
import { comparisonCarLabel } from '../../utils/vehicle'
import type { Comparison } from '../../types'
import { cx } from '../../utils/cx'

interface ComparisonResultsProps {
  comparison: Comparison
  // Where the Back button leads, and its label
  backTo: string
  backLabel: string
}

// Full result of a comparison: route header, AI advice, one card per mode and the car used
export default function ComparisonResults({ comparison, backTo, backLabel }: ComparisonResultsProps) {
  const { formatMoney } = useCurrency()
  const { t, formatNumber, formatDuration } = useI18n()
  const fmt = { formatMoney, formatNumber, formatDuration }
  const carLabel = comparisonCarLabel(comparison, t)

  const options = MODE_KEYS.flatMap((mode) => {
    const data = comparison[mode]
    return data ? [{ mode, data }] : []
  })
  const best = bestByMetric(options)

  // CO₂ saved by the greenest option compared with the most polluting one
  const co2Values = options.map((o) => o.data.co2_kg || 0)
  const maxCo2 = Math.max(...co2Values)
  const co2Saved = maxCo2 > 0 ? maxCo2 - Math.min(...co2Values) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div
        className={cx(
          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
          'bg-white p-6 rounded-2xl shadow-xs border border-slate-200'
        )}
      >
        <Link
          to={backTo}
          className={cx(
            'px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium',
            'bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </Link>

        <div className="text-center sm:text-right">
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{comparison.origin}</span>
            <span className="text-slate-400 font-bold">→</span>
            <span className="text-2xl font-black text-primary-600 tracking-tight">{comparison.destination}</span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            {t('results.roadDistance')}{' '}
            <span className="text-slate-800 font-bold">{formatNumber(comparison.distance_km, 0)} km</span>
          </p>
        </div>
      </div>

      <EcoCoachCard comparison={comparison} co2Saved={co2Saved} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map(({ mode, data }) => (
          <ModeCard
            key={mode}
            mode={mode}
            option={data}
            best={best}
            aiPick={comparison.ai_advice?.recommended === mode}
            carLabel={mode === 'car' ? carLabel : undefined}
            maxCo2={maxCo2}
            fmt={fmt}
          />
        ))}
      </div>

      <CarDetails comparison={comparison} carLabel={carLabel} />
    </div>
  )
}
