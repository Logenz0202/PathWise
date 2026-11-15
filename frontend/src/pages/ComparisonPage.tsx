import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import ComparisonResults from '../components/results/ComparisonResults'
import LoadingState from '../components/ui/LoadingState'
import Panel from '../components/ui/Panel'
import { ApiError, useApi } from '../hooks/useApi'
import { useI18n } from '../i18n/LanguageContext'
import type { Comparison } from '../types'

export const comparisonPath = (id: number) => `/comparisons/${id}`

// Router state for a result page: which page opened it (for "Back" and the highlighted nav tab).
// A result opened directly from its URL has none and behaves as if opened from History.
export interface ComparisonLocationState {
  from: 'planner' | 'history'
}

export const openedFrom = (state: unknown): ComparisonLocationState['from'] =>
  (state as ComparisonLocationState | null)?.from === 'planner' ? 'planner' : 'history'

interface ComparisonPageProps {
  // The comparison already in memory (just created or opened); others are loaded by id
  cached: Comparison | null
  onLoaded: (comparison: Comparison) => void
}

// Result page of one saved comparison: /comparisons/:id
export default function ComparisonPage({ cached, onLoaded }: ComparisonPageProps) {
  const { id } = useParams()
  const { state } = useLocation()
  const { get, error } = useApi()
  const { t } = useI18n()
  const [failure, setFailure] = useState<'notFound' | 'error' | null>(null)

  const comparisonId = Number(id)
  const validId = Number.isInteger(comparisonId) && comparisonId > 0
  const comparison = cached?.id === comparisonId ? cached : null

  useEffect(() => {
    if (comparison || !validId) return
    let cancelled = false
    setFailure(null)
    get<Comparison>(`/comparisons/${comparisonId}`)
      .then((loaded) => !cancelled && onLoaded(loaded))
      .catch((err) => !cancelled && setFailure(err instanceof ApiError && err.status === 404 ? 'notFound' : 'error'))
    return () => {
      cancelled = true
    }
  }, [comparison, comparisonId, validId, get, onLoaded])

  const fromPlanner = openedFrom(state) === 'planner'
  const backTo = fromPlanner ? '/' : '/history'
  const backLabel = t(fromPlanner ? 'back.map' : 'back.history')

  if (comparison) return <ComparisonResults comparison={comparison} backTo={backTo} backLabel={backLabel} />

  const problem = !validId || failure === 'notFound' ? t('results.notFound') : failure === 'error' ? error : null
  return (
    <Panel className="p-8 text-center">
      {problem ? (
        <>
          <p className="text-slate-700 mb-5">{problem}</p>
          <Link to={backTo} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </>
      ) : (
        <LoadingState message={t('results.loading')} />
      )}
    </Panel>
  )
}
