import { Car, ChevronRight, Clock, Trash2 } from 'lucide-react'
import ConfirmButton from '@/components/common/ConfirmButton'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/utils/currency'
import { useI18n } from '@/i18n/LanguageContext'
import { MODES, MODE_KEYS } from '@/utils/transport'
import { comparisonCarLabel } from '@/utils/vehicle'
import type { ComparisonSummary } from '@/types'

interface HistoryCardProps {
  comparison: ComparisonSummary
  onOpen: () => void
  onDelete: () => Promise<void>
}

// One saved comparison: route, when, which car, and a time/cost/CO₂ preview per mode.
// The whole card opens the result; it's a div with role="button" because it contains the delete button.
export default function HistoryCard({ comparison, onOpen, onDelete }: HistoryCardProps) {
  const { formatMoney } = useCurrency()
  const { t, formatNumber, formatDuration, timeAgo } = useI18n()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        'group cursor-pointer space-y-3 rounded-xl border bg-card p-4 transition-colors outline-none',
        // Clearly highlighted on hover and keyboard focus: orange border, lighter surface
        'hover:border-primary/70 hover:bg-accent focus-visible:border-primary/70 focus-visible:bg-accent',
        'focus-visible:ring-3 focus-visible:ring-ring/40'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 truncate font-medium">
            <span className="size-2 shrink-0 rounded-full bg-start" />
            {comparison.origin}
            <span className="text-muted-foreground">→</span>
            <span className="size-2 shrink-0 rounded-full bg-finish" />
            {comparison.destination}
          </h3>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{formatNumber(comparison.distance_km, 0)} km</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {timeAgo(comparison.created_at)}
            </span>
            <span>·</span>
            <span className="flex min-w-0 items-center gap-1">
              <Car className="size-3 shrink-0" />
              <span className="truncate">{comparisonCarLabel(comparison, t)}</span>
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ConfirmButton
            icon={Trash2}
            title={t('history.delete')}
            label={t('history.deleteLabel', { origin: comparison.origin, destination: comparison.destination })}
            message={t('history.confirmDelete')}
            confirmLabel={t('history.delete')}
            cancelLabel={t('cars.cancel')}
            errorMessage={t('history.deleteFailed')}
            onConfirm={onDelete}
          />
          <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary group-focus-visible:text-primary" />
        </div>
      </div>

      {/* One fixed column per mode so they never wrap into a second row */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODE_KEYS.map((mode) => {
          const option = comparison[mode]
          const { icon: Icon, labelKey } = MODES[mode]
          return (
            <div key={mode} title={t(labelKey)} className="flex min-w-0 items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2 text-xs">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 tabular-nums">
                <div className="font-medium">{formatDuration(option.time_minutes)}</div>
                <div className="truncate text-muted-foreground">
                  {formatMoney(option.cost_eur)} · {formatNumber(option.co2_kg)} kg CO₂
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
