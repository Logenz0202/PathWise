import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { Car, Train, Bus, Clock, Trash2, ChevronRight } from 'lucide-react'
import { formatDuration } from '../utils/format'
import { useCurrency } from '../utils/currency'

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays}d ago`
}

const TRANSPORT_CONFIG = {
  car: { icon: Car, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Car' },
  train: { icon: Train, color: 'text-red-600', bg: 'bg-red-50', label: 'Train' },
  bus: { icon: Bus, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Bus' },
}

export default function HistoryList({ onViewComparison, onStartComparing }) {
  const { get, delete: del, loading, error } = useApi()
  const { formatMoney } = useCurrency()
  const [comparisons, setComparisons] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await get('/comparisons/')
      setComparisons(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation() // the button sits inside the clickable card
    if (!confirm('Delete this comparison?')) return

    setDeletingId(id)
    try {
      await del(`/comparisons/${id}`)
      setComparisons(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete comparison')
    } finally {
      setDeletingId(null)
    }
  }

  // The list only holds summaries; fetch the full comparison (incl. AI recommendation) to show it
  const handleView = async (comparison) => {
    try {
      onViewComparison(await get(`/comparisons/${comparison.id}`))
    } catch (err) {
      console.error('Failed to load comparison:', err)
    }
  }

  if (loading && comparisons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading history...</p>
      </div>
    )
  }

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No comparisons yet</h3>
        <p className="text-gray-500 mb-6">Start by comparing your first trip!</p>
        <button
          onClick={onStartComparing}
          className="btn-primary"
        >
          Compare Now
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Comparison History</h2>
        <span className="text-sm text-gray-500">{comparisons.length} saved</span>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {comparisons.map((comparison) => (
          <div
            key={comparison.id}
            role="button"
            tabIndex={0}
            onClick={() => handleView(comparison)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleView(comparison)
              }
            }}
            className="card p-4 cursor-pointer group hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                  {comparison.origin} → {comparison.destination}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{comparison.distance_km} km</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(comparison.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, comparison.id)}
                  disabled={deletingId === comparison.id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete"
                  aria-label={`Delete ${comparison.origin} to ${comparison.destination}`}
                >
                  {deletingId === comparison.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Quick preview of results: one fixed column per mode so they never wrap into a second row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['car', 'train', 'bus'].map((key) => {
                const config = TRANSPORT_CONFIG[key]
                const option = comparison[key]
                if (!option) return null

                const Icon = config.icon
                return (
                  <div
                    key={key}
                    title={config.label}
                    className={`flex items-center gap-2.5 min-w-0 px-3 py-2 rounded-lg ${config.bg} text-xs`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{formatDuration(option.time_minutes)}</div>
                      <div className="text-gray-500 truncate">
                        {formatMoney(option.cost_eur)} · {option.co2_kg.toFixed(1)} kg CO₂
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
