import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import HistoryCard from './HistoryCard'
import Alert from '../ui/Alert'
import EmptyState from '../ui/EmptyState'
import LoadingState from '../ui/LoadingState'
import { useApi } from '../../hooks/useApi'
import { useI18n } from '../../i18n/LanguageContext'
import type { ComparisonSummary } from '../../types'

interface HistoryListProps {
  onViewComparison: (id: number) => void
  onStartComparing: () => void
}

// Saved comparisons, newest first; each can be opened or deleted
export default function HistoryList({ onViewComparison, onStartComparing }: HistoryListProps) {
  const { get, delete: del, loading, error } = useApi()
  const { t } = useI18n()
  const [comparisons, setComparisons] = useState<ComparisonSummary[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    get<ComparisonSummary[]>('/comparisons/')
      .then(setComparisons)
      .catch((err) => console.error('Failed to load history:', err))
  }, [get])

  const handleDelete = async (id: number) => {
    if (!confirm(t('history.confirmDelete'))) return

    setDeletingId(id)
    try {
      await del(`/comparisons/${id}`)
      setComparisons((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert(t('history.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading && comparisons.length === 0) return <LoadingState message={t('history.loading')} />

  if (comparisons.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title={t('history.empty')}
        hint={t('history.emptyHint')}
        action={
          <button type="button" onClick={onStartComparing} className="btn-primary">
            {t('history.compareNow')}
          </button>
        }
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{t('history.title')}</h2>
        <span className="text-sm text-gray-500">{t('history.saved', { count: comparisons.length })}</span>
      </div>

      {error && <Alert className="mb-5">{error}</Alert>}

      <div className="space-y-3">
        {comparisons.map((comparison) => (
          <HistoryCard
            key={comparison.id}
            comparison={comparison}
            onOpen={() => onViewComparison(comparison.id)}
            onDelete={() => handleDelete(comparison.id)}
            deleting={deletingId === comparison.id}
          />
        ))}
      </div>
    </div>
  )
}
