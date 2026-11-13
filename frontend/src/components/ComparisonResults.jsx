import {
  Car,
  Train,
  Bus,
  Clock,
  Euro,
  Leaf,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react'

const TRANSPORT_CONFIG = {
  car: {
    icon: Car,
    color: 'bg-blue-600',
    borderColor: 'border-blue-500',
    lightBg: 'bg-blue-50/70',
    badgeBg: 'bg-blue-100 text-blue-800',
    textColor: 'text-blue-700',
    label: 'Car',
    speed: '~80 km/h',
  },
  train: {
    icon: Train,
    color: 'bg-red-600',
    borderColor: 'border-red-500',
    lightBg: 'bg-red-50/70',
    badgeBg: 'bg-red-100 text-red-800',
    textColor: 'text-red-700',
    label: 'Train',
    speed: '~120 km/h',
  },
  bus: {
    icon: Bus,
    color: 'bg-amber-600',
    borderColor: 'border-amber-500',
    lightBg: 'bg-amber-50/70',
    badgeBg: 'bg-amber-100 text-amber-800',
    textColor: 'text-amber-700',
    label: 'Bus',
    speed: '~70 km/h',
  },
}

const METRICS = [
  {
    key: 'time_minutes',
    label: 'Travel Time',
    icon: Clock,
    unit: 'min',
    format: (v) => {
      const h = Math.floor(v / 60)
      const m = Math.round(v % 60)
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    },
  },
  {
    key: 'cost_eur',
    label: 'Est. Cost',
    icon: Euro,
    unit: '€',
    format: (v) => `€${v.toFixed(2)}`,
  },
  {
    key: 'co2_kg',
    label: 'CO₂ Emissions',
    icon: Leaf,
    unit: 'kg',
    format: (v) => `${v.toFixed(1)} kg`,
  },
]

// The recommendation text marks emphasis as **bold**; render it instead of showing the asterisks
function renderBold(line) {
  return line.split('**').map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

export default function ComparisonResults({ comparison, onBack }) {
  const options = [
    { key: 'car', data: comparison.car },
    { key: 'train', data: comparison.train },
    { key: 'bus', data: comparison.bus },
  ].filter(({ data }) => data)

  // Find best for each metric
  const best = {}
  METRICS.forEach(({ key }) => {
    const valid = options.filter((o) => o.data[key] != null)
    if (valid.length > 0) {
      best[key] = valid.reduce((a, b) => (a.data[key] < b.data[key] ? a : b)).key
    }
  })

  // Calculate CO2 savings vs highest polluter
  const maxCo2 = Math.max(...options.map((o) => o.data.co2_kg || 0))
  const minCo2 = Math.min(...options.map((o) => o.data.co2_kg || 0))
  const co2Saved = maxCo2 > 0 ? (maxCo2 - minCo2).toFixed(1) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Interactive Map</span>
        </button>

        <div className="text-center sm:text-right">
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {comparison.origin}
            </span>
            <span className="text-slate-400 font-bold">→</span>
            <span className="text-2xl font-black text-primary-600 tracking-tight">
              {comparison.destination}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Road Distance: <span className="text-slate-800 font-bold">{comparison.distance_km} km</span>
          </p>
        </div>
      </div>

      {/* AI Eco-Coach Recommendation */}
      {comparison.ai_recommendation && (
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  AI Eco-Coach Insight
                </span>
                {co2Saved > 0 && (
                  <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                    🌱 Up to {co2Saved} kg CO₂ saved by choosing the greenest option
                  </span>
                )}
              </div>
              <div className="text-slate-200 text-sm leading-relaxed space-y-1">
                {comparison.ai_recommendation.split('\n').map((line, idx) => (
                  <p key={idx} className={line.startsWith('🏆') ? 'font-bold text-white text-base' : ''}>
                    {renderBold(line)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Main Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map(({ key, data }) => {
          const config = TRANSPORT_CONFIG[key]
          const Icon = config.icon
          const isFastest = best['time_minutes'] === key
          const isCheapest = best['cost_eur'] === key
          const isGreenest = best['co2_kg'] === key

          return (
            <div
              key={key}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl p-6 flex flex-col justify-between ${
                isGreenest
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {isFastest && (
                  <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 rounded-lg flex items-center gap-1 shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    Fastest
                  </span>
                )}
                {isCheapest && (
                  <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-900 rounded-lg flex items-center gap-1 shadow-sm">
                    <Euro className="w-3.5 h-3.5 text-blue-600" />
                    Cheapest
                  </span>
                )}
                {isGreenest && (
                  <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-lg flex items-center gap-1 shadow-sm">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    Eco Champion
                  </span>
                )}
              </div>

              {/* Mode Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3.5 rounded-xl text-white shadow-md ${config.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{config.label}</h3>
                  <p className="text-xs text-slate-400 font-medium">Avg Speed {config.speed}</p>
                </div>
              </div>

              {/* Core Metric Values */}
              <div className="space-y-3.5 mb-6">
                {METRICS.map(({ key: mKey, label, icon: MetricIcon, format }) => {
                  const isWinningMetric = best[mKey] === key
                  return (
                    <div
                      key={mKey}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isWinningMetric
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <MetricIcon
                          className={`w-4 h-4 ${
                            isWinningMetric ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-base font-extrabold ${
                            isWinningMetric ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {format(data[mKey])}
                        </span>
                        {isWinningMetric && (
                          <span className="ml-1 text-[11px] font-bold text-amber-600">★</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Relative Progress / Visual Bar */}
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                <div className="flex justify-between font-medium text-[11px]">
                  <span>Environmental Score</span>
                  <span className={isGreenest ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                    {data.co2_kg.toFixed(1)} kg CO₂
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isGreenest ? 'bg-emerald-500' : key === 'bus' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.max(12, Math.min(100, ((data.co2_kg || 1) / (maxCo2 || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Car Configuration Details if available */}
      {comparison.car_fuel_type && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Car className="w-4 h-4 text-primary-600" />
            Car Parameters Used for Computation
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Fuel Type</span>
              <span className="font-bold text-slate-800 capitalize">
                {comparison.car_fuel_type}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Average Consumption</span>
              <span className="font-bold text-slate-800">
                {comparison.car_consumption_l_per_100km} L / 100km
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Fuel Price</span>
              <span className="font-bold text-slate-800">
                €{comparison.car_fuel_price_per_liter} / L
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
