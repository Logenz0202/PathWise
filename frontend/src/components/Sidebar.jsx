import { useState, useEffect, useRef } from 'react'
import { calculateRoadDistance, searchCities } from '../utils/geoData'
import { formatDuration } from '../utils/format'
import {
  MapPin,
  ArrowUpDown,
  Car,
  Train,
  Bus,
  Fuel,
  Gauge,
  Sparkles,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  Route,
  Info,
} from 'lucide-react'

const FUEL_TYPES = [
  { value: 'petrol', label: 'Petrol', icon: Fuel },
  { value: 'diesel', label: 'Diesel', icon: Fuel },
  { value: 'lpg', label: 'LPG', icon: Gauge },
  { value: 'electric', label: 'Electric', icon: Car },
]

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
}) {
  const [showCarDetails, setShowCarDetails] = useState(false)
  const [showManualDistance, setShowManualDistance] = useState(false)
  const [manualDistance, setManualDistance] = useState('')

  // Autocomplete dropdown states
  const [originSearch, setOriginSearch] = useState('')
  const [destSearch, setDestSearch] = useState('')
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)

  const originInputRef = useRef(null)
  const destInputRef = useRef(null)

  // Car configuration
  const [carConfig, setCarConfig] = useState({
    fuelType: 'petrol',
    consumption: '7.2',
    price: '1.75',
  })

  // Sync inputs with selected props
  useEffect(() => {
    setOriginSearch(originCity || '')
  }, [originCity])

  useEffect(() => {
    setDestSearch(destinationCity || '')
  }, [destinationCity])

  // Filter cities for autocomplete
  const filteredOriginCities = searchCities(originSearch)

  const filteredDestCities = searchCities(destSearch)

  // Auto-calculated distance in km
  const autoDistance = calculateRoadDistance(originCity, destinationCity)
  const effectiveDistance = showManualDistance && manualDistance ? parseFloat(manualDistance) : autoDistance

  // Rough live estimates for preview badge
  const previewEstimates = effectiveDistance
    ? {
        carTime: Math.round((effectiveDistance / 80) * 60),
        trainTime: Math.round((effectiveDistance / 120) * 60),
        busTime: Math.round((effectiveDistance / 70) * 60),
      }
    : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!originCity || !destinationCity || !effectiveDistance) return

    onCompare({
      origin: originCity,
      destination: destinationCity,
      distance_km: effectiveDistance,
      car_fuel_type: carConfig.fuelType,
      car_consumption_l_per_100km: parseFloat(carConfig.consumption) || undefined,
      car_fuel_price_per_liter: parseFloat(carConfig.price) || undefined,
    })
  }

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden shrink-0">
      {/* Sidebar Header & Navigation */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Route Planner</h2>
              <p className="text-[11px] text-slate-400">Interactive European Transit</p>
            </div>
          </div>

          {hasResults && (
            <button
              type="button"
              onClick={onShowResults}
              className="text-xs px-2.5 py-1 bg-primary-600 hover:bg-primary-500 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>View Results</span>
            </button>
          )}
        </div>
      </div>

      {/* Form: scrollable inputs above, Compare button pinned at the bottom so it's always visible */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col text-sm">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Origin & Destination Inputs */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3 relative">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary-500" />
                Select cities or click on map
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
                  Clear all
                </button>
              )}
            </div>

            {/* Origin Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                From (Origin)
              </label>
              <div className="relative flex items-center">
                <input
                  ref={originInputRef}
                  type="text"
                  value={originSearch}
                  placeholder="e.g. Warsaw, Berlin, Kraków..."
                  onChange={(e) => {
                    setOriginSearch(e.target.value)
                    setShowOriginDropdown(true)
                  }}
                  onFocus={() => setShowOriginDropdown(true)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none" />
                {originSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginSearch('')
                      onOriginChange('')
                    }}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showOriginDropdown && filteredOriginCities.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredOriginCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        onOriginChange(city.name)
                        setOriginSearch(city.name)
                        setShowOriginDropdown(false)
                        // If no destination, focus destination
                        if (!destinationCity) {
                          destInputRef.current?.focus()
                        }
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 group-hover:text-emerald-700">
                          {city.name}
                        </span>
                        {city.isCapital && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            Capital
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{city.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                type="button"
                onClick={onSwapCities}
                title="Swap Start and Destination"
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-primary-600 rounded-full border border-slate-200 shadow-sm transition-all transform hover:rotate-180 duration-200"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-200" />
                To (Destination)
              </label>
              <div className="relative flex items-center">
                <input
                  ref={destInputRef}
                  type="text"
                  value={destSearch}
                  placeholder="e.g. Prague, Vienna, Gdańsk..."
                  onChange={(e) => {
                    setDestSearch(e.target.value)
                    setShowDestDropdown(true)
                  }}
                  onFocus={() => setShowDestDropdown(true)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                <MapPin className="w-4 h-4 text-indigo-600 absolute left-3 pointer-events-none" />
                {destSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestSearch('')
                      onDestinationChange('')
                    }}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showDestDropdown && filteredDestCities.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredDestCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        onDestinationChange(city.name)
                        setDestSearch(city.name)
                        setShowDestDropdown(false)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 group-hover:text-indigo-700">
                          {city.name}
                        </span>
                        {city.isCapital && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            Capital
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{city.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Automatic Road Distance Card */}
          {originCity && destinationCity ? (
            <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-primary-500/5 to-indigo-500/10 border border-primary-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Calculated Road Distance
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-[10px] rounded-full">
                  Auto-calculated
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {effectiveDistance}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 ml-1">km</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualDistance(!showManualDistance)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium underline"
                >
                  {showManualDistance ? 'Use automatic' : 'Adjust distance'}
                </button>
              </div>

              {/* Optional manual override */}
              {showManualDistance && (
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Custom Distance (km)
                  </label>
                  <input
                    type="number"
                    value={manualDistance}
                    placeholder={`Default: ${autoDistance}`}
                    onChange={(e) => setManualDistance(e.target.value)}
                    min="1"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Quick Trip Preview Pills */}
              {previewEstimates && (
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-primary-200/60 text-center">
                  <div className="bg-white/90 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-center gap-1 text-slate-600 text-[10px] font-semibold">
                      <Car className="w-3 h-3 text-blue-500" />
                      <span>Car</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {formatDuration(previewEstimates.carTime)}
                    </p>
                  </div>
                  <div className="bg-white/90 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-center gap-1 text-slate-600 text-[10px] font-semibold">
                      <Train className="w-3 h-3 text-red-500" />
                      <span>Train</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {formatDuration(previewEstimates.trainTime)}
                    </p>
                  </div>
                  <div className="bg-white/90 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-center gap-1 text-slate-600 text-[10px] font-semibold">
                      <Bus className="w-3 h-3 text-amber-500" />
                      <span>Bus</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {formatDuration(previewEstimates.busTime)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
              Pick both Start & Destination to calculate distance automatically.
            </div>
          )}

          {/* Car Configuration (Accordion) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowCarDetails(!showCarDetails)}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary-600" />
                <span>Car Customization (Optional)</span>
              </div>
              {showCarDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showCarDetails && (
              <div className="p-3.5 space-y-3 text-xs border-t border-slate-100">
                {/* Fuel type selection */}
                <div>
                  <label className="block font-medium text-slate-600 mb-1.5">Fuel Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FUEL_TYPES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCarConfig((prev) => ({ ...prev, fuelType: value }))}
                        className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                          carConfig.fuelType === value
                            ? 'border-primary-500 bg-primary-50/80 text-primary-900 font-bold shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consumption & Price */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Consumption (L/100km)
                    </label>
                    <input
                      type="number"
                      value={carConfig.consumption}
                      onChange={(e) =>
                        setCarConfig((prev) => ({ ...prev, consumption: e.target.value }))
                      }
                      step="0.1"
                      min="0.1"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Fuel Price (€/L)</label>
                    <input
                      type="number"
                      value={carConfig.price}
                      onChange={(e) =>
                        setCarConfig((prev) => ({ ...prev, price: e.target.value }))
                      }
                      step="0.01"
                      min="0.01"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 pt-3 border-t border-slate-200 bg-slate-50 space-y-3">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading || !originCity || !destinationCity || !effectiveDistance}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Comparing Transport...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compare Transport Options</span>
              </>
            )}
          </button>
        </div>
      </form>
    </aside>
  )
}
