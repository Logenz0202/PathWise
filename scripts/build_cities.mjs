// Builds the city/town dataset used by the map, the sidebar autocomplete and the backend.
//
// Source: OpenStreetMap (ODbL), every node tagged place=city or place=town in Poland and its
// neighbours, downloaded from the public Overpass API (no key needed).
//
// Usage:
//   node scripts/build_cities.mjs [cacheDir]
//
// Raw Overpass responses are saved in cacheDir (default: .osm-cache next to the repo) and reused,
// so re-running the script doesn't download everything again; delete the folder to refresh.
//
// Writes:
//   frontend/src/data/cities.json
//   backend/app/data/cities.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_DIR = resolve(process.argv[2] || join(ROOT, '..', '.osm-cache'))
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const USER_AGENT = 'PathWise/1.0 (transport comparison MVP; data build script)'

const COUNTRIES = {
  PL: 'Poland',
  DE: 'Germany',
  CZ: 'Czechia',
  SK: 'Slovakia',
  LT: 'Lithuania',
  BY: 'Belarus',
  UA: 'Ukraine',
}

// Countries whose places are tagged in Cyrillic: shown by their English name
const CYRILLIC_COUNTRIES = new Set(['BY', 'UA'])

// Names an earlier version of the city list used (keyed by OSM node id), kept as search aliases so
// saved trips and familiar spellings still resolve: Hannover, Grodno, Kiev, Monachium...
const LEGACY_NAMES = JSON.parse(readFileSync(join(ROOT, 'scripts', 'legacy_names.json'), 'utf8'))

// Two places closer than this are the same place mapped twice; keep the bigger one
const DUPLICATE_RADIUS_KM = 2

const tierFor = (pop, isCapital) => {
  if (isCapital || pop >= 400_000) return 1
  if (pop >= 150_000) return 2
  if (pop >= 50_000) return 3
  return 4
}

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const haversineKm = (a, b) => {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Names must be in Latin script for the UI and the search
const LATIN = /^[\p{Script=Latin}\p{N}\s\-.'’()/]+$/u
const latin = (s) => (s && LATIN.test(s) ? s.trim() : null)

// "12 345", "12.345" or "~12345" -> 12345
const parsePopulation = (value) => Number(String(value || '').replace(/[^0-9]/g, '')) || 0

// Display name: the local name ("Kraków", "Braunschweig"), but the English one for the biggest
// places where English really differs ("Warsaw", "Munich"), and for Cyrillic-script countries
function displayName(tags, code, tier) {
  // Bilingual names like "Cottbus - Chóśebuz" or "Bautzen/Budyšin": the first part
  const local = latin(tags.name)?.split(/\s*\/\s*|\s+-\s+/)[0].trim()
  const english = latin(tags['name:en'])
  if (local && !CYRILLIC_COUNTRIES.has(code)) {
    return english && tier === 1 && slug(english) !== slug(local) ? english : local
  }
  return english || local || latin(tags['name:pl'])
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function download(code) {
  const query = `[out:json][timeout:180];area["ISO3166-1"="${code}"][admin_level=2]->.a;node["place"~"^(city|town)$"](area.a);out body;`
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }),
    })
    if (response.ok) return (await response.json()).elements
    console.log(`  ${code}: Overpass answered ${response.status}, retrying in 20 s`)
    await sleep(20_000)
  }
  throw new Error(`Overpass failed for ${code}`)
}

// OSM nodes for one country, from the cache or from Overpass
async function placesOf(code) {
  const file = join(CACHE_DIR, `${code}.json`)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')).elements
  console.log(`downloading ${COUNTRIES[code]}...`)
  const elements = await download(code)
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(file, JSON.stringify({ elements }))
  await sleep(5_000) // be gentle with the public server
  return elements
}

const rows = []
let skippedNoName = 0
for (const code of Object.keys(COUNTRIES)) {
  for (const node of await placesOf(code)) {
    const tags = node.tags
    const pop = parsePopulation(tags.population)
    const isCity = tags.place === 'city'
    const isCapital = tags.capital === 'yes' || tags.capital === '2'
    // A place without a population count is ranked by type: a city as mid-size, a town as small
    const tier = tierFor(pop || (isCity ? 50_000 : 0), isCapital)
    const name = displayName(tags, code, tier)
    if (!name) {
      skippedNoName++
      continue
    }
    rows.push({
      osmId: node.id,
      name,
      code,
      lat: node.lat,
      lng: node.lon,
      pop,
      tier,
      isCity,
      isCapital,
      // Other names people may type: local, English and Polish (exonyms like Lwów or Drezno)
      names: [tags.name, tags['name:en'], tags['name:pl'], ...(LEGACY_NAMES[node.id] || [])]
        .map(latin)
        .filter(Boolean),
    })
  }
}

// Biggest first; places without a population count go after those with one (cities before towns)
rows.sort((a, b) => b.pop - a.pop || Number(b.isCity) - Number(a.isCity))

// The app refers to places by name, so names must be unique: keep the biggest of any duplicates
const kept = []
const keptNames = new Set()
let duplicates = 0
for (const r of rows) {
  if (keptNames.has(r.name) || kept.some((k) => haversineKm(k, r) < DUPLICATE_RADIUS_KM)) {
    duplicates++
    continue
  }
  kept.push(r)
  keptNames.add(r.name)
}

const usedIds = new Set()
const cities = kept.map((r) => {
  let id = slug(r.name)
  if (usedIds.has(id)) id = `${id}-${r.code.toLowerCase()}`
  let n = 2
  while (usedIds.has(id)) id = `${slug(r.name)}-${r.code.toLowerCase()}-${n++}`
  usedIds.add(id)

  const alt = new Set(r.names)
  alt.delete(r.name)

  return {
    id,
    name: r.name,
    country: COUNTRIES[r.code],
    code: r.code,
    lat: Math.round(r.lat * 1e4) / 1e4,
    lng: Math.round(r.lng * 1e4) / 1e4,
    pop: r.pop,
    tier: r.tier,
    isCapital: r.isCapital,
    ...(alt.size ? { alt: [...alt] } : {}),
  }
})

// One place per line: diff-friendly but compact
const json = '[\n' + cities.map((c) => '  ' + JSON.stringify(c)).join(',\n') + '\n]\n'

for (const out of ['frontend/src/data/cities.json', 'backend/app/data/cities.json']) {
  const path = resolve(ROOT, out)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, json)
  console.log(`wrote ${cities.length} places -> ${out}`)
}

const byTier = cities.reduce((acc, c) => ((acc[c.tier] = (acc[c.tier] || 0) + 1), acc), {})
console.log('per tier:', byTier, `| skipped: ${duplicates} duplicates, ${skippedNoName} without a Latin name`)
