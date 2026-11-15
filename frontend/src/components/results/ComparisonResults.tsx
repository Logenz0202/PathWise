import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CarDetails from './CarDetails'
import EcoCoachCard from './EcoCoachCard'
import ModeCard from './ModeCard'
import { bestByMetric } from './metrics'
import { useI18n } from '@/i18n/LanguageContext'
import { useCurrency } from '@/utils/currency'
import { MODE_KEYS } from '@/utils/transport'
import { comparisonCarLabel } from '@/utils/vehicle'
import type { Comparison } from '@/types'

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

  const options = MODE_KEYS.map((mode) => ({ mode, data: comparison[mode] }))
  const best = bestByMetric(options)

  // CO₂ saved by the greenest option compared with the most polluting one
  const co2Values = options.map((o) => o.data.co2_kg)
  const co2Saved = Math.max(...co2Values) - Math.min(...co2Values)

  return (
    <div className="mx-auto max-w-6xl animate-fadeIn space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground">
          <Link to={backTo}>
            <ArrowLeft />
            {backLabel}
          </Link>
        </Button>
        <div className="sm:text-right">
          <h1 className="flex items-center gap-2 text-xl font-semibold sm:justify-end">
            <span className="size-2.5 rounded-full bg-start" />
            {comparison.origin}
            <span className="text-muted-foreground">→</span>
            <span className="size-2.5 rounded-full bg-finish" />
            {comparison.destination}
          </h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatNumber(comparison.distance_km, 0)} km {t('results.roadDistance')}
          </p>
        </div>
      </div>

      <EcoCoachCard comparison={comparison} co2Saved={co2Saved} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map(({ mode, data }) => (
          <ModeCard
            key={mode}
            mode={mode}
            option={data}
            best={best}
            aiPick={comparison.ai_advice.recommended === mode}
            carLabel={mode === 'car' ? carLabel : undefined}
            fmt={fmt}
          />
        ))}
      </div>

      <CarDetails comparison={comparison} carLabel={carLabel} />

      {/* Where the distances and times came from */}
      <p className="text-xs text-muted-foreground">
        {t(comparison.route_source === 'osrm' ? 'results.sourceOsrm' : 'results.sourceEstimate')}
      </p>
    </div>
  )
}
