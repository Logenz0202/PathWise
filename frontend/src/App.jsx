import { useState } from 'react'
import InteractiveMap from './components/InteractiveMap'
import Sidebar from './components/Sidebar'
import ComparisonResults from './components/ComparisonResults'
import HistoryList from './components/HistoryList'
import CarsPage from './components/CarsPage'
import { useApi } from './hooks/useApi'
import { useCars } from './hooks/useCars'
import { calculateRoadDistance } from './utils/geoData'
import { CURRENCIES, useCurrency } from './utils/currency'
import { LANGUAGES, useI18n } from './i18n/LanguageContext'
import PillToggle from './components/PillToggle'
import {
  Compass,
  Car,
  CarFront,
  Train,
  Bus,
  History,
  Leaf,
} from 'lucide-react'

const NAV_TABS = [
  { tab: 'planner', labelKey: 'nav.map', icon: Compass },
  { tab: 'history', labelKey: 'nav.history', icon: History },
  { tab: 'cars', labelKey: 'nav.cars', icon: CarFront },
]

function App() {
  const [activeTab, setActiveTab] = useState('planner') // 'planner' | 'results' | 'history' | 'cars'
  // Results is a detail page, not a nav tab: remember which tab opened it for "Back" and highlighting
  const [resultsFrom, setResultsFrom] = useState('planner')
  const [originCity, setOriginCity] = useState('Warsaw')
  const [destinationCity, setDestinationCity] = useState('Berlin')
  const [lastComparison, setLastComparison] = useState(null)

  const { post, loading, error } = useApi()
  const cars = useCars()
  const { currency, setCurrency } = useCurrency()
  const { lang, setLang, t, stableText } = useI18n()
  const otherCurrency = currency === 'EUR' ? 'PLN' : 'EUR'
  const otherLang = lang === 'en' ? 'pl' : 'en'

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
                  {t('app.tagline')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PillToggle
                options={Object.keys(LANGUAGES)}
                value={lang}
                onChange={setLang}
                label={t('toggle.language', { current: lang.toUpperCase(), next: otherLang.toUpperCase() })}
                title={t('toggle.languageTitle', { next: otherLang.toUpperCase() })}
              />
              <PillToggle
                options={Object.keys(CURRENCIES)}
                value={currency}
                onChange={setCurrency}
                label={t('toggle.currency', { current: currency, next: otherCurrency })}
                title={t('toggle.currencyTitle', { next: otherCurrency })}
              />

              {/* Nav Tabs */}
              <nav className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
                {NAV_TABS.map(({ tab, labelKey, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    aria-current={navTab === tab ? 'page' : undefined}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      navTab === tab
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {stableText(labelKey)}
                  </button>
                ))}
              </nav>
            </div>
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
              cars={cars.cars}
              selectedCar={cars.selectedCar}
              onSelectCar={cars.selectCar}
              onManageCars={() => setActiveTab('cars')}
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
            backLabel={t(resultsFrom === 'history' ? 'back.history' : 'back.map')}
            onBack={() => setActiveTab(resultsFrom)}
          />
        )}

        {/* TAB 3: SAVED HISTORY */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200">
            <HistoryList
              onViewComparison={handleViewHistorical}
              onStartComparing={() => setActiveTab('planner')}
            />
          </div>
        )}

        {/* TAB 4: SAVED CAR PRESETS */}
        {activeTab === 'cars' && (
          <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200">
            <CarsPage
              cars={cars.cars}
              loaded={cars.loaded}
              error={cars.error}
              selectedCar={cars.selectedCar}
              onCreate={async (data) => {
                // A newly added car is most likely the one the user wants to compare with
                const car = await cars.createCar(data)
                cars.selectCar(car)
              }}
              onUpdate={cars.updateCar}
              onDelete={cars.deleteCar}
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
            <span>{t('footer.tagline')}</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <Car className="w-4 h-4 text-blue-500" />
              <span>{t('footer.car')}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Train className="w-4 h-4 text-red-500" />
              <span>{t('footer.rail')}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Bus className="w-4 h-4 text-amber-500" />
              <span>{t('footer.bus')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
