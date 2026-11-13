import { Car, Train, Bus, Clock, Euro, Leaf, ArrowLeft, Trophy, Sparkles } from 'lucide-react'

const TRANSPORT_CONFIG = {
  car: { icon: Car, color: 'bg-blue-500', label: 'Car', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  train: { icon: Train, color: 'bg-red-500', label: 'Train', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  bus: { icon: Bus, color: 'bg-amber-500', label: 'Bus', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
}

const METRICS = [
  { key: 'time_minutes', label: 'Time', icon: Clock, unit: 'min', format: (v) => `${Math.round(v)}` },
  { key: 'cost_eur', label: 'Cost', icon: Euro, unit: '€', format: (v) => v.toFixed(2) },
  { key: 'co2_kg', label: 'CO₂', icon: Leaf, unit: 'kg', format: (v) => v.toFixed(1) },
]

export default function ComparisonResults({ comparison, onBack }) {
  const options = [
    { key: 'car', data: comparison.car },
    { key: 'train', data: comparison.train },
    { key: 'bus', data: comparison.bus },
  ].filter(({ data }) => data)

  // Find best for each metric
  const best = {}
  METRICS.forEach(({ key }) => {
    const valid = options.filter(o => o.data[key] != null)
    if (valid.length > 0) {
      best[key] = valid.reduce((a, b) => a.data[key] < b.data[key] ? a : b).key
    }
  })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Compare
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {comparison.origin} → {comparison.destination}
          </h2>
          <p className="text-gray-500">{comparison.distance_km} km</p>
        </div>
        <div className="w-24" />
      </div>

      {/* AI Recommendation */}
      {comparison.ai_recommendation && (
        <div className="card p-6 mb-8 border-eco-200 bg-eco-50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-eco-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-eco-600" />
            </div>
            <div className="flex-1 prose prose-sm max-w-none text-eco-800">
              {comparison.ai_recommendation.split('\n').map((line, i) => (
                <p key={i} className="mb-1">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {options.map(({ key, data }) => {
          const config = TRANSPORT_CONFIG[key]
          const Icon = config.icon
          const isBest = (metricKey) => best[metricKey] === key

          return (
            <div key={key} className={`transport-card ${config.bg} ${config.border} relative`}>
              {/* Best badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-1">
                {METRICS.map(({ key: mKey }) => 
                  isBest(mKey) && (
                    <span key={mKey} className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Best
                    </span>
                  )
                )}
              </div>

              {/* Transport Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${config.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{config.label}</h3>
              </div>

              {/* Metrics */}
              <div className="space-y-4">
                {METRICS.map(({ key: mKey, label, icon: MetricIcon, format }) => (
                  <div key={mKey} className={`flex items-center gap-3 p-3 rounded-lg ${isBest(mKey) ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <MetricIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className={`text-2xl font-bold ${isBest(mKey) ? 'text-yellow-700' : 'text-gray-900'}`}>
                        {format(data[mKey])}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                {options.map(({ key }) => (
                  <th key={key} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TRANSPORT_CONFIG[key].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {METRICS.map(({ key: mKey, label, format }) => (
                <tr key={mKey} className={best[mKey] ? 'bg-yellow-50/50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{label}</td>
                  {options.map(({ key, data }) => (
                    <td key={key} className="px-4 py-3 text-center text-sm text-gray-700">
                      <span className={`font-bold ${best[mKey] === key ? 'text-yellow-700' : ''}`}>
                        {format(data[mKey])}
                      </span>
                      {best[mKey] === key && (
                        <span className="ml-1 text-xs text-yellow-600 font-medium">★</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Car Details */}
      {comparison.car_fuel_type && (
        <div className="card p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Car Configuration Used
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700 font-medium">Fuel Type</p>
              <p className="text-blue-900 capitalize">{comparison.car_fuel_type}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Consumption</p>
              <p className="text-blue-900">{comparison.car_consumption_l_per_100km} L/100km</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Fuel Price</p>
              <p className="text-blue-900">€{comparison.car_fuel_price_per_liter}/L</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}