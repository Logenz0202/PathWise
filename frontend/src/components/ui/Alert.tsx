import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'

interface AlertProps {
  children: ReactNode
  // 'sm' for compact places (forms, sidebar), 'md' at the top of a page
  size?: 'sm' | 'md'
  className?: string
}

// Red error message box
export default function Alert({ children, size = 'md', className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cx(
        'bg-red-50 border border-red-200 text-red-700',
        size === 'sm' ? 'p-2.5 rounded-lg text-xs' : 'p-3 rounded-lg text-sm',
        className
      )}
    >
      {children}
    </div>
  )
}
