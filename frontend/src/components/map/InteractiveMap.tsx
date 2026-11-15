import { useState, useMemo, useCallback } from 'react'
import L, { type DivIcon, type LatLngBounds, type LatLngTuple, type Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Popup, Tooltip } from 'react-leaflet'
import MapControls from './MapControls'
import { FitRoute, SizeWatcher, ViewTracker } from './MapBehaviour'
import { MapLegend, QuickRoutes, RouteStatus } from './MapOverlays'
import {
  DEST_ICON,
  LABEL_ZOOM_BY_TIER,
  MAP_COLORS,
  ORIGIN_ICON,
  OSM_ATTRIBUTION,
  OSM_TILES,
  RADIUS_BY_TIER,
  buildArc,
  distanceIcon,
  midpointAlong,
} from './mapHelpers'
import {
  CITIES,
  MAP_CENTER,
  MAP_ZOOM,
  MAP_MAX_BOUNDS,
  maxTierForZoom,
  findCityByName,
} from '@/utils/geoData'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/LanguageContext'
import { cn } from '@/lib/utils'
import type { City, RouteInfo } from '@/types'

// Route line (a dark casing, the orange line and light dashes moving along it) with the distance in
// the middle; no distance while loading
function RouteLine({ points, mid, distanceKm }: { points: LatLngTuple[]; mid: LatLngTuple; distanceKm?: number }) {
  return (
    <>
      <Polyline
        positions={points}
        pathOptions={{ color: MAP_COLORS.casing, weight: 7, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }}
        interactive={false}
      />
      <Polyline
        positions={points}
        pathOptions={{ color: MAP_COLORS.route, weight: 4, lineCap: 'round', lineJoin: 'round' }}
        interactive={false}
      />
      <Polyline
        positions={points}
        pathOptions={{ color: MAP_COLORS.dashes, weight: 2, opacity: 0.9, className: 'pw-route-dash' }}
        interactive={false}
      />
      {distanceKm != null && <Marker position={mid} icon={distanceIcon(distanceKm)} interactive={false} />}
    </>
  )
}

// A/B marker of a selected city with its name always shown; clicking it clears that end
function EndpointMarker({ city, icon, labelClass, onClick }: { city: City; icon: DivIcon; labelClass: string; onClick: () => void }) {
  return (
    <Marker position={[city.lat, city.lng]} icon={icon} zIndexOffset={1000} eventHandlers={{ click: onClick }}>
      <Tooltip permanent direction="bottom" offset={[0, 14]} className={cn('pw-city-label', labelClass)}>
        {city.name}
      </Tooltip>
    </Marker>
  )
}

interface InteractiveMapProps {
  originCity: string
  destinationCity: string
  onSelectOrigin: (name: string) => void
  onSelectDestination: (name: string) => void
  onQuickRouteSelect: (origin: string, destination: string) => void
  // Road route from the API; until it arrives (or if routing is unavailable) a curved arc is drawn
  route: RouteInfo | null
}

// OpenStreetMap with ~1.7k clickable cities: click to set the start, then the finish
export default function InteractiveMap({
  originCity,
  destinationCity,
  onSelectOrigin,
  onSelectDestination,
  onQuickRouteSelect,
  route,
}: InteractiveMapProps) {
  const [view, setView] = useState<{ zoom: number; bounds: LatLngBounds | null }>({ zoom: MAP_ZOOM, bounds: null })
  const [choiceCity, setChoiceCity] = useState<City | null>(null)
  const [darkTiles, setDarkTiles] = useState(true)
  const { t } = useI18n()

  // Canvas renderer keeps ~1.7k clickable markers fast. `tolerance` widens each marker's
  // click/hover area by that many pixels without changing how it looks.
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5, tolerance: 6 }), [])

  const origin = useMemo(() => findCityByName(originCity), [originCity])
  const destination = useMemo(() => findCityByName(destinationCity), [destinationCity])

  const handleViewChange = useCallback((map: LeafletMap) => {
    setView({ zoom: map.getZoom(), bounds: map.getBounds().pad(0.2) })
  }, [])

  const visibleCities = useMemo(() => {
    const maxTier = maxTierForZoom(view.zoom)
    return CITIES.filter(
      (c) =>
        c.tier <= maxTier &&
        c.id !== origin?.id &&
        c.id !== destination?.id &&
        (!view.bounds || view.bounds.contains([c.lat, c.lng]))
    )
  }, [view, origin, destination])

  // The road itself when the API has it, otherwise a curved arc between the two cities
  const line = useMemo(() => {
    if (!origin || !destination || origin.id === destination.id) return null
    const geometry = route?.geometry
    if (geometry && geometry.length > 1) {
      return { points: geometry, mid: midpointAlong(geometry), distanceKm: route?.distance_km }
    }
    return { ...buildArc(origin, destination), distanceKm: route?.distance_km }
  }, [origin, destination, route])

  const handleCityClick = (city: City) => {
    if (!originCity) {
      onSelectOrigin(city.name)
      return
    }
    if (!destinationCity) {
      if (city.id === origin?.id) onSelectOrigin('')
      else onSelectDestination(city.name)
      return
    }
    // Both set: let the user choose which end to replace
    setChoiceCity(city)
  }

  const choose = (select: (name: string) => void, name: string) => {
    select(name)
    setChoiceCity(null)
  }

  return (
    <div
      className={cn(
        // @container: the legend positions itself by the map's width, not the window's
        'pw-map @container relative isolate w-full h-full flex-1 min-h-[480px] lg:min-h-0',
        'overflow-hidden rounded-xl border',
        darkTiles && 'pw-dark-tiles'
      )}
    >
      <div className="pointer-events-none absolute top-3 right-3 left-3 z-1000 flex flex-wrap items-center justify-between gap-2">
        <RouteStatus origin={originCity} destination={destinationCity} />
        <QuickRoutes onSelect={onQuickRouteSelect} />
      </div>

      <MapLegend visibleCount={visibleCities.length + (origin ? 1 : 0) + (destination ? 1 : 0)} />

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={4}
        maxZoom={13}
        maxBounds={MAP_MAX_BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        worldCopyJump={false}
        className="absolute inset-0 w-full h-full"
      >
        <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
        <SizeWatcher />
        <ViewTracker onChange={handleViewChange} />
        <FitRoute origin={origin} destination={destination} />
        <MapControls darkTiles={darkTiles} onToggleTiles={() => setDarkTiles((d) => !d)} />

        {line && <RouteLine points={line.points} mid={line.mid} distanceKm={line.distanceKm} />}

        {visibleCities.map((city) => {
          const permanentLabel = view.zoom >= LABEL_ZOOM_BY_TIER[city.tier]
          return (
            <CircleMarker
              key={city.id}
              center={[city.lat, city.lng]}
              radius={RADIUS_BY_TIER[city.tier]}
              renderer={canvasRenderer}
              pathOptions={{
                color: MAP_COLORS.casing,
                weight: 1.5,
                fillColor: city.isCapital ? MAP_COLORS.capital : MAP_COLORS.city,
                fillOpacity: 0.95,
              }}
              eventHandlers={{ click: () => handleCityClick(city) }}
            >
              <Tooltip
                key={permanentLabel ? 'perm' : 'hover'}
                permanent={permanentLabel}
                direction="bottom"
                offset={[0, 4]}
                className={`pw-city-label pw-tier-${city.tier}`}
              >
                {city.name}
              </Tooltip>
            </CircleMarker>
          )
        })}

        {origin && (
          <EndpointMarker
            city={origin}
            icon={ORIGIN_ICON}
            labelClass="pw-origin-label"
            onClick={() => choose(onSelectOrigin, '')}
          />
        )}
        {destination && destination.id !== origin?.id && (
          <EndpointMarker
            city={destination}
            icon={DEST_ICON}
            labelClass="pw-dest-label"
            onClick={() => choose(onSelectDestination, '')}
          />
        )}

        {/* Start/Finish chooser when both ends are already set */}
        {choiceCity && (
          <Popup
            position={[choiceCity.lat, choiceCity.lng]}
            eventHandlers={{ remove: () => setChoiceCity(null) }}
            className="pw-choice-popup"
          >
            <div className="space-y-2 text-center">
              <p className="font-medium">
                {choiceCity.name} <span className="text-muted-foreground">· {t(`country.${choiceCity.code}`)}</span>
              </p>
              <div className="flex gap-2">
                <Button type="button" size="xs" variant="outline" onClick={() => choose(onSelectOrigin, choiceCity.name)}>
                  <span className="size-2 rounded-full bg-start" />
                  {t('map.setStart')}
                </Button>
                <Button type="button" size="xs" variant="outline" onClick={() => choose(onSelectDestination, choiceCity.name)}>
                  <span className="size-2 rounded-full bg-finish" />
                  {t('map.setFinish')}
                </Button>
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  )
}
