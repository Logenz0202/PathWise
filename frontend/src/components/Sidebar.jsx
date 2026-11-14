import { useRef, useState } from 'react'
import { ArrowUpDown, CheckCircle2, Info, Loader2, Route, Sparkles } from 'lucide-react'
import { calculateRoadDistance } from '../utils/geoData'
import { useCurrency } from '../utils/currency'
import { MODES, MODE_KEYS } from '../utils/transport'
import { useI18n } from '../i18n/LanguageContext'
import CarPicker from './CarPicker'
import CityInput from './CityInput'

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
}) {
  const [showManualDistance, setShowManualDistance] = useState(false)
  const [manualDistance, setManualDistance] = useState('')

  const destInputRef = useRef(null)

  const { currency } = useCurrency()
  const { lang, t, formatNumber, formatDuration } = useI18n()

  // Auto-calculated distance in km
  const autoDistance = calculateRoadDistance(originCity, destinationCity)
  const effectiveDistance = showManualDistance && manualDistance ? parseFloat(manualDistance) : autoDistance

  // Rough travel-time estimate per mode, shown before comparing
  const estimateMinutes = (key) => (effectiveDistance / MODES[key].speedKmh) * 60

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!originCity || !destinationCity || !effectiveDistance) return

    onCompare({
      origin: originCity,
      destination: destinationCity,
      distance_km: effectiveDistance,
      // No car selected: leave these out and the backend uses average car figures
      ...(selectedCar && {
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
      {/* Sidebar Header & Navigation */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700">
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
              className="text-xs px-2.5 py-1 bg-primary-600 hover:bg-primary-500 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>{t('sidebar.viewResults')}</span>
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

            {/* Swap Button */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                type="button"
                onClick={onSwapCities}
                title={t('sidebar.swap')}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-primary-600 rounded-full border border-slate-200 shadow-sm transition-all transform hover:rotate-180 duration-200"
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

          {/* Automatic Road Distance Card */}
          {originCity && destinationCity ? (
            <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-primary-500/5 to-indigo-500/10 border border-primary-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {t('sidebar.distance')}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-[10px] rounded-full">
                  {t('sidebar.auto')}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {Number.isInteger(effectiveDistance) ? effectiveDistance : formatNumber(effectiveDistance)}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 ml-1">km</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualDistance(!showManualDistance)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium underline"
                >
                  {showManualDistance ? t('sidebar.useAuto') : t('sidebar.adjust')}
                </button>
              </div>

              {/* Optional manual override */}
              {showManualDistance && (
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] text-slate-600 mb-1">
                    {t('sidebar.customDistance')}
                  </label>
                  <input
                    type="number"
                    value={manualDistance}
                    placeholder={t('sidebar.defaultDistance', { km: autoDistance })}
                    onChange={(e) => setManualDistance(e.target.value)}
                    min="1"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              )}

              {/* Quick Trip Preview Pills */}
              {effectiveDistance > 0 && (
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-primary-200/60 text-center">
                  {MODE_KEYS.map((key) => {
                    const { icon: Icon, text, labelKey } = MODES[key]
                    return (
                      <div key={key} className="bg-white/90 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-center gap-1 text-slate-600 text-[10px] font-semibold">
                          <Icon className={`w-3 h-3 ${text}`} />
                          <span>{t(labelKey)}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{formatDuration(estimateMinutes(key))}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
              {t('sidebar.pickBoth')}
            </div>
          )}
        </div>

        <div className="p-4 pt-3 border-t border-slate-200 bg-slate-50 space-y-3">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {error}
            </div>
          )}

          <CarPicker cars={cars} selectedCar={selectedCar} onSelect={onSelectCar} onManage={onManageCars} />

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading || !originCity || !destinationCity || !effectiveDistance}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
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
