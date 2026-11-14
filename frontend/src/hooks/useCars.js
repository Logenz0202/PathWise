import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'
import { FUEL_PROFILES } from '../utils/vehicle'

const SELECTED_KEY = 'pathwise.selectedCar'

// Built-in "average car" per fuel type, using the typical values from FUEL_PROFILES.
// They look like saved cars to the rest of the app, but have a string id and no name.
export const AVERAGE_CARS = Object.entries(FUEL_PROFILES).map(([fuel, profile]) => ({
  id: `avg:${fuel}`,
  isAverage: true,
  name: null,
  fuel_type: fuel,
  consumption_per_100km: parseFloat(profile.consumption),
  energy_price_eur: parseFloat(profile.price.EUR),
}))

const DEFAULT_SELECTION = AVERAGE_CARS[0].id // average petrol car

// Selection is stored as "avg:<fuel>" for an average car or "car:<id>" for a saved preset
const savedCarKey = (car) => `car:${car.id}`

function readSelection() {
  try {
    return localStorage.getItem(SELECTED_KEY) || DEFAULT_SELECTION
  } catch {
    return DEFAULT_SELECTION
  }
}

// Saved car presets (CRUD against /api/cars) plus which car (preset or average) comparisons use.
export function useCars() {
  const { get, post, put, delete: del, error } = useApi()
  const [cars, setCars] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [selection, setSelection] = useState(readSelection)

  useEffect(() => {
    get('/cars/')
      .then(setCars)
      .catch((err) => console.error('Failed to load cars:', err))
      .finally(() => setLoaded(true))
  }, [get])

  useEffect(() => {
    try {
      localStorage.setItem(SELECTED_KEY, selection)
    } catch {
      // Storage unavailable: the selection just won't persist
    }
  }, [selection])

  const selectedCar =
    AVERAGE_CARS.find((c) => c.id === selection) ?? cars.find((c) => savedCarKey(c) === selection) ?? null

  // A remembered preset that no longer exists (or an unknown value) falls back to the default average
  useEffect(() => {
    if (loaded && !selectedCar) setSelection(DEFAULT_SELECTION)
  }, [loaded, selectedCar])

  const selectCar = useCallback((car) => setSelection(car.isAverage ? car.id : savedCarKey(car)), [])

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

  return { cars, loaded, error, selectedCar, selectCar, createCar, updateCar, deleteCar }
}
