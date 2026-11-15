// Renderless helpers placed inside <MapContainer>: they react to the map, they draw nothing.
import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import type { LatLngTuple, Map as LeafletMap } from 'leaflet'
import type { City } from '../../types'

// Reports zoom + visible bounds changes, so only the cities that matter get rendered
export function ViewTracker({ onChange }: { onChange: (map: LeafletMap) => void }) {
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
export function FitRoute({ origin, destination }: { origin: City | null; destination: City | null }) {
  const map = useMap()
  useEffect(() => {
    const pts = [origin, destination]
      .filter((c): c is City => c != null)
      .map((c): LatLngTuple => [c.lat, c.lng])
    if (pts.length === 0) return
    map.invalidateSize()
    const size = map.getSize()
    if (size.x === 0 || size.y === 0) return
    const view = map.getBounds()
    if (pts.every((p) => view.contains(p))) return
    if (pts.length === 1) map.flyTo(pts[0], Math.max(map.getZoom(), 6), { duration: 0.6 })
    else map.flyToBounds(pts, { padding: [80, 80], maxZoom: 8, duration: 0.6 })
  }, [map, origin, destination])
  return null
}

// Leaflet only listens to window resizes; keep it in sync with its container (flex layout, pages)
export function SizeWatcher() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}
