import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'
import { useCars } from './hooks/useCars'
import PlannerPage, { type Trip } from './pages/PlannerPage'
import ComparisonPage, { openedFrom } from './pages/ComparisonPage'
import HistoryPage from './pages/HistoryPage'
import CarsPage from './pages/CarsPage'
import type { Comparison } from './types'

function App() {
  // Kept here, outside the routes, so the planner keeps its state while the user visits other pages
  const [trip, setTrip] = useState<Trip>({ origin: 'Warsaw', destination: 'Berlin', priority: 'balanced', notes: '' })
  const [lastComparison, setLastComparison] = useState<Comparison | null>(null)
  const cars = useCars()
  const { pathname, state } = useLocation()

  const updateTrip = useCallback((changes: Partial<Trip>) => setTrip((prev) => ({ ...prev, ...changes })), [])

  // An opened comparison also becomes the planner's route, so "Back to map" shows the same trip
  const showComparison = useCallback(
    (comparison: Comparison) => {
      setLastComparison(comparison)
      updateTrip({ origin: comparison.origin, destination: comparison.destination })
    },
    [updateTrip]
  )

  // New page: start at the top, like a normal page load
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // A result page isn't a tab: highlight the tab it was opened from
  const activeTab = pathname.startsWith('/comparisons/') ? (openedFrom(state) === 'planner' ? '/' : '/history') : pathname

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-primary-500 selection:text-white">
      <Header activeTab={activeTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <PlannerPage
                trip={trip}
                onTripChange={updateTrip}
                cars={cars}
                lastComparison={lastComparison}
                onComparisonCreated={setLastComparison}
              />
            }
          />
          <Route path="/comparisons/:id" element={<ComparisonPage cached={lastComparison} onLoaded={showComparison} />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/cars" element={<CarsPage cars={cars} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
