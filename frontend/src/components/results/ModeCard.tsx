import { Leaf, Sparkles, Wallet, Zap, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { METRICS, type BestByMetric, type Formatters } from './metrics'
import { useI18n } from '@/i18n/LanguageContext'
import { MODES } from '@/utils/transport'
import { cn } from '@/lib/utils'
import type { TransportMode, TransportOption } from '@/types'

interface ModeCardProps {
  mode: TransportMode
  option: TransportOption
  best: BestByMetric
  aiPick: boolean
  // Which car the cost and emissions were calculated for (car card only)
  carLabel?: string
  fmt: Formatters
}

// Result card for one transport mode: what it wins, how it travels, and its three numbers.
// The Eco-Coach's pick gets the accent colour.
export default function ModeCard({ mode, option, best, aiPick, carLabel, fmt }: ModeCardProps) {
  const { t, formatNumber } = useI18n()
  const { icon: Icon, labelKey, accessMinutes } = MODES[mode]

  // Average speed while travelling (without getting to the station), over this mode's own distance
  const travelHours = (option.time_minutes - accessMinutes) / 60
  const avgSpeed = travelHours > 0 ? Math.round(option.distance_km / travelHours) : null

  const wins: { show: boolean; icon: LucideIcon; label: string }[] = [
    { show: best.time_minutes === mode, icon: Zap, label: t('results.fastest') },
    { show: best.cost_eur === mode, icon: Wallet, label: t('results.cheapest') },
    { show: best.co2_kg === mode, icon: Leaf, label: t('results.greenest') },
  ]

  return (
    <Card className={cn(aiPick && 'ring-2 ring-primary')}>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold">{t(labelKey)}</h3>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatNumber(option.distance_km, 0)} km
                {avgSpeed != null && ` · ${t('results.avgSpeed', { speed: `~${avgSpeed} km/h` })}`}
              </p>
            </div>
          </div>
          {aiPick && (
            <Badge>
              <Sparkles />
              {t('results.aiPick')}
            </Badge>
          )}
        </div>

        {(accessMinutes > 0 || carLabel) && (
          <p className="-mt-2 text-xs text-muted-foreground">
            {accessMinutes > 0 ? t('results.accessTime', { min: accessMinutes }) : carLabel}
          </p>
        )}

        <dl className="divide-y rounded-lg border">
          {METRICS.map(({ key, labelKey: metricLabel, icon: MetricIcon, format }) => (
            <div key={key} className="flex items-center justify-between px-3 py-2 text-sm">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <MetricIcon className="size-4" />
                {t(metricLabel)}
              </dt>
              <dd className={cn('tabular-nums', best[key] === mode ? 'font-semibold' : 'text-muted-foreground')}>
                {format(option[key], fmt)}
              </dd>
            </div>
          ))}
        </dl>

        {wins.some((w) => w.show) && (
          <div className="mt-auto flex flex-wrap gap-1.5">
            {wins
              .filter((w) => w.show)
              .map(({ icon: WinIcon, label }) => (
                <Badge key={label} variant="outline" className="font-normal">
                  <WinIcon />
                  {label}
                </Badge>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
