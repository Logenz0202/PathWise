import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import HistoryCard from './HistoryCard'
import EmptyState from '@/components/common/EmptyState'
import LoadingState from '@/components/common/LoadingState'
import { useApi } from '@/hooks/useApi'
import { useI18n } from '@/i18n/LanguageContext'
import type { ComparisonSummary } from '@/types'

interface HistoryListProps {
  onViewComparison: (id: number) => void
  onStartComparing: () => void
  // Called after a comparison is deleted, so cached copies elsewhere can be dropped
  onDeleted: (id: number) => void
}

// Saved comparisons, newest first; each can be opened or deleted
export default function HistoryList({ onViewComparison, onStartComparing, onDeleted }: HistoryListProps) {
  const { get, delete: del, loading, error } = useApi()
  const { t } = useI18n()
  const [comparisons, setComparisons] = useState<ComparisonSummary[]>([])

  useEffect(() => {
    get<ComparisonSummary[]>('/comparisons/')
      .then(setComparisons)
      .catch((err) => console.error('Failed to load history:', err))
  }, [get])

  // Confirmed in the delete button's popover, which also shows an error if this throws
  const handleDelete = async (id: number) => {
    await del(`/comparisons/${id}`)
    setComparisons((prev) => prev.filter((c) => c.id !== id))
    onDeleted(id)
  }

  if (loading && comparisons.length === 0) return <LoadingState message={t('history.loading')} />

  if (comparisons.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title={t('history.empty')}
        hint={t('history.emptyHint')}
        action={<Button onClick={onStartComparing}>{t('history.compareNow')}</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">{t('history.title')}</h1>
        <span className="text-sm text-muted-foreground">{t('history.saved', { count: comparisons.length })}</span>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {comparisons.map((comparison) => (
          <HistoryCard
            key={comparison.id}
            comparison={comparison}
            onOpen={() => onViewComparison(comparison.id)}
            onDelete={() => handleDelete(comparison.id)}
          />
        ))}
      </div>
    </div>
  )
}
