import { useEffect, useState } from 'react'
import { useApi } from './useApi'
import { findCityByName } from '../utils/geoData'
import type { RouteInfo } from '../types'

// Wait this long after the last change (e.g. typing a distance) before asking the API
const DEBOUNCE_MS = 300

// Routes loaded in this session (going back to a trip shows it at once), and requests in flight
// (the map and the sidebar ask for the same route at the same time)
const loaded = new Map<string, RouteInfo>()
const pending = new Map<string, Promise<RouteInfo>>()

const routeUrl = (origin: string, destination: string, distanceKm: number | null) => {
  const params = new URLSearchParams({ origin, destination })
  if (distanceKm) params.set('distance_km', String(distanceKm))
  return `/geo/route?${params}`
}

// Road route and per-mode time preview for the planner's current trip.
// `route` is null while loading, when a city is missing, or when the API can't route the pair
// (e.g. the same city twice).
export function useRoute(origin: string, destination: string, distanceKm: number | null = null) {
  const { get } = useApi()
  // No request without two different cities (the API would reject the same city twice)
  const sameCity = findCityByName(origin)?.id === findCityByName(destination)?.id
  const url = origin && destination && !sameCity ? routeUrl(origin, destination, distanceKm) : null
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [, setVersion] = useState(0) // re-render when a route arrives

  useEffect(() => {
    if (!url || loaded.has(url)) return
    let cancelled = false
    const timer = setTimeout(() => {
      let request = pending.get(url)
      if (!request) {
        request = get<RouteInfo>(url).then((route) => {
          loaded.set(url, route)
          return route
        })
        request.finally(() => pending.delete(url)).catch(() => {})
        pending.set(url, request)
      }
      request
        .then(() => !cancelled && setVersion((v) => v + 1))
        .catch(() => !cancelled && setFailedUrl(url))
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [url, get])

  if (!url) return { route: null, loading: false }
  const route = loaded.get(url)
  if (route) return { route, loading: false }
  return { route: null, loading: failedUrl !== url }
}
