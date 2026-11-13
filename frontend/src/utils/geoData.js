// Geographical data and utilities for Poland and all its non-Russian neighbours:
// Germany, Czechia, Slovakia, Ukraine, Belarus, Lithuania

export const MAP_BOUNDS = {
  minLat: 44.0,
  maxLat: 57.0,
  minLng: 5.5,
  maxLng: 40.5,
}

export const SVG_WIDTH = 1200
export const SVG_HEIGHT = 700

// Equirectangular projection with cosine latitude compensation (at 50.5°N)
export function project(lat, lng) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * SVG_WIDTH
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * SVG_HEIGHT
  return { x, y }
}

// Country borders for Poland + all 6 neighbours (Germany, Czechia, Slovakia, Ukraine, Belarus, Lithuania)
export const COUNTRY_POLYGONS = [
  // Poland
  {
    name: 'Poland',
    code: 'PL',
    points: [
      [53.92, 14.25], [54.55, 16.50], [54.83, 18.25], [54.35, 19.40],
      [54.43, 19.65], [54.30, 22.80], [53.95, 23.50], [53.50, 23.65],
      [52.70, 23.85], [52.07, 23.60], [51.52, 23.62], [50.80, 24.15],
      [50.40, 23.70], [49.78, 22.77], [49.08, 22.73], [49.30, 20.90],
      [49.18, 20.08], [49.50, 18.90], [49.85, 18.50], [50.00, 17.70],
      [50.25, 16.90], [50.45, 16.20], [50.85, 14.98], [51.15, 15.00],
      [51.50, 14.70], [52.00, 14.60], [52.60, 14.40], [53.10, 14.35],
      [53.92, 14.25]
    ]
  },
  // Germany (Full borders)
  {
    name: 'Germany',
    code: 'DE',
    points: [
      [54.80, 9.45], [54.40, 11.00], [54.50, 13.50], [53.92, 14.25],
      [53.10, 14.35], [52.60, 14.40], [52.00, 14.60], [51.50, 14.70],
      [51.15, 15.00], [50.85, 14.85], [50.75, 14.30], [50.30, 12.10],
      [50.00, 12.10], [49.50, 12.50], [48.55, 13.50], [47.55, 13.00],
      [47.27, 10.15], [47.55, 9.60], [47.55, 7.60], [48.58, 7.75],
      [49.23, 6.98], [49.50, 6.40], [50.77, 6.08], [51.85, 6.00],
      [53.35, 7.20], [53.80, 8.60], [54.30, 9.00], [55.02, 8.35],
      [54.80, 9.45]
    ]
  },
  // Czechia (Full borders)
  {
    name: 'Czechia',
    code: 'CZ',
    points: [
      [50.85, 14.85], [50.45, 16.20], [50.25, 16.90], [50.00, 17.70],
      [49.85, 18.50], [49.50, 18.90], [49.20, 18.15], [48.80, 17.10],
      [48.65, 16.90], [48.75, 16.00], [48.60, 15.00], [48.55, 13.50],
      [49.50, 12.50], [50.00, 12.10], [50.08, 12.37], [50.75, 14.30],
      [50.85, 14.85]
    ]
  },
  // Slovakia (Full borders)
  {
    name: 'Slovakia',
    code: 'SK',
    points: [
      [49.50, 18.90], [49.18, 20.08], [49.30, 20.90], [49.08, 22.56],
      [48.65, 22.30], [48.40, 22.15], [48.40, 21.70], [48.55, 20.50],
      [48.15, 19.80], [48.00, 18.80], [47.75, 18.10], [47.75, 17.20],
      [48.15, 17.00], [48.65, 16.90], [48.80, 17.10], [49.20, 18.15],
      [49.50, 18.90]
    ]
  },
  // Lithuania (Full borders)
  {
    name: 'Lithuania',
    code: 'LT',
    points: [
      [55.70, 21.14], [56.08, 21.07], [56.40, 23.60], [56.45, 25.00],
      [55.75, 26.50], [55.30, 26.60], [54.60, 25.80], [54.15, 25.60],
      [53.95, 23.95], [53.95, 23.50], [54.36, 22.79], [55.08, 21.90],
      [55.30, 21.20], [55.70, 21.14]
    ]
  },
  // Belarus (Full borders)
  {
    name: 'Belarus',
    code: 'BY',
    points: [
      [53.95, 23.50], [53.95, 23.95], [54.15, 25.60], [54.60, 25.80],
      [55.30, 26.60], [55.75, 26.80], [55.85, 28.20], [55.90, 30.80],
      [55.50, 31.00], [53.90, 32.70], [53.20, 32.20], [52.20, 31.80],
      [51.25, 30.50], [51.50, 28.50], [51.80, 26.50], [51.52, 23.62],
      [52.07, 23.60], [52.70, 23.85], [53.50, 23.65], [53.95, 23.50]
    ]
  },
  // Ukraine (Full country borders including Crimea)
  {
    name: 'Ukraine',
    code: 'UA',
    points: [
      [51.52, 23.62], [51.80, 26.50], [51.50, 28.50], [51.25, 30.50],
      [52.35, 32.00], [52.00, 34.00], [51.20, 35.00], [50.30, 36.50],
      [49.90, 38.50], [49.35, 40.20], [48.55, 39.30], [47.80, 38.50],
      [47.10, 37.55], [46.50, 36.00], [45.35, 36.47], [44.50, 33.50],
      [45.30, 32.50], [46.50, 32.20], [46.48, 30.72], [45.30, 29.60],
      [46.00, 28.50], [47.50, 27.50], [48.00, 26.00], [48.40, 24.50],
      [48.00, 23.50], [48.40, 22.15], [48.65, 22.30], [49.08, 22.56],
      [49.78, 22.77], [50.40, 23.70], [50.80, 24.15], [51.52, 23.62]
    ]
  }
]

// Biggest cities for Poland + all 6 neighbours
export const CITIES = [
  // Poland
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', code: 'PL', lat: 52.2297, lng: 21.0122, isCapital: true, tier: 1 },
  { id: 'krakow', name: 'Kraków', country: 'Poland', code: 'PL', lat: 50.0647, lng: 19.9450, isCapital: false, tier: 1 },
  { id: 'wroclaw', name: 'Wrocław', country: 'Poland', code: 'PL', lat: 51.1079, lng: 17.0385, isCapital: false, tier: 1 },
  { id: 'gdansk', name: 'Gdańsk', country: 'Poland', code: 'PL', lat: 54.3520, lng: 18.6466, isCapital: false, tier: 1 },
  { id: 'poznan', name: 'Poznań', country: 'Poland', code: 'PL', lat: 52.4064, lng: 16.9252, isCapital: false, tier: 1 },
  { id: 'lodz', name: 'Łódź', country: 'Poland', code: 'PL', lat: 51.7592, lng: 19.4560, isCapital: false, tier: 2 },
  { id: 'szczecin', name: 'Szczecin', country: 'Poland', code: 'PL', lat: 53.4285, lng: 14.5528, isCapital: false, tier: 2 },
  { id: 'katowice', name: 'Katowice', country: 'Poland', code: 'PL', lat: 50.2649, lng: 19.0238, isCapital: false, tier: 2 },
  { id: 'lublin', name: 'Lublin', country: 'Poland', code: 'PL', lat: 51.2465, lng: 22.5684, isCapital: false, tier: 2 },
  { id: 'bialystok', name: 'Białystok', country: 'Poland', code: 'PL', lat: 53.1325, lng: 23.1688, isCapital: false, tier: 2 },

  // Germany
  { id: 'berlin', name: 'Berlin', country: 'Germany', code: 'DE', lat: 52.5200, lng: 13.4050, isCapital: true, tier: 1 },
  { id: 'hamburg', name: 'Hamburg', country: 'Germany', code: 'DE', lat: 53.5511, lng: 9.9937, isCapital: false, tier: 1 },
  { id: 'munich', name: 'Munich', country: 'Germany', code: 'DE', lat: 48.1351, lng: 11.5820, isCapital: false, tier: 1 },
  { id: 'cologne', name: 'Cologne', country: 'Germany', code: 'DE', lat: 50.9375, lng: 6.9603, isCapital: false, tier: 1 },
  { id: 'frankfurt', name: 'Frankfurt', country: 'Germany', code: 'DE', lat: 50.1109, lng: 8.6821, isCapital: false, tier: 1 },
  { id: 'stuttgart', name: 'Stuttgart', country: 'Germany', code: 'DE', lat: 48.7758, lng: 9.1829, isCapital: false, tier: 2 },
  { id: 'leipzig', name: 'Leipzig', country: 'Germany', code: 'DE', lat: 51.3397, lng: 12.3731, isCapital: false, tier: 2 },
  { id: 'dresden', name: 'Dresden', country: 'Germany', code: 'DE', lat: 51.0504, lng: 13.7373, isCapital: false, tier: 2 },
  { id: 'nuremberg', name: 'Nuremberg', country: 'Germany', code: 'DE', lat: 49.4521, lng: 11.0767, isCapital: false, tier: 2 },

  // Czechia
  { id: 'prague', name: 'Prague', country: 'Czechia', code: 'CZ', lat: 50.0755, lng: 14.4378, isCapital: true, tier: 1 },
  { id: 'brno', name: 'Brno', country: 'Czechia', code: 'CZ', lat: 49.1951, lng: 16.6068, isCapital: false, tier: 2 },
  { id: 'ostrava', name: 'Ostrava', country: 'Czechia', code: 'CZ', lat: 49.8209, lng: 18.2625, isCapital: false, tier: 2 },
  { id: 'plzen', name: 'Plzeň', country: 'Czechia', code: 'CZ', lat: 49.7384, lng: 13.3736, isCapital: false, tier: 3 },

  // Slovakia
  { id: 'bratislava', name: 'Bratislava', country: 'Slovakia', code: 'SK', lat: 48.1486, lng: 17.1077, isCapital: true, tier: 1 },
  { id: 'kosice', name: 'Košice', country: 'Slovakia', code: 'SK', lat: 48.7164, lng: 21.2611, isCapital: false, tier: 2 },
  { id: 'zilina', name: 'Žilina', country: 'Slovakia', code: 'SK', lat: 49.2231, lng: 18.7394, isCapital: false, tier: 3 },

  // Lithuania
  { id: 'vilnius', name: 'Vilnius', country: 'Lithuania', code: 'LT', lat: 54.6872, lng: 25.2797, isCapital: true, tier: 1 },
  { id: 'kaunas', name: 'Kaunas', country: 'Lithuania', code: 'LT', lat: 54.8985, lng: 23.9036, isCapital: false, tier: 2 },
  { id: 'klaipeda', name: 'Klaipėda', country: 'Lithuania', code: 'LT', lat: 55.7033, lng: 21.1443, isCapital: false, tier: 2 },
  { id: 'siauliai', name: 'Šiauliai', country: 'Lithuania', code: 'LT', lat: 55.9333, lng: 23.3167, isCapital: false, tier: 3 },

  // Belarus
  { id: 'minsk', name: 'Minsk', country: 'Belarus', code: 'BY', lat: 53.9006, lng: 27.5590, isCapital: true, tier: 1 },
  { id: 'brest', name: 'Brest', country: 'Belarus', code: 'BY', lat: 52.0976, lng: 23.7341, isCapital: false, tier: 2 },
  { id: 'grodno', name: 'Grodno', country: 'Belarus', code: 'BY', lat: 53.6694, lng: 23.8131, isCapital: false, tier: 2 },
  { id: 'gomel', name: 'Gomel', country: 'Belarus', code: 'BY', lat: 52.4345, lng: 30.9754, isCapital: false, tier: 2 },
  { id: 'vitebsk', name: 'Vitebsk', country: 'Belarus', code: 'BY', lat: 55.1904, lng: 30.2049, isCapital: false, tier: 3 },
  { id: 'mogilev', name: 'Mogilev', country: 'Belarus', code: 'BY', lat: 53.9168, lng: 30.3449, isCapital: false, tier: 3 },

  // Ukraine
  { id: 'kyiv', name: 'Kyiv', country: 'Ukraine', code: 'UA', lat: 50.4501, lng: 30.5234, isCapital: true, tier: 1 },
  { id: 'kharkiv', name: 'Kharkiv', country: 'Ukraine', code: 'UA', lat: 49.9935, lng: 36.2304, isCapital: false, tier: 1 },
  { id: 'odesa', name: 'Odesa', country: 'Ukraine', code: 'UA', lat: 46.4825, lng: 30.7233, isCapital: false, tier: 1 },
  { id: 'dnipro', name: 'Dnipro', country: 'Ukraine', code: 'UA', lat: 48.4647, lng: 35.0462, isCapital: false, tier: 1 },
  { id: 'lviv', name: 'Lviv', country: 'Ukraine', code: 'UA', lat: 49.8397, lng: 24.0297, isCapital: false, tier: 1 },
  { id: 'zaporizhzhia', name: 'Zaporizhzhia', country: 'Ukraine', code: 'UA', lat: 47.8388, lng: 35.1396, isCapital: false, tier: 2 },
]

// Highway corridor distances (km) for precision
export const KNOWN_ROAD_DISTANCES = {
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

export function calculateRoadDistance(originName, destName) {
  if (!originName || !destName) return null
  if (originName.trim().toLowerCase() === destName.trim().toLowerCase()) return 0

  const normalize = (s) =>
    s
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const c1 = CITIES.find((c) => normalize(c.name) === normalize(originName) || c.id === normalize(originName))
  const c2 = CITIES.find((c) => normalize(c.name) === normalize(destName) || c.id === normalize(destName))

  if (c1 && c2) {
    const key1 = `${c1.id}-${c2.id}`
    const key2 = `${c2.id}-${c1.id}`
    if (KNOWN_ROAD_DISTANCES[key1]) return KNOWN_ROAD_DISTANCES[key1]
    if (KNOWN_ROAD_DISTANCES[key2]) return KNOWN_ROAD_DISTANCES[key2]

    // Haversine formula
    const R = 6371
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180
    const dLon = ((c2.lng - c1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const straightLine = R * c

    return Math.round(straightLine * 1.23)
  }

  return 350
}

export function findCityByName(name) {
  if (!name) return null
  const normalize = (s) =>
    s
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  return CITIES.find(
    (c) =>
      normalize(c.name) === normalize(name) ||
      c.id === normalize(name) ||
      normalize(c.name).includes(normalize(name))
  )
}
