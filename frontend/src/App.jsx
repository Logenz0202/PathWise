import { useState } from 'react'
import InteractiveMap from './components/InteractiveMap'
import Sidebar from './components/Sidebar'
import ComparisonResults from './components/ComparisonResults'
import HistoryList from './components/HistoryList'
import { useApi } from './hooks/useApi'
import { calculateRoadDistance } from './utils/geoData'
import {
  Compass,
  Car,
  Train,
  Bus,
  History,
  Leaf,
} from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('planner') // 'planner' | 'results' | 'history'
  // Results is a detail page, not a nav tab: remember which tab opened it for "Back" and highlighting
  const [resultsFrom, setResultsFrom] = useState('planner')
  const [originCity, setOriginCity] = useState('Warsaw')
  const [destinationCity, setDestinationCity] = useState('Berlin')
  const [lastComparison, setLastComparison] = useState(null)

  const { post, loading, error } = useApi()

  // Calculate current road distance
  const currentDistance = calculateRoadDistance(originCity, destinationCity)

  // Handle swapping origin & destination
  const handleSwapCities = () => {
    const temp = originCity
    setOriginCity(destinationCity)
    setDestinationCity(temp)
  }

  // Handle quick route preset selection
  const handleQuickRouteSelect = (origin, dest) => {
    setOriginCity(origin)
    setDestinationCity(dest)
  }

  // Handle Comparison submit from sidebar
  const handleCompareSubmit = async (payload) => {
    try {
      const result = await post('/comparisons/', payload)
      setLastComparison(result)
      showResults('planner')
    } catch (err) {
      console.error('Comparison error:', err)
    }
  }

  // Handle viewing a historical item
  const handleViewHistorical = (comparison) => {
    setLastComparison(comparison)
    setOriginCity(comparison.origin)
    setDestinationCity(comparison.destination)
    showResults('history')
  }

  const showResults = (from) => {
    setResultsFrom(from)
    setActiveTab('results')
  }

  const navTab = activeTab === 'results' ? resultsFrom : activeTab

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-primary-500 selection:text-white">
      {/* Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              onClick={() => setActiveTab('planner')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2.5 bg-gradient-to-tr from-emerald-600 via-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-black text-white tracking-tight">PathWise</h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-md">
                    2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Smart European Transport & Eco Route Planner
                </p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('planner')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  navTab === 'planner'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Interactive Map</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  navTab === 'history'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: INTERACTIVE MAP & ROUTE PLANNER (FOCAL POINT)
            Desktop sizing (65px header + 48px padding + 65px footer):
            - shorter than 900px: fill the screen below the header; footer sits fully below the fold
            - 900px and taller: also leave room for the footer so it's fully visible; capped at 820px */}
        {activeTab === 'planner' && (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:h-[calc(100vh-113px)] lg:min-h-[560px] lg:[@media(min-height:900px)]:h-[calc(100vh-178px)] lg:max-h-[820px]">
            {/* Sidebar Controls */}
            <Sidebar
              originCity={originCity}
              destinationCity={destinationCity}
              onOriginChange={setOriginCity}
              onDestinationChange={setDestinationCity}
              onSwapCities={handleSwapCities}
              onCompare={handleCompareSubmit}
              loading={loading}
              error={error}
              hasResults={Boolean(lastComparison)}
              onShowResults={() => showResults('planner')}
            />

            {/* Focal Point: Interactive Map Component */}
            <div className="flex-1 flex flex-col min-w-0">
              <InteractiveMap
                originCity={originCity}
                destinationCity={destinationCity}
                onSelectOrigin={setOriginCity}
                onSelectDestination={setDestinationCity}
                onQuickRouteSelect={handleQuickRouteSelect}
                calculatedDistance={currentDistance}
              />
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED COMPARISON RESULTS */}
        {activeTab === 'results' && lastComparison && (
          <ComparisonResults
            comparison={lastComparison}
            backLabel={resultsFrom === 'history' ? 'Back to History' : 'Back to Interactive Map'}
            onBack={() => setActiveTab(resultsFrom)}
          />
        )}

        {/* TAB 3: SAVED HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200">
            <HistoryList
              onViewComparison={handleViewHistorical}
              onStartComparing={() => setActiveTab('planner')}
            />
          </div>
        )}
      </main>

      {/* Global Modern Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PathWise</span>
            <span>—</span>
            <span>Next-Gen Sustainable European Transit Routing</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <Car className="w-4 h-4 text-blue-500" />
              <span>Car Route Engine</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Train className="w-4 h-4 text-red-500" />
              <span>Rail Transit</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Bus className="w-4 h-4 text-amber-500" />
              <span>Intercity Bus</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
