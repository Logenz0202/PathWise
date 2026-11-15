import { Clock, Leaf, Wallet, type LucideIcon } from 'lucide-react'
import type { I18n } from '../../i18n/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'
import type { TransportMode, TransportOption } from '../../types'

export type MetricKey = 'time_minutes' | 'cost_eur' | 'co2_kg'

export interface Formatters {
  formatMoney: (eur: number) => string
  formatNumber: I18n['formatNumber']
  formatDuration: I18n['formatDuration']
}

interface Metric {
  key: MetricKey
  labelKey: TranslationKey
  icon: LucideIcon
  format: (value: number, fmt: Formatters) => string
}

// The three numbers each transport option is compared on (lower is better for all of them)
export const METRICS: Metric[] = [
  { key: 'time_minutes', labelKey: 'results.travelTime', icon: Clock, format: (v, fmt) => fmt.formatDuration(v) },
  { key: 'cost_eur', labelKey: 'results.cost', icon: Wallet, format: (v, fmt) => fmt.formatMoney(v) },
  { key: 'co2_kg', labelKey: 'results.co2', icon: Leaf, format: (v, fmt) => `${fmt.formatNumber(v)} kg` },
]

export type BestByMetric = Partial<Record<MetricKey, TransportMode>>

// Which mode wins each metric
export function bestByMetric(options: { mode: TransportMode; data: TransportOption }[]): BestByMetric {
  const best: BestByMetric = {}
  if (options.length === 0) return best
  for (const { key } of METRICS) {
    best[key] = options.reduce((a, b) => (a.data[key] < b.data[key] ? a : b)).mode
  }
  return best
}
