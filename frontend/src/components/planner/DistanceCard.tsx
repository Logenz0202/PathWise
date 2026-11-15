import { CheckCircle2, Loader2 } from 'lucide-react'
import TextInput from '../ui/TextInput'
import { MODES, MODE_KEYS } from '../../utils/transport'
import { useI18n } from '../../i18n/LanguageContext'
import { cx } from '../../utils/cx'
import type { RouteInfo } from '../../types'

interface DistanceCardProps {
  // Route from the API (already stretched to a typed distance); null while loading
  route: RouteInfo | null
  loading: boolean
  manual: boolean
  onToggleManual: () => void
  manualDistance: string
  onManualDistanceChange: (value: string) => void
}

// Road distance between the chosen cities, an optional manual override and a door-to-door time
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
    <div
      className={cx(
        'p-3.5 rounded-xl border border-primary-200/80 space-y-2',
        'bg-linear-to-br from-emerald-500/10 via-primary-500/5 to-indigo-500/10'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {t('sidebar.distance')}
        </span>
        {route && (
          <span
            className={cx(
              'px-2 py-0.5 font-semibold text-[10px] rounded-full',
              route.source === 'osrm' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            )}
          >
            {t(route.source === 'osrm' ? 'sidebar.routeOsrm' : 'sidebar.routeEstimate')}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        {route ? (
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatNumber(route.distance_km, Number.isInteger(route.distance_km) ? 0 : 1)}
            </span>
            <span className="text-sm font-semibold text-slate-500 ml-1">km</span>
          </div>
        ) : (
          <span className="flex items-center gap-1.5 h-8 text-xs text-slate-500">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? t('sidebar.routeLoading') : '—'}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleManual}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium underline"
        >
          {manual ? t('sidebar.useAuto') : t('sidebar.adjust')}
        </button>
      </div>

      {manual && (
        <div className="pt-2 border-t border-slate-200">
          <label className="block text-[11px] text-slate-600 mb-1">{t('sidebar.customDistance')}</label>
          <TextInput
            size="sm"
            type="number"
            min="1"
            value={manualDistance}
            // While the field is empty, `route` is the plain road route
            placeholder={t('sidebar.defaultDistance', { km: route ? formatNumber(route.distance_km, 0) : '' })}
            onChange={(e) => onManualDistanceChange(e.target.value)}
          />
        </div>
      )}

      {route && (
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-primary-200/60 text-center">
          {MODE_KEYS.map((mode) => {
            const { icon: Icon, text, labelKey } = MODES[mode]
            return (
              <div key={mode} className="bg-white/90 p-1.5 rounded-lg border border-slate-200 shadow-xs">
                <div className="flex items-center justify-center gap-1 text-slate-600 text-[10px] font-semibold">
                  <Icon className={`w-3 h-3 ${text}`} />
                  <span>{t(labelKey)}</span>
                </div>
                <p className="text-xs font-bold text-slate-800">{formatDuration(route[mode].time_minutes)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
