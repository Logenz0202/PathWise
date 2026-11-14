import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'

const SELECTED_KEY = 'pathwise.selectedCar'

function readSelected() {
  try {
    const id = Number(localStorage.getItem(SELECTED_KEY))
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

// Saved car presets (CRUD against /api/cars) plus which one is used for comparisons.
// `selectedCar` is null for "average car", which lets the backend use typical figures.
export function useCars() {
  const { get, post, put, delete: del, error } = useApi()
  const [cars, setCars] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState(readSelected)

  useEffect(() => {
    get('/cars/')
      .then(setCars)
      .catch((err) => console.error('Failed to load cars:', err))
      .finally(() => setLoaded(true))
  }, [get])

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(SELECTED_KEY, String(selectedId))
      else localStorage.removeItem(SELECTED_KEY)
    } catch {
      // Storage unavailable: the selection just won't persist
    }
  }, [selectedId])

  // A remembered car that no longer exists falls back to "average car"
  const selectedCar = cars.find((c) => c.id === selectedId) ?? null
  useEffect(() => {
    if (loaded && selectedId && !selectedCar) setSelectedId(null)
  }, [loaded, selectedId, selectedCar])

  const createCar = useCallback(
    async (data) => {
      const car = await post('/cars/', data)
      setCars((prev) => [...prev, car])
      return car
    },
    [post]
  )

  const updateCar = useCallback(
    async (id, data) => {
      const car = await put(`/cars/${id}`, data)
      setCars((prev) => prev.map((c) => (c.id === id ? car : c)))
      return car
    },
    [put]
  )

  const deleteCar = useCallback(
    async (id) => {
      await del(`/cars/${id}`)
      setCars((prev) => prev.filter((c) => c.id !== id))
    },
    [del]
  )

  return { cars, loaded, error, selectedCar, selectCar: setSelectedId, createCar, updateCar, deleteCar }
}
