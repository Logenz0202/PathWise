import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'
import { FUEL_PROFILES, FUEL_TYPES } from '../utils/vehicle'
import type { AverageCar, CarProfile, CarProfileInput, SelectableCar } from '../types'

const SELECTED_KEY = 'pathwise.selectedCar'

// Built-in "average car" per fuel type, using the typical values from FUEL_PROFILES.
// They look like saved cars to the rest of the app, but have a string id and no name.
export const AVERAGE_CARS: AverageCar[] = FUEL_TYPES.map((fuel) => ({
  id: `avg:${fuel}`,
  isAverage: true,
  name: null,
  fuel_type: fuel,
  consumption_per_100km: parseFloat(FUEL_PROFILES[fuel].consumption),
  energy_price_eur: parseFloat(FUEL_PROFILES[fuel].price.EUR),
}))

const DEFAULT_SELECTION = AVERAGE_CARS[0].id // average petrol car

// Selection is stored as "avg:<fuel>" for an average car or "car:<id>" for a saved preset
const savedCarKey = (car: CarProfile) => `car:${car.id}`

function readSelection(): string {
  try {
    return localStorage.getItem(SELECTED_KEY) || DEFAULT_SELECTION
  } catch {
    return DEFAULT_SELECTION
  }
}

// Saved car presets (CRUD against /api/cars) plus which car (preset or average) comparisons use.
export function useCars() {
  const { get, post, put, delete: del, error } = useApi()
  const [cars, setCars] = useState<CarProfile[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selection, setSelection] = useState(readSelection)

  useEffect(() => {
    get<CarProfile[]>('/cars/')
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

  const selectedCar: SelectableCar | null =
    AVERAGE_CARS.find((c) => c.id === selection) ?? cars.find((c) => savedCarKey(c) === selection) ?? null

  // A remembered preset that no longer exists (or an unknown value) falls back to the default average
  useEffect(() => {
    if (loaded && !selectedCar) setSelection(DEFAULT_SELECTION)
  }, [loaded, selectedCar])

  const selectCar = useCallback(
    (car: SelectableCar) => setSelection('isAverage' in car ? car.id : savedCarKey(car)),
    []
  )

  const createCar = useCallback(
    async (data: CarProfileInput) => {
      const car = await post<CarProfile>('/cars/', data)
      setCars((prev) => [...prev, car])
      return car
    },
    [post]
  )

  const updateCar = useCallback(
    async (id: number, data: CarProfileInput) => {
      const car = await put<CarProfile>(`/cars/${id}`, data)
      setCars((prev) => prev.map((c) => (c.id === id ? car : c)))
      return car
    },
    [put]
  )

  const deleteCar = useCallback(
    async (id: number) => {
      await del(`/cars/${id}`)
      setCars((prev) => prev.filter((c) => c.id !== id))
    },
    [del]
  )

  return { cars, loaded, error, selectedCar, selectCar, createCar, updateCar, deleteCar }
}

export type CarsState = ReturnType<typeof useCars>
