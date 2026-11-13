import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { Car, Train, Bus, Fuel, Gauge, Euro, ArrowRight, Loader2 } from 'lucide-react'

const FUEL_TYPES = [
  { value: 'petrol', label: 'Petrol', icon: Fuel },
  { value: 'diesel', label: 'Diesel', icon: Fuel },
  { value: 'lpg', label: 'LPG', icon: Gauge },
  { value: 'electric', label: 'Electric', icon: Car },
]

export default function ComparisonForm({ onComplete }) {
  const { post, loading, error } = useApi()
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    distance_km: '',
    car_fuel_type: 'petrol',
    car_consumption_l_per_100km: '',
    car_fuel_price_per_liter: '',
  })
  const [showCarDetails, setShowCarDetails] = useState(true)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      origin: formData.origin,
      destination: formData.destination,
      distance_km: parseFloat(formData.distance_km),
      car_fuel_type: showCarDetails ? formData.car_fuel_type : undefined,
      car_consumption_l_per_100km: showCarDetails && formData.car_consumption_l_per_100km 
        ? parseFloat(formData.car_consumption_l_per_100km) 
        : undefined,
      car_fuel_price_per_liter: showCarDetails && formData.car_fuel_price_per_liter
        ? parseFloat(formData.car_fuel_price_per_liter)
        : undefined,
    }

    try {
      const result = await post('/api/comparisons/', payload)
      onComplete(result)
    } catch (err) {
      console.error('Comparison failed:', err)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Compare Transport Options</h2>
        <p className="text-gray-600">Enter your trip details to see time, cost, and CO₂ comparison</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route Input */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary-600" />
            Route
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="e.g., Berlin"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., Munich"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input
                type="number"
                name="distance_km"
                value={formData.distance_km}
                onChange={handleChange}
                placeholder="e.g., 585"
                className="input"
                required
                min="1"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Car Configuration */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-primary-600" />
              Car Configuration (Optional)
            </h3>
            <button
              type="button"
              onClick={() => setShowCarDetails(!showCarDetails)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showCarDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showCarDetails && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {FUEL_TYPES.map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className={`relative cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                        formData.car_fuel_type === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="car_fuel_type"
                        value={value}
                        checked={formData.car_fuel_type === value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumption (L/100km)
                  </label>
                  <input
                    type="number"
                    name="car_consumption_l_per_100km"
                    value={formData.car_consumption_l_per_100km}
                    onChange={handleChange}
                    placeholder="e.g., 7.5"
                    className="input"
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Price (€/L)
                  </label>
                  <input
                    type="number"
                    name="car_fuel_price_per_liter"
                    value={formData.car_fuel_price_per_liter}
                    onChange={handleChange}
                    placeholder="e.g., 1.85"
                    className="input"
                    min="0.01"
                    max="10"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.origin || !formData.destination || !formData.distance_km}
          className="w-full btn-primary py-3 text-lg disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Calculating...
            </span>
          ) : (
            'Compare Transport Options'
          )}
        </button>
      </form>
    </div>
  )
}