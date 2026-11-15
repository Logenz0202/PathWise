import { useRef, useState, type FormEvent } from 'react'
import { ArrowUpDown, Info, Loader2, Route, Sparkles } from 'lucide-react'
import Alert from '../ui/Alert'
import CarPicker from './CarPicker'
import CityInput from './CityInput'
import DistanceCard from './DistanceCard'
import TripPreferences from './TripPreferences'
import { useRoute } from '../../hooks/useRoute'
import { useCurrency } from '../../utils/currency'
import { useI18n } from '../../i18n/LanguageContext'
import { cx } from '../../utils/cx'
import type { CarProfile, ComparisonRequest, Priority, SelectableCar } from '../../types'

interface SidebarProps {
  originCity: string
  destinationCity: string
  onOriginChange: (name: string) => void
  onDestinationChange: (name: string) => void
  onSwapCities: () => void
  onCompare: (request: ComparisonRequest) => void
  loading: boolean
  error: string | null
  hasResults: boolean
  onShowResults: () => void
  cars: CarProfile[]
  selectedCar: SelectableCar | null
  onSelectCar: (car: SelectableCar) => void
  onManageCars: () => void
  priority: Priority
  onPriorityChange: (priority: Priority) => void
  notes: string
  onNotesChange: (notes: string) => void
}

// Planner form: cities, distance, car and preferences, with the Compare button pinned at the bottom
export default function Sidebar({
  originCity,
  destinationCity,
  onOriginChange,
  onDestinationChange,
  onSwapCities,
  onCompare,
  loading,
  error,
  hasResults,
  onShowResults,
  cars,
  selectedCar,
  onSelectCar,
  onManageCars,
  priority,
  onPriorityChange,
  notes,
  onNotesChange,
}: SidebarProps) {
  const [manual, setManual] = useState(false)
  const [manualDistance, setManualDistance] = useState('')
  const destInputRef = useRef<HTMLInputElement>(null)

  const { currency } = useCurrency()
  const { lang, t } = useI18n()

  // A distance typed by the user (e.g. a detour) replaces the road route's; times scale with it
  const typedKm = parseFloat(manualDistance)
  const manualKm = manual && typedKm > 0 ? typedKm : null
  const { route, loading: routeLoading } = useRoute(originCity, destinationCity, manualKm)
  // No route means a city is missing, both are the same, or it's still loading
  const canCompare = route != null

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canCompare) return

    onCompare({
      origin: originCity,
      destination: destinationCity,
      distance_km: manualKm ?? undefined,
      priority,
      notes: notes.trim() || undefined,
      // Average cars send typical specs without a name; saved presets also send their name
      ...(selectedCar && {
        car_name: 'isAverage' in selectedCar ? undefined : selectedCar.name,
        car_fuel_type: selectedCar.fuel_type,
        car_consumption_l_per_100km: selectedCar.consumption_per_100km,
        car_fuel_price_per_liter: selectedCar.energy_price_eur,
      }),
      // Only affect the AI recommendation's wording (amounts are always EUR)
      currency,
      language: lang,
    })
  }

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden shrink-0">
      <div className="p-4 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">{t('sidebar.title')}</h2>
              <p className="text-[11px] text-slate-400">{t('sidebar.subtitle')}</p>
            </div>
          </div>

          {hasResults && (
            <button
              type="button"
              onClick={onShowResults}
              className={cx(
                'text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 shadow-xs',
                'bg-primary-600 hover:bg-primary-500 transition-colors'
              )}
            >
              <span>{t('sidebar.viewResults')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable inputs above, Compare button pinned at the bottom so it's always visible */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col text-sm">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Origin & destination */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-3 relative">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary-500" />
                {t('sidebar.hint')}
              </span>
              {(originCity || destinationCity) && (
                <button
                  type="button"
                  onClick={() => {
                    onOriginChange('')
                    onDestinationChange('')
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  {t('sidebar.clearAll')}
                </button>
              )}
            </div>

            <CityInput
              label={t('sidebar.from')}
              placeholder={t('sidebar.fromPlaceholder')}
              value={originCity}
              accent="emerald"
              onSelect={(name) => {
                onOriginChange(name)
                // Picking a start with no destination yet moves on to the destination field
                if (name && !destinationCity) destInputRef.current?.focus()
              }}
            />

            <div className="flex justify-center relative z-10">
              <button
                type="button"
                onClick={onSwapCities}
                title={t('sidebar.swap')}
                className={cx(
                  'p-1.5 rounded-full border border-slate-200 shadow-xs',
                  'bg-white hover:bg-slate-100 text-slate-600 hover:text-primary-600',
                  'transition-all transform hover:rotate-180 duration-200'
                )}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <CityInput
              ref={destInputRef}
              label={t('sidebar.to')}
              placeholder={t('sidebar.toPlaceholder')}
              value={destinationCity}
              accent="indigo"
              onSelect={onDestinationChange}
            />
          </div>

          {originCity && destinationCity ? (
            <DistanceCard
              route={route}
              loading={routeLoading}
              manual={manual}
              onToggleManual={() => setManual((m) => !m)}
              manualDistance={manualDistance}
              onManualDistanceChange={setManualDistance}
            />
          ) : (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
              {t('sidebar.pickBoth')}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 space-y-2">
          {error && <Alert size="sm">{error}</Alert>}

          <CarPicker cars={cars} selectedCar={selectedCar} onSelect={onSelectCar} onManage={onManageCars} />
          <TripPreferences
            priority={priority}
            onPriorityChange={onPriorityChange}
            notes={notes}
            onNotesChange={onNotesChange}
          />

          <button
            type="submit"
            disabled={loading || !canCompare}
            className={cx(
              'w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold',
              'bg-linear-to-r from-primary-600 via-primary-500 to-indigo-600',
              'hover:from-primary-700 hover:to-indigo-700',
              'shadow-lg shadow-primary-500/25 transition-all transform active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('sidebar.comparing')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('sidebar.compare')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </aside>
  )
}
