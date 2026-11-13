// Geographical data and utilities for Central Europe around Poland

export const MAP_BOUNDS = {
  minLat: 46.5,
  maxLat: 56.5,
  minLng: 8.5,
  maxLng: 31.5,
}

export const SVG_WIDTH = 1000
export const SVG_HEIGHT = 700

// Equirectangular projection with cosine latitude compensation (at 51.5°N)
export function project(lat, lng) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * SVG_WIDTH
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * SVG_HEIGHT
  return { x, y }
}

// Country borders simplified coordinates for Central Europe
export const COUNTRY_POLYGONS = [
  // Poland
  {
    name: 'Poland',
    code: 'PL',
    points: [
      [53.90, 14.25], [54.55, 16.50], [54.83, 18.25], [54.35, 19.40],
      [54.43, 19.65], [54.30, 22.80], [53.60, 23.60], [53.15, 23.95],
      [52.10, 23.20], [51.50, 23.60], [50.80, 24.15], [50.40, 23.70],
      [49.45, 22.75], [49.10, 22.60], [49.30, 20.90], [49.20, 19.95],
      [49.50, 18.90], [49.85, 18.50], [50.00, 17.70], [50.25, 16.90],
      [50.45, 16.20], [50.90, 15.00], [51.15, 15.00], [51.50, 14.70],
      [52.00, 14.60], [52.60, 14.40], [53.10, 14.35], [53.90, 14.25]
    ]
  },
  // Germany (East/Central)
  {
    name: 'Germany',
    code: 'DE',
    points: [
      [54.50, 10.00], [54.40, 13.00], [53.90, 14.25], [53.10, 14.35],
      [52.60, 14.40], [52.00, 14.60], [51.50, 14.70], [51.15, 15.00],
      [50.90, 15.00], [50.75, 14.30], [50.30, 12.10], [50.00, 12.10],
      [49.50, 12.50], [48.60, 13.50], [47.55, 13.00], [47.50, 10.00],
      [49.00, 8.50], [50.50, 8.50], [52.50, 9.00], [54.00, 9.50],
      [54.50, 10.00]
    ]
  },
  // Czech Republic
  {
    name: 'Czechia',
    code: 'CZ',
    points: [
      [50.90, 15.00], [50.45, 16.20], [50.25, 16.90], [50.00, 17.70],
      [49.85, 18.50], [49.50, 18.90], [49.20, 18.15], [48.80, 17.10],
      [48.65, 16.90], [48.75, 16.00], [48.60, 15.00], [48.60, 13.50],
      [49.50, 12.50], [50.00, 12.10], [50.30, 12.10], [50.75, 14.30],
      [50.90, 15.00]
    ]
  },
  // Slovakia
  {
    name: 'Slovakia',
    code: 'SK',
    points: [
      [49.50, 18.90], [49.20, 19.95], [49.30, 20.90], [49.10, 22.60],
      [49.00, 22.50], [48.40, 22.15], [48.40, 21.70], [48.55, 20.50],
      [48.15, 19.80], [48.00, 18.80], [47.75, 18.10], [47.75, 17.20],
      [48.15, 17.00], [48.65, 16.90], [48.80, 17.10], [49.20, 18.15],
      [49.50, 18.90]
    ]
  },
  // Austria
  {
    name: 'Austria',
    code: 'AT',
    points: [
      [48.60, 13.50], [48.60, 15.00], [48.75, 16.00], [48.65, 16.90],
      [48.15, 17.00], [47.75, 17.00], [47.00, 16.50], [46.80, 16.00],
      [46.60, 15.00], [46.50, 14.00], [47.00, 12.50], [47.50, 10.00],
      [47.55, 13.00], [48.60, 13.50]
    ]
  },
  // Lithuania
  {
    name: 'Lithuania',
    code: 'LT',
    points: [
      [55.90, 21.10], [56.30, 23.50], [56.45, 25.00], [55.70, 26.50],
      [55.00, 26.00], [54.20, 25.50], [53.90, 23.50], [54.30, 22.80],
      [54.60, 22.75], [55.30, 21.20], [55.90, 21.10]
    ]
  },
  // Hungary
  {
    name: 'Hungary',
    code: 'HU',
    points: [
      [47.75, 17.20], [47.75, 18.10], [48.00, 18.80], [48.15, 19.80],
      [48.55, 20.50], [48.40, 21.70], [48.00, 22.80], [47.50, 22.00],
      [46.60, 21.30], [46.20, 20.10], [45.90, 18.80], [46.50, 16.50],
      [47.00, 16.50], [47.75, 17.00], [47.75, 17.20]
    ]
  },
  // Ukraine (Western region)
  {
    name: 'Ukraine',
    code: 'UA',
    points: [
      [51.50, 23.60], [52.10, 23.20], [51.90, 25.50], [51.80, 29.50],
      [50.50, 31.50], [49.50, 30.50], [48.50, 26.50], [48.00, 23.50],
      [48.40, 22.15], [49.00, 22.50], [49.10, 22.60], [49.45, 22.75],
      [50.40, 23.70], [50.80, 24.15], [51.50, 23.60]
    ]
  }
]

// Major cities across Central Europe
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
  { id: 'rzeszow', name: 'Rzeszów', country: 'Poland', code: 'PL', lat: 50.0412, lng: 21.9991, isCapital: false, tier: 3 },
  { id: 'torun', name: 'Toruń', country: 'Poland', code: 'PL', lat: 53.0138, lng: 18.5984, isCapital: false, tier: 3 },

  // Germany
  { id: 'berlin', name: 'Berlin', country: 'Germany', code: 'DE', lat: 52.5200, lng: 13.4050, isCapital: true, tier: 1 },
  { id: 'dresden', name: 'Dresden', country: 'Germany', code: 'DE', lat: 51.0504, lng: 13.7373, isCapital: false, tier: 2 },
  { id: 'leipzig', name: 'Leipzig', country: 'Germany', code: 'DE', lat: 51.3397, lng: 12.3731, isCapital: false, tier: 2 },
  { id: 'munich', name: 'Munich', country: 'Germany', code: 'DE', lat: 48.1351, lng: 11.5820, isCapital: false, tier: 1 },
  { id: 'hamburg', name: 'Hamburg', country: 'Germany', code: 'DE', lat: 53.5511, lng: 9.9937, isCapital: false, tier: 1 },
  { id: 'frankfurt', name: 'Frankfurt', country: 'Germany', code: 'DE', lat: 50.1109, lng: 8.6821, isCapital: false, tier: 1 },
  { id: 'nuremberg', name: 'Nuremberg', country: 'Germany', code: 'DE', lat: 49.4521, lng: 11.0767, isCapital: false, tier: 2 },

  // Czech Republic
  { id: 'prague', name: 'Prague', country: 'Czechia', code: 'CZ', lat: 50.0755, lng: 14.4378, isCapital: true, tier: 1 },
  { id: 'brno', name: 'Brno', country: 'Czechia', code: 'CZ', lat: 49.1951, lng: 16.6068, isCapital: false, tier: 2 },
  { id: 'ostrava', name: 'Ostrava', country: 'Czechia', code: 'CZ', lat: 49.8209, lng: 18.2625, isCapital: false, tier: 2 },
  { id: 'plzen', name: 'Plzeň', country: 'Czechia', code: 'CZ', lat: 49.7384, lng: 13.3736, isCapital: false, tier: 3 },

  // Slovakia
  { id: 'bratislava', name: 'Bratislava', country: 'Slovakia', code: 'SK', lat: 48.1486, lng: 17.1077, isCapital: true, tier: 1 },
  { id: 'kosice', name: 'Košice', country: 'Slovakia', code: 'SK', lat: 48.7164, lng: 21.2611, isCapital: false, tier: 2 },
  { id: 'zilina', name: 'Žilina', country: 'Slovakia', code: 'SK', lat: 49.2231, lng: 18.7394, isCapital: false, tier: 3 },

  // Austria
  { id: 'vienna', name: 'Vienna', country: 'Austria', code: 'AT', lat: 48.2082, lng: 16.3738, isCapital: true, tier: 1 },
  { id: 'graz', name: 'Graz', country: 'Austria', code: 'AT', lat: 47.0707, lng: 15.4395, isCapital: false, tier: 2 },
  { id: 'linz', name: 'Linz', country: 'Austria', code: 'AT', lat: 48.3069, lng: 14.2858, isCapital: false, tier: 2 },
  { id: 'salzburg', name: 'Salzburg', country: 'Austria', code: 'AT', lat: 47.8095, lng: 13.0550, isCapital: false, tier: 2 },

  // Lithuania
  { id: 'vilnius', name: 'Vilnius', country: 'Lithuania', code: 'LT', lat: 54.6872, lng: 25.2797, isCapital: true, tier: 1 },
  { id: 'kaunas', name: 'Kaunas', country: 'Lithuania', code: 'LT', lat: 54.8985, lng: 23.9036, isCapital: false, tier: 2 },
  { id: 'klaipeda', name: 'Klaipėda', country: 'Lithuania', code: 'LT', lat: 55.7033, lng: 21.1443, isCapital: false, tier: 3 },

  // Ukraine
  { id: 'lviv', name: 'Lviv', country: 'Ukraine', code: 'UA', lat: 49.8397, lng: 24.0297, isCapital: false, tier: 1 },
  { id: 'kyiv', name: 'Kyiv', country: 'Ukraine', code: 'UA', lat: 50.4501, lng: 30.5234, isCapital: true, tier: 1 },
  { id: 'lutsk', name: 'Lutsk', country: 'Ukraine', code: 'UA', lat: 50.7472, lng: 25.3254, isCapital: false, tier: 3 },

  // Hungary
  { id: 'budapest', name: 'Budapest', country: 'Hungary', code: 'HU', lat: 47.4979, lng: 19.0402, isCapital: true, tier: 1 },
  { id: 'debrecen', name: 'Debrecen', country: 'Hungary', code: 'HU', lat: 47.5316, lng: 21.6273, isCapital: false, tier: 2 },
  { id: 'gyor', name: 'Győr', country: 'Hungary', code: 'HU', lat: 47.6875, lng: 17.6504, isCapital: false, tier: 3 },
]

// Highway corridor distances (km) for precision
export const KNOWN_ROAD_DISTANCES = {
  'warsaw-berlin': 572,
  'warsaw-krakow': 295,
  'warsaw-wroclaw': 355,
  'warsaw-gdansk': 342,
  'warsaw-poznan': 310,
  'warsaw-prague': 678,
  'warsaw-vienna': 670,
  'warsaw-bratislava': 650,
  'warsaw-vilnius': 460,
  'warsaw-lviv': 395,
  'warsaw-kyiv': 780,
  'krakow-prague': 535,
  'krakow-vienna': 460,
  'krakow-bratislava': 380,
  'krakow-wroclaw': 270,
  'krakow-gdansk': 590,
  'krakow-berlin': 600,
  'wroclaw-berlin': 340,
  'wroclaw-prague': 330,
  'wroclaw-vienna': 480,
  'berlin-prague': 350,
  'berlin-munich': 585,
  'berlin-dresden': 190,
  'berlin-hamburg': 290,
  'prague-vienna': 330,
  'prague-bratislava': 330,
  'vienna-bratislava': 80,
  'vienna-budapest': 245,
  'bratislava-budapest': 200,
  'gdansk-berlin': 500,
}

// Popular route presets for 1-click exploration
export const POPULAR_ROUTES = [
  { origin: 'Warsaw', destination: 'Berlin', label: 'Warsaw ⇄ Berlin' },
  { origin: 'Kraków', destination: 'Prague', label: 'Kraków ⇄ Prague' },
  { origin: 'Gdańsk', destination: 'Warsaw', label: 'Gdańsk ⇄ Warsaw' },
  { origin: 'Wrocław', destination: 'Vienna', label: 'Wrocław ⇄ Vienna' },
  { origin: 'Vienna', destination: 'Bratislava', label: 'Vienna ⇄ Bratislava' },
]

// Calculate great circle and realistic road distance
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

    // European road network factor ~1.23
    return Math.round(straightLine * 1.23)
  }

  // Fallback if user typed an unlisted city name
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
