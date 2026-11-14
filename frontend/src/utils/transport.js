import { Car, Train, Bus } from 'lucide-react'

// One place for how each transport mode looks across the app.
// speedKmh mirrors AVERAGE_SPEEDS in backend/app/services/calculator.py (used for live estimates).
export const MODES = {
  car: {
    labelKey: 'mode.car',
    icon: Car,
    speedKmh: 80,
    solid: 'bg-blue-600',
    bar: 'bg-blue-500',
    soft: 'bg-blue-50',
    text: 'text-blue-600',
  },
  train: {
    labelKey: 'mode.train',
    icon: Train,
    speedKmh: 120,
    solid: 'bg-red-600',
    bar: 'bg-red-500',
    soft: 'bg-red-50',
    text: 'text-red-600',
  },
  bus: {
    labelKey: 'mode.bus',
    icon: Bus,
    speedKmh: 70,
    solid: 'bg-amber-600',
    bar: 'bg-amber-500',
    soft: 'bg-amber-50',
    text: 'text-amber-600',
  },
}

export const MODE_KEYS = Object.keys(MODES)
