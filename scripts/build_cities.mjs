// Builds the city dataset used by the map, the sidebar autocomplete and the backend.
//
// Source: GeoNames "cities15000" dump (all places with population >= 15,000), CC-BY 4.0.
//   https://download.geonames.org/export/dump/cities15000.zip
//
// Usage:
//   node scripts/build_cities.mjs path/to/cities15000.txt
//
// Writes:
//   frontend/src/data/cities.json
//   backend/app/data/cities.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const COUNTRIES = {
  PL: 'Poland',
  DE: 'Germany',
  CZ: 'Czechia',
  SK: 'Slovakia',
  LT: 'Lithuania',
  BY: 'Belarus',
  UA: 'Ukraine',
}

// GeoNames name -> display name (keeps names the app already used, and common English forms)
const NAME_OVERRIDES = {
  'Frankfurt am Main': 'Frankfurt',
  'Köln': 'Cologne',
  'Hrodna': 'Grodno',
  "Homyel'": 'Gomel',
  'Mahilyow': 'Mogilev',
  'Zaporizhzhya': 'Zaporizhzhia',
  'Babruysk': 'Bobruisk',
  'Pilsen': 'Plzeň',
}

// City districts GeoNames lists as standalone towns that the radius rule below misses
const EXCLUDE = new Set(['Fordon'])

// Extra search aliases (local spellings people are likely to type)
const ALIASES = {
  warsaw: ['Warszawa'],
  prague: ['Praha'],
  munich: ['München'],
  cologne: ['Köln'],
  nuremberg: ['Nürnberg'],
  kyiv: ['Kiev'],
  odesa: ['Odessa'],
  kharkiv: ['Kharkov'],
  lviv: ['Lwów', 'Lvov'],
  grodno: ['Hrodna'],
  gomel: ['Homel'],
  mogilev: ['Mahilyow'],
  vilnius: ['Wilno'],
  frankfurt: ['Frankfurt am Main'],
  plzen: ['Pilsen'],
}

// Drop a place if a bigger one lies within that city's radius (removes districts listed as
// separate towns, e.g. Warsaw's Mokotów). Radius grows with population: 4 km up to 15 km.
const mergeRadiusKm = (pop) => Math.min(15, Math.max(4, Math.sqrt(pop) / 100))

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

const input = process.argv[2]
if (!input) {
  console.error('Usage: node scripts/build_cities.mjs path/to/cities15000.txt')
  process.exit(1)
}

const rows = readFileSync(input, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => line.split('\t'))
  .filter((f) => COUNTRIES[f[8]] && f[7] !== 'PPLX' && !EXCLUDE.has(f[1]))
  .map((f) => ({
    rawName: f[1],
    ascii: f[2],
    lat: Number(f[4]),
    lng: Number(f[5]),
    featureCode: f[7],
    code: f[8],
    pop: Number(f[14]) || 0,
  }))
  .sort((a, b) => b.pop - a.pop)

// The app refers to cities by name, so names must be unique: keep the biggest of any duplicates
const displayName = (r) => NAME_OVERRIDES[r.rawName] || r.rawName
const kept = []
const keptNames = new Set()
for (const r of rows) {
  if (keptNames.has(displayName(r))) continue
  if (kept.some((k) => haversineKm(k, r) < mergeRadiusKm(k.pop))) continue
  kept.push(r)
  keptNames.add(displayName(r))
}

const usedIds = new Set()
const cities = kept.map((r) => {
  const name = displayName(r)
  let id = slug(name)
  if (usedIds.has(id)) id = `${id}-${r.code.toLowerCase()}`
  let n = 2
  while (usedIds.has(id)) id = `${slug(name)}-${r.code.toLowerCase()}-${n++}`
  usedIds.add(id)

  const isCapital = r.featureCode === 'PPLC'
  const alt = new Set([...(ALIASES[id] || [])])
  if (r.rawName !== name) alt.add(r.rawName)
  if (r.ascii !== name && r.ascii !== r.rawName) alt.add(r.ascii)

  return {
    id,
    name,
    country: COUNTRIES[r.code],
    code: r.code,
    lat: Math.round(r.lat * 1e4) / 1e4,
    lng: Math.round(r.lng * 1e4) / 1e4,
    pop: r.pop,
    tier: tierFor(r.pop, isCapital),
    isCapital,
    ...(alt.size ? { alt: [...alt] } : {}),
  }
})

// One city per line: diff-friendly but compact
const json = '[\n' + cities.map((c) => '  ' + JSON.stringify(c)).join(',\n') + '\n]\n'

for (const out of ['frontend/src/data/cities.json', 'backend/app/data/cities.json']) {
  const path = resolve(ROOT, out)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, json)
  console.log(`wrote ${cities.length} cities -> ${out}`)
}

const byTier = cities.reduce((acc, c) => ((acc[c.tier] = (acc[c.tier] || 0) + 1), acc), {})
console.log('per tier:', byTier)
