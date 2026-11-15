import { useNavigate } from 'react-router'
import HistoryList from '../components/history/HistoryList'
import Panel from '../components/ui/Panel'
import { comparisonPath, type ComparisonLocationState } from './ComparisonPage'

// History (/history): saved comparisons; opening one goes to its result page
export default function HistoryPage() {
  const navigate = useNavigate()
  return (
    <Panel>
      <HistoryList
        onViewComparison={(id) => navigate(comparisonPath(id), { state: { from: 'history' } satisfies ComparisonLocationState })}
        onStartComparing={() => navigate('/')}
      />
    </Panel>
  )
}
