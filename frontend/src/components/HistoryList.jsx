import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { Car, Clock, Trash2, ChevronRight } from 'lucide-react'
import { useCurrency } from '../utils/currency'
import { useI18n } from '../i18n/LanguageContext'
import { MODES, MODE_KEYS } from '../utils/transport'
import { comparisonCarLabel } from '../utils/vehicle'

export default function HistoryList({ onViewComparison, onStartComparing }) {
  const { get, delete: del, loading, error } = useApi()
  const { formatMoney } = useCurrency()
  const { t, formatNumber, formatDuration, timeAgo } = useI18n()
  const [comparisons, setComparisons] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    get('/comparisons/')
      .then(setComparisons)
      .catch((err) => console.error('Failed to load history:', err))
  }, [get])

  const handleDelete = async (e, id) => {
    e.stopPropagation() // the button sits inside the clickable card
    if (!confirm(t('history.confirmDelete'))) return

    setDeletingId(id)
    try {
      await del(`/comparisons/${id}`)
      setComparisons(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert(t('history.deleteFailed'))
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
        <p className="text-gray-600">{t('history.loading')}</p>
      </div>
    )
  }

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('history.empty')}</h3>
        <p className="text-gray-500 mb-6">{t('history.emptyHint')}</p>
        <button
          onClick={onStartComparing}
          className="btn-primary"
        >
          {t('history.compareNow')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{t('history.title')}</h2>
        <span className="text-sm text-gray-500">{t('history.saved', { count: comparisons.length })}</span>
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
            className="card p-4 cursor-pointer group hover:border-primary-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                  {comparison.origin} → {comparison.destination}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{formatNumber(comparison.distance_km, 0)} km</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(comparison.created_at)}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 min-w-0">
                    <Car className="w-3 h-3 shrink-0" />
                    <span className="truncate">{comparisonCarLabel(comparison, t)}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, comparison.id)}
                  disabled={deletingId === comparison.id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title={t('history.delete')}
                  aria-label={t('history.deleteLabel', { origin: comparison.origin, destination: comparison.destination })}
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
              {MODE_KEYS.map((key) => {
                const mode = MODES[key]
                const option = comparison[key]
                if (!option) return null

                const Icon = mode.icon
                return (
                  <div
                    key={key}
                    title={t(mode.labelKey)}
                    className={`flex items-center gap-2.5 min-w-0 px-3 py-2 rounded-lg ${mode.soft} text-xs`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${mode.text}`} />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{formatDuration(option.time_minutes)}</div>
                      <div className="text-gray-500 truncate">
                        {formatMoney(option.cost_eur)} · {formatNumber(option.co2_kg)} kg CO₂
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
