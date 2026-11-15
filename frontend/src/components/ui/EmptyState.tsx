import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  hint: string
  // Optional call to action under the hint
  action?: ReactNode
}

// Placeholder for an empty list: grey icon, title and a hint
export default function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className={action ? 'text-center py-16' : 'text-center py-12'}>
      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className={action ? 'text-lg font-medium text-gray-900 mb-2' : 'text-lg font-medium text-gray-900 mb-1'}>
        {title}
      </h3>
      <p className={action ? 'text-gray-500 mb-6' : 'text-gray-500'}>{hint}</p>
      {action}
    </div>
  )
}
