import { useState } from 'react'
import ComparisonForm from './components/ComparisonForm'
import ComparisonResults from './components/ComparisonResults'
import HistoryList from './components/HistoryList'
import { Car, Train, Bus, Leaf, Clock, Euro, History } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('compare')
  const [lastComparison, setLastComparison] = useState(null)

  const handleComparisonComplete = (comparison) => {
    setLastComparison(comparison)
    setActiveTab('results')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">PathWise</h1>
            </div>
            
            <nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('compare')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'compare'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Compare
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                History
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'compare' && (
          <ComparisonForm onComplete={handleComparisonComplete} />
        )}
        
        {activeTab === 'results' && lastComparison && (
          <ComparisonResults 
            comparison={lastComparison} 
            onBack={() => setActiveTab('compare')} 
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryList onViewComparison={setLastComparison} onSwitchToResults={() => setActiveTab('results')} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>PathWise - Smart Transport Comparison & Planner</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <Car className="w-4 h-4" />
                <span>Car</span>
              </div>
              <div className="flex items-center gap-1">
                <Train className="w-4 h-4" />
                <span>Train</span>
              </div>
              <div className="flex items-center gap-1">
                <Bus className="w-4 h-4" />
                <span>Bus</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App