// Geographical data and utilities for Poland and its non-Russian neighbours:
// Germany, Czechia, Slovakia, Ukraine, Belarus, Lithuania.
//
// City list is generated from GeoNames (cities with population >= 15k, CC-BY 4.0)
// by scripts/build_cities.mjs. Sorted by population, biggest first.
import CITY_DATA from '../data/cities.json'

export const CITIES = CITY_DATA

// Initial map view (roughly centred on Poland, showing all neighbours)
export const MAP_CENTER = [51.0, 22.5]
export const MAP_ZOOM = 5
export const MAP_MAX_BOUNDS = [
  [42.0, 2.0],
  [59.0, 44.0],
]

// Highest city tier visible at a given Leaflet zoom level.
// tier 1: capitals and 400k+, tier 2: 150k+, tier 3: 50k+, tier 4: 15k+
export function maxTierForZoom(zoom) {
  if (zoom <= 5) return 1
  if (zoom === 6) return 2
  if (zoom === 7) return 3
  return 4
}

// Highway corridor distances (km) for precision
const KNOWN_ROAD_DISTANCES = {
  'warsaw-berlin': 572,
  'warsaw-krakow': 295,
  'warsaw-wroclaw': 355,
  'warsaw-gdansk': 342,
  'warsaw-poznan': 310,
  'warsaw-prague': 678,
  'warsaw-bratislava': 650,
  'warsaw-vilnius': 460,
  'warsaw-minsk': 550,
  'warsaw-brest': 200,
  'warsaw-grodno': 270,
  'warsaw-lviv': 395,
  'warsaw-kyiv': 780,
  'krakow-prague': 535,
  'krakow-bratislava': 380,
  'krakow-wroclaw': 270,
  'krakow-gdansk': 590,
  'krakow-berlin': 600,
  'krakow-lviv': 330,
  'wroclaw-berlin': 340,
  'wroclaw-prague': 330,
  'berlin-prague': 350,
  'berlin-munich': 585,
  'berlin-hamburg': 290,
  'berlin-cologne': 575,
  'berlin-frankfurt': 550,
  'berlin-leipzig': 190,
  'berlin-dresden': 190,
  'prague-bratislava': 330,
  'prague-brno': 205,
  'prague-ostrava': 370,
  'bratislava-kosice': 400,
  'minsk-brest': 350,
  'minsk-grodno': 290,
  'minsk-gomel': 310,
  'vilnius-kaunas': 105,
  'vilnius-klaipeda': 310,
  'kyiv-lviv': 540,
  'kyiv-odesa': 475,
  'kyiv-kharkiv': 480,
  'kyiv-dnipro': 480,
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

const normalize = (s) =>
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
export function findCityByName(name) {
  if (!name) return null
  const q = normalize(name)
  if (!q) return null
  const exact = SEARCH_INDEX.find((e) => e.city.id === q || e.keys.includes(q))
  if (exact) return exact.city
  const prefix = SEARCH_INDEX.find((e) => e.keys.some((k) => k.startsWith(q)))
  return prefix ? prefix.city : null
}

// Autocomplete: prefix matches first, then substring matches, then country matches.
export function searchCities(query, limit = 8) {
  const q = normalize(query || '')
  if (!q) return CITIES.slice(0, limit)
  const prefix = []
  const contains = []
  const country = []
  for (const e of SEARCH_INDEX) {
    if (e.keys.some((k) => k.startsWith(q))) prefix.push(e.city)
    else if (e.keys.some((k) => k.includes(q))) contains.push(e.city)
    else if (normalize(e.city.country).startsWith(q)) country.push(e.city)
    if (prefix.length >= limit) break
  }
  return [...prefix, ...contains, ...country].slice(0, limit)
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function calculateRoadDistance(originName, destName) {
  if (!originName || !destName) return null
  if (normalize(originName) === normalize(destName)) return 0

  const c1 = findCityByName(originName)
  const c2 = findCityByName(destName)
  if (!c1 || !c2) return 350
  if (c1.id === c2.id) return 0

  const known = KNOWN_ROAD_DISTANCES[`${c1.id}-${c2.id}`] || KNOWN_ROAD_DISTANCES[`${c2.id}-${c1.id}`]
  if (known) return known

  // Straight line * typical road detour factor
  return Math.round(haversineKm(c1.lat, c1.lng, c2.lat, c2.lng) * 1.23)
}
