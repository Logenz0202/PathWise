import { useNavigate } from 'react-router'
import HistoryList from '@/components/history/HistoryList'
import { comparisonPath, type ComparisonLocationState } from './ComparisonPage'

// History (/history): saved comparisons; opening one goes to its result page
export default function HistoryPage({ onDeleted }: { onDeleted: (id: number) => void }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl">
      <HistoryList
        onViewComparison={(id) => navigate(comparisonPath(id), { state: { from: 'history' } satisfies ComparisonLocationState })}
        onStartComparing={() => navigate('/')}
        onDeleted={onDeleted}
      />
    </div>
  )
}
