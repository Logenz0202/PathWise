// Panels drawn over the map (outside <MapContainer>): route status, quick routes and the legend
import { Compass } from 'lucide-react'
import { POPULAR_ROUTES } from '../../utils/geoData'
import { useI18n } from '../../i18n/LanguageContext'
import { cx } from '../../utils/cx'

// Next step for the user, or the active route once both cities are set
export function RouteStatus({ origin, destination }: { origin: string; destination: string }) {
  const { t } = useI18n()
  return (
    <div
      className={cx(
        'pointer-events-auto flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300',
        'bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg'
      )}
    >
      <Compass className="w-4 h-4 text-primary-400 animate-spin-slow" />
      <span>
        {!origin ? (
          <strong className="text-emerald-400">{t('map.step1')}</strong>
        ) : !destination ? (
          <strong className="text-indigo-400">{t('map.step2')}</strong>
        ) : (
          <span className="text-emerald-300 font-medium">
            {t('map.routeActive')} <span className="text-white">{origin}</span> →{' '}
            <span className="text-white">{destination}</span>
          </span>
        )}
      </span>
    </div>
  )
}

// One-click popular routes
export function QuickRoutes({ onSelect }: { onSelect: (origin: string, destination: string) => void }) {
  const { stableText } = useI18n()
  return (
    <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
      <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider hidden sm:inline mr-1 drop-shadow-sm">
        {stableText('map.popular')}
      </span>
      {POPULAR_ROUTES.map((route) => (
        <button
          key={route.label}
          type="button"
          onClick={() => onSelect(route.origin, route.destination)}
          className={cx(
            'px-2.5 py-1 text-xs whitespace-nowrap rounded-lg border shadow-xs backdrop-blur-md transition-all',
            'bg-slate-900/85 border-slate-700/60 text-slate-200',
            'hover:bg-primary-600/60 hover:border-primary-500/50 hover:text-white'
          )}
        >
          {route.label}
        </button>
      ))}
    </div>
  )
}

// Marker colours and how many cities are shown at the current zoom
export function MapLegend({ visibleCount }: { visibleCount: number }) {
  const { t, stableText } = useI18n()
  return (
    <div
      className={cx(
        'absolute bottom-8 left-5 z-1000 hidden sm:flex items-center gap-4 px-3 py-2 pointer-events-none',
        'bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-400'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        {stableText('map.start')}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
        {stableText('map.finish')}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-slate-900" />
        {stableText('map.city')}
      </div>
      <span className="text-[11px] text-slate-500 border-l border-slate-700 pl-3">
        {t('map.zoomHint', { count: visibleCount })}
      </span>
    </div>
  )
}
