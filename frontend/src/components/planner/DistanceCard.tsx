import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MODES, MODE_KEYS } from '@/utils/transport'
import { useI18n } from '@/i18n/LanguageContext'
import type { RouteInfo } from '@/types'

interface DistanceCardProps {
  // Route from the API (already stretched to a typed distance); null while loading
  route: RouteInfo | null
  loading: boolean
  manual: boolean
  onToggleManual: () => void
  manualDistance: string
  onManualDistanceChange: (value: string) => void
}

// Road distance between the chosen places, an optional manual override and a door-to-door time
// preview per mode (for an average car; the comparison uses the chosen car)
export default function DistanceCard({
  route,
  loading,
  manual,
  onToggleManual,
  manualDistance,
  onManualDistanceChange,
}: DistanceCardProps) {
  const { t, formatNumber, formatDuration } = useI18n()

  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{t('sidebar.distance')}</span>
        {route && (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {t(route.source === 'osrm' ? 'sidebar.routeOsrm' : 'sidebar.routeEstimate')}
          </Badge>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        {route ? (
          <p className="text-2xl font-semibold tabular-nums">
            {formatNumber(route.distance_km, Number.isInteger(route.distance_km) ? 0 : 1)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">km</span>
          </p>
        ) : (
          <p className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {loading ? t('sidebar.routeLoading') : '—'}
          </p>
        )}
        <Button type="button" variant="link" size="sm" onClick={onToggleManual} className="h-auto px-0">
          {manual ? t('sidebar.useAuto') : t('sidebar.adjust')}
        </Button>
      </div>

      {manual && (
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">{t('sidebar.customDistance')}</span>
          <Input
            type="number"
            min="1"
            value={manualDistance}
            // While the field is empty, `route` is the plain road route
            placeholder={t('sidebar.defaultDistance', { km: route ? formatNumber(route.distance_km, 0) : '' })}
            onChange={(e) => onManualDistanceChange(e.target.value)}
          />
        </label>
      )}

      {route && (
        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          {MODE_KEYS.map((mode) => {
            const { icon: Icon, labelKey } = MODES[mode]
            return (
              <div key={mode}>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="size-3.5" />
                  {t(labelKey)}
                </p>
                <p className="font-medium tabular-nums">{formatDuration(route[mode].time_minutes)}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
