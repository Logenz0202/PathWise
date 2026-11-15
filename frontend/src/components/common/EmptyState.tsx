import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  hint: string
  // Optional call to action under the hint
  action?: ReactNode
}

// Placeholder for an empty list: icon, title and a hint
export default function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <Icon className="mb-1 size-6 text-muted-foreground" />
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
