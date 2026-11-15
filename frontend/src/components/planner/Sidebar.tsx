import { useRef, useState, type FormEvent } from 'react'
import { ArrowUpDown, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import CarPicker from './CarPicker'
import CityInput from './CityInput'
import DistanceCard from './DistanceCard'
import TripPreferences from './TripPreferences'
import { useRoute } from '@/hooks/useRoute'
import { useCurrency } from '@/utils/currency'
import { useI18n } from '@/i18n/LanguageContext'
import type { CarProfile, ComparisonRequest, Priority, SelectableCar } from '@/types'

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

// Planner form: places, distance, car and preferences, with the Compare button pinned at the bottom
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
  // No route means a place is missing, both are the same, or it's still loading
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
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-card lg:w-96">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">{t('sidebar.title')}</h2>
        {hasResults && (
          <Button type="button" variant="ghost" size="sm" onClick={onShowResults}>
            {t('sidebar.viewResults')}
          </Button>
        )}
      </div>

      {/* Scrollable inputs above, Compare button pinned at the bottom so it's always visible */}
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col text-sm">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('sidebar.hint')}</span>
              {(originCity || destinationCity) && (
                <button
                  type="button"
                  onClick={() => {
                    onOriginChange('')
                    onDestinationChange('')
                  }}
                  className="hover:text-foreground"
                >
                  {t('sidebar.clearAll')}
                </button>
              )}
            </div>

            <CityInput
              label={t('sidebar.from')}
              placeholder={t('sidebar.fromPlaceholder')}
              value={originCity}
              endpoint="start"
              onSelect={(name) => {
                onOriginChange(name)
                // Picking a start with no destination yet moves on to the destination field
                if (name && !destinationCity) destInputRef.current?.focus()
              }}
            />

            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onSwapCities}
                title={t('sidebar.swap')}
                aria-label={t('sidebar.swap')}
                className="text-muted-foreground"
              >
                <ArrowUpDown />
              </Button>
            </div>

            <CityInput
              ref={destInputRef}
              label={t('sidebar.to')}
              placeholder={t('sidebar.toPlaceholder')}
              value={destinationCity}
              endpoint="finish"
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
            <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              {t('sidebar.pickBoth')}
            </p>
          )}
        </div>

        <div className="space-y-2 border-t p-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <CarPicker cars={cars} selectedCar={selectedCar} onSelect={onSelectCar} onManage={onManageCars} />
          <TripPreferences
            priority={priority}
            onPriorityChange={onPriorityChange}
            notes={notes}
            onNotesChange={onNotesChange}
          />

          <Button type="submit" size="lg" className="w-full" disabled={loading || !canCompare}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? t('sidebar.comparing') : t('sidebar.compare')}
          </Button>
        </div>
      </form>
    </aside>
  )
}
