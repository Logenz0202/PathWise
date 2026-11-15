import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'

// White card that list pages (history, cars) and page-level messages sit on
export default function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200',
        className ?? 'p-5 sm:p-6'
      )}
    >
      {children}
    </div>
  )
}
