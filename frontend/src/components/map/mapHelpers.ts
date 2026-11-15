import L, { type LatLngTuple } from 'leaflet'
import type { City } from '../../types'

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION = [
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  'Cities: <a href="https://www.geonames.org/">GeoNames</a>',
].join(' · ')

// Zoom level from which each tier gets a permanent text label (others show on hover)
export const LABEL_ZOOM_BY_TIER: Record<City['tier'], number> = { 1: 0, 2: 7, 3: 8, 4: 10 }
export const RADIUS_BY_TIER: Record<City['tier'], number> = { 1: 6, 2: 5, 3: 4, 4: 3 }

// Curved route between two points (quadratic bezier in lat/lng space, bowed northwards)
export function buildArc(a: City, b: City, segments = 64): { points: LatLngTuple[]; mid: LatLngTuple } {
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
  const ctrl: LatLngTuple = [(lat1 + lat2) / 2 + nLat * bow, (lng1 + lng2) / 2 + nLng * bow]

  const pts: LatLngTuple[] = []
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

// Leaflet markers drawn as HTML; their look is in styles/index.css (.pw-endpoint, .pw-distance-badge)
const endpointIcon = (letter: string, color: string) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div class="pw-endpoint" style="--pw-color:${color}"><span>${letter}</span></div>`,
  })

export const ORIGIN_ICON = endpointIcon('A', '#10b981')
export const DEST_ICON = endpointIcon('B', '#6366f1')

export const distanceIcon = (km: number) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<div class="pw-distance-badge">🚗 ${km} km</div>`,
  })
