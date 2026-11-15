import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ChevronUp } from 'lucide-react'
import { useDismiss } from '../../hooks/useDismiss'
import { cx } from '../../utils/cx'

interface PopoverProps {
  // Content of the always-visible trigger button (a one-line summary of the current choice)
  summary: ReactNode
  // Panel content; `close` lets it close the panel after a choice
  children: (close: () => void) => ReactNode
  // Extra classes for the panel (padding, overflow)
  panelClassName?: string
  // Set when the panel is a list of options
  hasPopup?: 'listbox'
}

// Full-width button that opens a panel above itself (the sidebar's bottom controls have no room
// below). Closes on outside click or Escape.
export default function Popover({ summary, children, panelClassName, hasPopup }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup={hasPopup}
        aria-expanded={open}
        className={cx(
          'w-full px-3 py-2 rounded-xl border flex items-center gap-2 text-xs bg-white transition-colors',
          open ? 'border-primary-400' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {summary}
        <ChevronUp
          className={cx('w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform', !open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className={cx(
            'absolute bottom-full left-0 right-0 mb-2 z-20',
            'text-xs bg-white rounded-xl border border-slate-200 shadow-xl',
            panelClassName
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}
