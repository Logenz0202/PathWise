import L, { type LatLngTuple } from 'leaflet'
import type { City } from '@/types'

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION = [
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  'Routes: <a href="https://project-osrm.org/">OSRM</a>',
].join(' · ')

// Leaflet paints routes (SVG) and city dots (canvas) with plain colours, not CSS variables:
// route is the theme's --primary and casing its --background, in hex. Places are a light blue-grey:
// visible on the dark map and clearly different from the white capitals
export const MAP_COLORS = {
  route: '#fa7c20',
  casing: '#100e0d',
  dashes: '#fff3e6',
  city: '#8ab4cc',
  capital: '#f3f1ef',
}

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

export const ORIGIN_ICON = endpointIcon('A', 'var(--start)')
export const DEST_ICON = endpointIcon('B', 'var(--finish)')

export const distanceIcon = (km: number) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<div class="pw-distance-badge">${Math.round(km)} km</div>`,
  })

// Point halfway along a line, by length (so the distance badge sits in the middle of the road)
export function midpointAlong(points: LatLngTuple[]): LatLngTuple {
  const segment = (a: LatLngTuple, b: LatLngTuple) => Math.hypot(b[0] - a[0], b[1] - a[1])
  const total = points.slice(1).reduce((sum, p, i) => sum + segment(points[i], p), 0)
  let remaining = total / 2
  for (let i = 1; i < points.length; i++) {
    const length = segment(points[i - 1], points[i])
    if (length >= remaining && length > 0) {
      const f = remaining / length
      const [a, b] = [points[i - 1], points[i]]
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    remaining -= length
  }
  return points[points.length - 1]
}
