import { Leaf, Sparkles, Wallet, Zap, type LucideIcon } from 'lucide-react'
import Badge, { type BadgeTone } from '../ui/Badge'
import { METRICS, type BestByMetric, type Formatters } from './metrics'
import { useI18n } from '../../i18n/LanguageContext'
import { MODES } from '../../utils/transport'
import { cx } from '../../utils/cx'
import type { TransportMode, TransportOption } from '../../types'

interface ModeCardProps {
  mode: TransportMode
  option: TransportOption
  best: BestByMetric
  aiPick: boolean
  // Which car the cost and emissions were calculated for (car card only)
  carLabel?: string
  // Highest CO₂ among the options, for scaling the emissions bar
  maxCo2: number
  fmt: Formatters
}

// Result card for one transport mode: badges, its three numbers and an emissions bar
export default function ModeCard({ mode, option, best, aiPick, carLabel, maxCo2, fmt }: ModeCardProps) {
  const { t, formatNumber } = useI18n()
  const { icon: Icon, labelKey, accessMinutes, solid, bar } = MODES[mode]
  const isGreenest = best.co2_kg === mode
  // Average speed while travelling (without getting to the station), over this mode's own distance
  const travelHours = (option.time_minutes - accessMinutes) / 60
  const avgSpeed = travelHours > 0 ? Math.round(option.distance_km / travelHours) : null

  const badges: { show: boolean; tone: BadgeTone; icon: LucideIcon; filled?: boolean; label: string }[] = [
    { show: aiPick, tone: 'violet', icon: Sparkles, label: t('results.aiPick') },
    { show: best.time_minutes === mode, tone: 'amber', icon: Zap, filled: true, label: t('results.fastest') },
    { show: best.cost_eur === mode, tone: 'blue', icon: Wallet, label: t('results.cheapest') },
    { show: isGreenest, tone: 'emerald', icon: Leaf, filled: true, label: t('results.greenest') },
  ]

  return (
    <div
      className={cx(
        'relative bg-white rounded-2xl border-2 p-6 flex flex-col justify-between',
        'shadow-xs hover:shadow-xl transition-all duration-300',
        isGreenest ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <div className="flex flex-wrap gap-1.5 mb-4">
        {badges
          .filter((b) => b.show)
          .map(({ tone, icon, filled, label }) => (
            <Badge key={label} tone={tone} icon={icon} filled={filled}>
              {label}
            </Badge>
          ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className={cx('p-3.5 rounded-xl text-white shadow-md', solid)}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">{t(labelKey)}</h3>
          <p className="text-xs text-slate-400 font-medium">
            {formatNumber(option.distance_km, 0)} km
            {avgSpeed != null && ` · ${t('results.avgSpeed', { speed: `~${avgSpeed} km/h` })}`}
          </p>
          {accessMinutes > 0 && (
            <p className="text-[11px] text-slate-400">{t('results.accessTime', { min: accessMinutes })}</p>
          )}
          {carLabel && (
            <p className="mt-0.5 text-xs font-semibold text-blue-700 truncate" title={carLabel}>
              {carLabel}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3.5 mb-6">
        {METRICS.map(({ key, labelKey: metricLabel, icon: MetricIcon, format }) => {
          const winner = best[key] === mode
          return (
            <div
              key={key}
              className={cx(
                'p-3 rounded-xl border flex items-center justify-between transition-all',
                winner ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-100'
              )}
            >
              <div className="flex items-center gap-2.5 text-slate-600">
                <MetricIcon className={cx('w-4 h-4', winner ? 'text-amber-600' : 'text-slate-400')} />
                <span className="text-xs font-medium">{t(metricLabel)}</span>
              </div>
              <div className="text-right">
                <span className={cx('text-base font-extrabold', winner ? 'text-slate-900' : 'text-slate-700')}>
                  {format(option[key], fmt)}
                </span>
                {winner && <span className="ml-1 text-[11px] font-bold text-amber-600">★</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Emissions relative to the most polluting option */}
      <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
        <div className="flex justify-between font-medium text-[11px]">
          <span>{t('results.envScore')}</span>
          <span className={isGreenest ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
            {formatNumber(option.co2_kg)} kg CO₂
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={cx('h-full rounded-full transition-all duration-500', isGreenest ? 'bg-emerald-500' : bar)}
            style={{ width: `${Math.max(12, Math.min(100, ((option.co2_kg || 1) / (maxCo2 || 1)) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  )
}
