// Panels drawn over the map (outside <MapContainer>): route status, quick routes and the legend
import { Button } from '@/components/ui/button'
import { POPULAR_ROUTES } from '@/utils/geoData'
import { useI18n } from '@/i18n/LanguageContext'
import { cn } from '@/lib/utils'

// Shared look of the map's floating panels
const panel = 'rounded-lg border bg-card/90 backdrop-blur-sm'

// Next step for the user, or the chosen route once both places are set
export function RouteStatus({ origin, destination }: { origin: string; destination: string }) {
  const { t } = useI18n()
  return (
    <div className={cn(panel, 'pointer-events-auto px-3 py-1.5 text-xs')}>
      {!origin ? (
        <span className="text-muted-foreground">{t('map.step1')}</span>
      ) : !destination ? (
        <span className="text-muted-foreground">{t('map.step2')}</span>
      ) : (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="size-2 rounded-full bg-start" />
          {origin}
          <span className="text-muted-foreground">→</span>
          <span className="size-2 rounded-full bg-finish" />
          {destination}
        </span>
      )}
    </div>
  )
}

// One-click popular routes
export function QuickRoutes({ onSelect }: { onSelect: (origin: string, destination: string) => void }) {
  const { stableText } = useI18n()
  return (
    <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">{stableText('map.popular')}</span>
      {POPULAR_ROUTES.map((route) => (
        <Button
          key={route.label}
          type="button"
          size="xs"
          variant="outline"
          onClick={() => onSelect(route.origin, route.destination)}
          className="bg-card/90 font-normal whitespace-nowrap backdrop-blur-sm"
        >
          {route.label}
        </Button>
      ))}
    </div>
  )
}

// Marker colours and how many places are shown at the current zoom. Sits at the bottom next to the
// map credits when the map is wide enough for both, otherwise just above them
export function MapLegend({ visibleCount }: { visibleCount: number }) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        panel,
        'pointer-events-none absolute bottom-8 left-3 z-1000 hidden items-center gap-4 px-3 py-1.5 text-xs sm:flex',
        '@min-[780px]:bottom-2'
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-start" />
        {t('map.start')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-finish" />
        {t('map.finish')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[#8ab4cc]" />
        {t('map.city')}
      </span>
      <span className="border-l pl-3 text-muted-foreground">{t('map.zoomHint', { count: visibleCount })}</span>
    </div>
  )
}
