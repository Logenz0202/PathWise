import { useState, useMemo, useEffect, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import {
  CITIES,
  MAP_CENTER,
  MAP_ZOOM,
  MAP_MAX_BOUNDS,
  maxTierForZoom,
  calculateRoadDistance,
  POPULAR_ROUTES,
  findCityByName,
} from '../utils/geoData'
import { ZoomIn, ZoomOut, RotateCcw, Compass, Moon, Sun } from 'lucide-react'

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Cities: <a href="https://www.geonames.org/">GeoNames</a>'

// Zoom level from which each tier gets a permanent text label (others show on hover)
const LABEL_ZOOM_BY_TIER = { 1: 0, 2: 7, 3: 8, 4: 10 }
const RADIUS_BY_TIER = { 1: 6, 2: 5, 3: 4, 4: 3 }

// Curved route between two points (quadratic bezier in lat/lng space, bowed northwards)
function buildArc(a, b, segments = 64) {
  const [lat1, lng1] = [a.lat, a.lng]
  const [lat2, lng2] = [b.lat, b.lng]
  const dLat = lat2 - lat1
  const dLng = lng2 - lng1
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1
  const bow = Math.min(len * 0.15, 2.5)
  // Perpendicular, oriented so the bow points north
  let nLat = dLng / len
  let nLng = -dLat / len
  if (nLat < 0) {
    nLat = -nLat
    nLng = -nLng
  }
  const ctrl = [(lat1 + lat2) / 2 + nLat * bow, (lng1 + lng2) / 2 + nLng * bow]

  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = 1 - t
    pts.push([
      u * u * lat1 + 2 * u * t * ctrl[0] + t * t * lat2,
      u * u * lng1 + 2 * u * t * ctrl[1] + t * t * lng2,
    ])
  }
  return { points: pts, mid: pts[Math.floor(segments / 2)] }
}

const endpointIcon = (letter, color) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div class="pw-endpoint" style="--pw-color:${color}"><span>${letter}</span></div>`,
  })

const ORIGIN_ICON = endpointIcon('A', '#10b981')
const DEST_ICON = endpointIcon('B', '#6366f1')

const distanceIcon = (km) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<div class="pw-distance-badge">🚗 ${km} km</div>`,
  })

// Tracks zoom + visible bounds so we only render cities that matter
function ViewTracker({ onChange }) {
  const map = useMapEvents({
    zoomend: () => onChange(map),
    moveend: () => onChange(map),
  })
  useEffect(() => {
    onChange(map)
  }, [map, onChange])
  return null
}

// Pans/zooms to show the route when a selected city is off-screen
function FitRoute({ originObj, destObj }) {
  const map = useMap()
  useEffect(() => {
    const pts = [originObj, destObj].filter(Boolean).map((c) => [c.lat, c.lng])
    if (pts.length === 0) return
    map.invalidateSize()
    const size = map.getSize()
    if (size.x === 0 || size.y === 0) return
    const view = map.getBounds()
    if (pts.every((p) => view.contains(p))) return
    if (pts.length === 1) map.flyTo(pts[0], Math.max(map.getZoom(), 6), { duration: 0.6 })
    else map.flyToBounds(pts, { padding: [80, 80], maxZoom: 8, duration: 0.6 })
  }, [map, originObj, destObj])
  return null
}

// Leaflet only listens to window resizes; keep it in sync with its container (flex layout, tabs)
function SizeWatcher() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}

function MapControls({ darkTiles, onToggleTiles }) {
  const map = useMap()
  const btn =
    'p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-lg transition-all backdrop-blur-md'
  return (
    <div className="absolute bottom-8 right-5 z-[1000] flex flex-col gap-2">
      <button onClick={() => map.zoomIn()} title="Zoom In" className={btn}>
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={() => map.zoomOut()} title="Zoom Out" className={btn}>
        <ZoomOut className="w-4 h-4" />
      </button>
      <button onClick={() => map.setView(MAP_CENTER, MAP_ZOOM)} title="Reset View" className={btn}>
        <RotateCcw className="w-4 h-4" />
      </button>
      <button onClick={onToggleTiles} title={darkTiles ? 'Light map' : 'Dark map'} className={btn}>
        {darkTiles ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function InteractiveMap({
  originCity,
  destinationCity,
  onSelectOrigin,
  onSelectDestination,
  onQuickRouteSelect,
  calculatedDistance,
}) {
  const [view, setView] = useState({ zoom: MAP_ZOOM, bounds: null })
  const [choiceCity, setChoiceCity] = useState(null)
  const [darkTiles, setDarkTiles] = useState(true)

  // Canvas renderer keeps ~1.7k clickable markers fast
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5 }), [])

  const originObj = useMemo(() => findCityByName(originCity), [originCity])
  const destObj = useMemo(() => findCityByName(destinationCity), [destinationCity])

  const handleViewChange = useCallback((map) => {
    setView({ zoom: map.getZoom(), bounds: map.getBounds().pad(0.2) })
  }, [])

  const visibleCities = useMemo(() => {
    const maxTier = maxTierForZoom(view.zoom)
    return CITIES.filter(
      (c) =>
        c.tier <= maxTier &&
        c.id !== originObj?.id &&
        c.id !== destObj?.id &&
        (!view.bounds || view.bounds.contains([c.lat, c.lng]))
    )
  }, [view, originObj, destObj])

  const route = useMemo(() => {
    if (!originObj || !destObj || originObj.id === destObj.id) return null
    const arc = buildArc(originObj, destObj)
    return {
      ...arc,
      distanceKm: calculatedDistance || calculateRoadDistance(originObj.name, destObj.name),
    }
  }, [originObj, destObj, calculatedDistance])

  const handleCityClick = (city) => {
    if (!originCity) {
      onSelectOrigin(city.name)
      return
    }
    if (!destinationCity) {
      if (city.id === originObj?.id) onSelectOrigin('')
      else onSelectDestination(city.name)
      return
    }
    // Both set: let the user choose which end to replace
    setChoiceCity(city)
  }

  // Clicking an A/B marker clears that endpoint
  const endpointHandlers = (clear) => ({
    click: () => {
      clear('')
      setChoiceCity(null)
    },
  })

  return (
    <div
      className={`pw-map relative w-full h-full min-h-[580px] lg:min-h-[680px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${
        darkTiles ? 'pw-dark-tiles' : ''
      }`}
    >
      {/* Top Banner & Quick Route Presets */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl text-xs shadow-lg text-slate-300">
          <Compass className="w-4 h-4 text-primary-400 animate-spin-slow" />
          <span>
            {!originCity ? (
              <strong className="text-emerald-400">Step 1: Click map to select Start city</strong>
            ) : !destinationCity ? (
              <strong className="text-indigo-400">Step 2: Click map to select Destination</strong>
            ) : (
              <span className="text-emerald-300 font-medium">
                Route Active: <span className="text-white">{originCity}</span> →{' '}
                <span className="text-white">{destinationCity}</span>
              </span>
            )}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider hidden sm:inline mr-1 drop-shadow">
            Popular:
          </span>
          {POPULAR_ROUTES.map((r, i) => (
            <button
              key={i}
              onClick={() => onQuickRouteSelect(r.origin, r.destination)}
              className="px-2.5 py-1 text-xs bg-slate-900/85 hover:bg-primary-600/60 hover:border-primary-500/50 border border-slate-700/60 rounded-lg text-slate-200 hover:text-white transition-all whitespace-nowrap shadow-sm backdrop-blur-md"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-5 z-[1000] hidden sm:flex items-center gap-4 px-3 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-400 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Start (A)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Finish (B)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-slate-900" />
          <span>City</span>
        </div>
        <span className="text-[11px] text-slate-500 border-l border-slate-700 pl-3">
          Zoom in for more cities · {visibleCities.length + (originObj ? 1 : 0) + (destObj ? 1 : 0)} shown
        </span>
      </div>

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
        <FitRoute originObj={originObj} destObj={destObj} />
        <MapControls darkTiles={darkTiles} onToggleTiles={() => setDarkTiles((d) => !d)} />

        {/* Route */}
        {route && (
          <>
            <Polyline
              positions={route.points}
              pathOptions={{ color: '#38bdf8', weight: 10, opacity: 0.25, lineCap: 'round' }}
              interactive={false}
            />
            <Polyline
              positions={route.points}
              pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.9, lineCap: 'round' }}
              interactive={false}
            />
            <Polyline
              positions={route.points}
              pathOptions={{ color: '#ffffff', weight: 2.5, className: 'pw-route-dash' }}
              interactive={false}
            />
            <Marker position={route.mid} icon={distanceIcon(route.distanceKm)} interactive={false} />
          </>
        )}

        {/* Cities */}
        {visibleCities.map((city) => {
          const permanentLabel = view.zoom >= LABEL_ZOOM_BY_TIER[city.tier]
          return (
            <CircleMarker
              key={city.id}
              center={[city.lat, city.lng]}
              radius={RADIUS_BY_TIER[city.tier]}
              renderer={canvasRenderer}
              pathOptions={{
                color: '#0f172a',
                weight: 1.5,
                fillColor: city.isCapital ? '#f8fafc' : '#38bdf8',
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

        {/* Selected endpoints (always visible) */}
        {originObj && (
          <Marker
            position={[originObj.lat, originObj.lng]}
            icon={ORIGIN_ICON}
            zIndexOffset={1000}
            eventHandlers={endpointHandlers(onSelectOrigin)}
          >
            <Tooltip permanent direction="bottom" offset={[0, 14]} className="pw-city-label pw-origin-label">
              {originObj.name}
            </Tooltip>
          </Marker>
        )}
        {destObj && destObj.id !== originObj?.id && (
          <Marker
            position={[destObj.lat, destObj.lng]}
            icon={DEST_ICON}
            zIndexOffset={1000}
            eventHandlers={endpointHandlers(onSelectDestination)}
          >
            <Tooltip permanent direction="bottom" offset={[0, 14]} className="pw-city-label pw-dest-label">
              {destObj.name}
            </Tooltip>
          </Marker>
        )}

        {/* Start/Finish chooser when both ends are already set */}
        {choiceCity && (
          <Popup
            position={[choiceCity.lat, choiceCity.lng]}
            eventHandlers={{ remove: () => setChoiceCity(null) }}
            className="pw-choice-popup"
          >
            <div className="text-center">
              <div className="font-bold text-slate-900 mb-2">
                {choiceCity.name} <span className="font-normal text-slate-500">({choiceCity.country})</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  onClick={() => {
                    onSelectOrigin(choiceCity.name)
                    setChoiceCity(null)
                  }}
                >
                  Set as Start
                </button>
                <button
                  className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  onClick={() => {
                    onSelectDestination(choiceCity.name)
                    setChoiceCity(null)
                  }}
                >
                  Set as Finish
                </button>
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  )
}
