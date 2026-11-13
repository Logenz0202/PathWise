import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { Car, Train, Bus, Clock, Euro, Leaf, Trash2, Eye, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TRANSPORT_CONFIG = {
  car: { icon: Car, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Car' },
  train: { icon: Train, color: 'text-red-600', bg: 'bg-red-50', label: 'Train' },
  bus: { icon: Bus, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Bus' },
}

export default function HistoryList({ onViewComparison, onSwitchToResults }) {
  const { get, loading, error } = useApi()
  const [comparisons, setComparisons] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await get('/api/comparisons/')
      setComparisons(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this comparison?')) return
    
    setDeletingId(id)
    try {
      await fetch(`/api/comparisons/${id}`, { method: 'DELETE' })
      setComparisons(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete comparison')
    } finally {
      setDeletingId(null)
    }
  }

  const handleView = (comparison) => {
    // Fetch full comparison details
    get(`/api/comparisons/${comparison.id}`).then(fullComparison => {
      onViewComparison(fullComparison)
      onSwitchToResults()
    })
  }

  if (loading && comparisons.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading history...</p>
      </div>
    )
  }

  if (comparisons.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No comparisons yet</h3>
        <p className="text-gray-500 mb-6">Start by comparing your first trip!</p>
        <button 
          onClick={() => onSwitchToResults?.()}
          className="btn-primary"
        >
          Compare Now
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Comparison History</h2>
        <span className="text-sm text-gray-500">{comparisons.length} saved</span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {comparisons.map((comparison) => (
          <div 
            key={comparison.id} 
            className="card p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {comparison.origin} → {comparison.destination}
                  </h3>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                    {comparison.distance_km} km
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(comparison.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleView(comparison)}
                  className="btn-secondary p-2"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(comparison.id)}
                  disabled={deletingId === comparison.id}
                  className="btn-secondary p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete"
                >
                  {deletingId === comparison.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick preview of results */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {['car', 'train', 'bus'].map((key) => {
                  const config = TRANSPORT_CONFIG[key]
                  const time = comparison[`${key}_time_minutes`]
                  const cost = comparison[`${key}_cost_eur`]
                  const co2 = comparison[`${key}_co2_kg`]
                  
                  if (time == null) return null
                  
                  const Icon = config.icon
                  return (
                    <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} whitespace-nowrap flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <div className="text-xs">
                        <p className="font-medium text-gray-900">{config.label}</p>
                        <p className="text-gray-500">
                          {Math.round(time)} min · €{cost?.toFixed(2)} · {co2?.toFixed(1)} kg CO₂
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}