import { useNavigate } from 'react-router'
import InteractiveMap from '@/components/map/InteractiveMap'
import Sidebar from '@/components/planner/Sidebar'
import { useApi } from '@/hooks/useApi'
import type { CarsState } from '@/hooks/useCars'
import { useRoute } from '@/hooks/useRoute'
import { cn } from '@/lib/utils'
import type { Comparison, ComparisonRequest, Priority } from '@/types'
import { comparisonPath, type ComparisonLocationState } from './ComparisonPage'

export interface Trip {
  origin: string
  destination: string
  priority: Priority
  notes: string
}

interface PlannerPageProps {
  trip: Trip
  // Partial update, e.g. { origin: 'Kraków' }
  onTripChange: (changes: Partial<Trip>) => void
  cars: CarsState
  lastComparison: Comparison | null
  onComparisonCreated: (comparison: Comparison) => void
}

// Route planner (/): sidebar form next to the interactive map. Submitting saves a comparison and
// opens its result page.
export default function PlannerPage({ trip, onTripChange, cars, lastComparison, onComparisonCreated }: PlannerPageProps) {
  const navigate = useNavigate()
  const { post, loading, error } = useApi()
  const { origin, destination } = trip
  // Road line for the map (the sidebar asks for the same route, so it is fetched once)
  const { route } = useRoute(origin, destination)

  const openResult = (id: number) =>
    navigate(comparisonPath(id), { state: { from: 'planner' } satisfies ComparisonLocationState })

  const handleCompare = async (request: ComparisonRequest) => {
    try {
      const comparison = await post<Comparison>('/comparisons/', request)
      onComparisonCreated(comparison)
      openResult(comparison.id)
    } catch (err) {
      console.error('Comparison error:', err) // shown in the sidebar via `error`
    }
  }

  return (
    // Desktop sizing (57px header + 48px padding + 49px footer):
    // - shorter than 900px: fill the screen below the header; footer sits fully below the fold
    // - 900px and taller: also leave room for the footer so it's fully visible; capped at 820px
    <div
      className={cn(
        'flex flex-col lg:flex-row gap-6 items-stretch',
        'lg:h-[calc(100vh-105px)] lg:min-h-[560px] lg:[@media(min-height:900px)]:h-[calc(100vh-154px)] lg:max-h-[820px]'
      )}
    >
      <Sidebar
        originCity={origin}
        destinationCity={destination}
        onOriginChange={(name) => onTripChange({ origin: name })}
        onDestinationChange={(name) => onTripChange({ destination: name })}
        onSwapCities={() => onTripChange({ origin: destination, destination: origin })}
        onCompare={handleCompare}
        loading={loading}
        error={error}
        hasResults={lastComparison != null}
        onShowResults={() => lastComparison && openResult(lastComparison.id)}
        cars={cars.cars}
        selectedCar={cars.selectedCar}
        onSelectCar={cars.selectCar}
        onManageCars={() => navigate('/cars')}
        priority={trip.priority}
        onPriorityChange={(priority) => onTripChange({ priority })}
        notes={trip.notes}
        onNotesChange={(notes) => onTripChange({ notes })}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <InteractiveMap
          originCity={origin}
          destinationCity={destination}
          onSelectOrigin={(name) => onTripChange({ origin: name })}
          onSelectDestination={(name) => onTripChange({ destination: name })}
          onQuickRouteSelect={(o, d) => onTripChange({ origin: o, destination: d })}
          route={route}
        />
      </div>
    </div>
  )
}
