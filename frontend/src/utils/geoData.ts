// Geographical data and utilities for Poland and its non-Russian neighbours:
// Germany, Czechia, Slovakia, Ukraine, Belarus, Lithuania.
//
// The list of cities and towns is generated from OpenStreetMap (ODbL) by scripts/build_cities.mjs.
// Sorted by population, biggest first.
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import CITY_DATA from '../data/cities.json'
import type { City } from '../types'

export const CITIES = CITY_DATA as City[]

// Initial map view (roughly centred on Poland, showing all neighbours)
export const MAP_CENTER: LatLngTuple = [51.0, 22.5]
export const MAP_ZOOM = 5
export const MAP_MAX_BOUNDS: LatLngBoundsExpression = [
  [42.0, 2.0],
  [59.0, 44.0],
]

// Highest city tier visible at a given Leaflet zoom level.
// tier 1: capitals and 400k+, tier 2: 150k+, tier 3: 50k+, tier 4: 15k+
export function maxTierForZoom(zoom: number): City['tier'] {
  if (zoom <= 5) return 1
  if (zoom === 6) return 2
  if (zoom === 7) return 3
  return 4
}

// Popular route presets
export const POPULAR_ROUTES = [
  { origin: 'Warsaw', destination: 'Berlin', label: 'Warsaw ⇄ Berlin' },
  { origin: 'Warsaw', destination: 'Kyiv', label: 'Warsaw ⇄ Kyiv' },
  { origin: 'Kraków', destination: 'Prague', label: 'Kraków ⇄ Prague' },
  { origin: 'Warsaw', destination: 'Vilnius', label: 'Warsaw ⇄ Vilnius' },
  { origin: 'Warsaw', destination: 'Minsk', label: 'Warsaw ⇄ Minsk' },
  { origin: 'Gdańsk', destination: 'Warsaw', label: 'Gdańsk ⇄ Warsaw' },
]

const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')

// Precomputed search keys: name + aliases, diacritics stripped
const SEARCH_INDEX = CITIES.map((c) => ({
  city: c,
  keys: [c.name, ...(c.alt || [])].map(normalize),
}))

// Exact match on name, id or alias first; then fall back to prefix match.
// CITIES is sorted by population, so ties resolve to the biggest city.
export function findCityByName(name: string | null | undefined): City | null {
  if (!name) return null
  const q = normalize(name)
  if (!q) return null
  const exact = SEARCH_INDEX.find((e) => e.city.id === q || e.keys.includes(q))
  if (exact) return exact.city
  const prefix = SEARCH_INDEX.find((e) => e.keys.some((k) => k.startsWith(q)))
  return prefix ? prefix.city : null
}

// Autocomplete: prefix matches first, then substring matches, then country matches.
export function searchCities(query: string, limit = 8): City[] {
  const q = normalize(query || '')
  if (!q) return CITIES.slice(0, limit)
  const prefix: City[] = []
  const contains: City[] = []
  const country: City[] = []
  for (const e of SEARCH_INDEX) {
    if (e.keys.some((k) => k.startsWith(q))) prefix.push(e.city)
    else if (e.keys.some((k) => k.includes(q))) contains.push(e.city)
    else if (normalize(e.city.country).startsWith(q)) country.push(e.city)
    if (prefix.length >= limit) break
  }
  return [...prefix, ...contains, ...country].slice(0, limit)
}
