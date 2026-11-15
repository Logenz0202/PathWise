import { Car, ChevronRight, Clock, Trash2 } from 'lucide-react'
import ConfirmButton from '../ui/ConfirmButton'
import { useCurrency } from '../../utils/currency'
import { useI18n } from '../../i18n/LanguageContext'
import { MODES, MODE_KEYS } from '../../utils/transport'
import { comparisonCarLabel } from '../../utils/vehicle'
import { cx } from '../../utils/cx'
import type { ComparisonSummary } from '../../types'

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
      className={cx(
        'card p-4 cursor-pointer group hover:border-primary-300',
        'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500'
      )}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
            {comparison.origin} → {comparison.destination}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <span>{formatNumber(comparison.distance_km, 0)} km</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(comparison.created_at)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 min-w-0">
              <Car className="w-3 h-3 shrink-0" />
              <span className="truncate">{comparisonCarLabel(comparison, t)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
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
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* One fixed column per mode so they never wrap into a second row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MODE_KEYS.map((mode) => {
          const option = comparison[mode]
          const { icon: Icon, labelKey, soft, text } = MODES[mode]
          return (
            <div
              key={mode}
              title={t(labelKey)}
              className={cx('flex items-center gap-2.5 min-w-0 px-3 py-2 rounded-lg text-xs', soft)}
            >
              <Icon className={cx('w-4 h-4 shrink-0', text)} />
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{formatDuration(option.time_minutes)}</div>
                <div className="text-gray-500 truncate">
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
