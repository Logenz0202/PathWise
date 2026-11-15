import { Car, Train, Bus, type LucideIcon } from 'lucide-react'
import type { TranslationKey } from '../i18n/translations'
import type { TransportMode } from '../types'

interface ModeInfo {
  labelKey: TranslationKey
  icon: LucideIcon
  accessMinutes: number
  // Literal Tailwind classes so they're picked up by the build
  solid: string
  bar: string
  soft: string
  text: string
}

// One place for how each transport mode looks across the app.
// accessMinutes (getting to the station and waiting) mirrors ACCESS_MINUTES in
// backend/app/services/calculator.py; it is already included in every time the API returns.
export const MODES: Record<TransportMode, ModeInfo> = {
  car: {
    labelKey: 'mode.car',
    icon: Car,
    accessMinutes: 0,
    solid: 'bg-blue-600',
    bar: 'bg-blue-500',
    soft: 'bg-blue-50',
    text: 'text-blue-600',
  },
  train: {
    labelKey: 'mode.train',
    icon: Train,
    accessMinutes: 40,
    solid: 'bg-red-600',
    bar: 'bg-red-500',
    soft: 'bg-red-50',
    text: 'text-red-600',
  },
  bus: {
    labelKey: 'mode.bus',
    icon: Bus,
    accessMinutes: 30,
    solid: 'bg-amber-600',
    bar: 'bg-amber-500',
    soft: 'bg-amber-50',
    text: 'text-amber-600',
  },
}

export const MODE_KEYS = Object.keys(MODES) as TransportMode[]
