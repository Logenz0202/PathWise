import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, type LucideIcon } from 'lucide-react'
import IconButton from './IconButton'
import { cx } from '../../utils/cx'

const PANEL_WIDTH = 240 // px
const GAP = 6 // px between the button and the panel

interface ConfirmButtonProps {
  icon: LucideIcon
  // Accessible name of the icon button; also its tooltip unless `title` is given
  label: string
  title?: string
  // Question shown in the panel, e.g. "Delete this comparison?"
  message: string
  confirmLabel: string
  cancelLabel: string
  // Shown in the panel if `onConfirm` fails
  errorMessage: string
  onConfirm: () => Promise<void>
}

// Icon button that asks for confirmation in a small panel next to it (instead of window.confirm).
// The panel is rendered into <body>, so cards with overflow-hidden don't clip it. Closes on Escape,
// an outside click or scrolling.
export default function ConfirmButton({
  icon,
  label,
  title,
  message,
  confirmLabel,
  cancelLabel,
  errorMessage,
  onConfirm,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setFailed(false)
  }, [])

  // Below the button, right-aligned with it; above it when there is no room below
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const anchor = anchorRef.current.getBoundingClientRect()
    const panelHeight = panelRef.current?.offsetHeight ?? 0
    const below = anchor.bottom + GAP
    const top = below + panelHeight > window.innerHeight ? anchor.top - GAP - panelHeight : below
    setPosition({ top, left: Math.max(8, anchor.right - PANEL_WIDTH) })
  }, [open, failed])

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !anchorRef.current?.contains(target)) close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close])

  // Back to the delete button, so keyboard users don't lose their place
  const closeAndRefocus = () => {
    close()
    anchorRef.current?.querySelector('button')?.focus()
  }

  const confirm = async () => {
    setBusy(true)
    setFailed(false)
    try {
      await onConfirm()
      setOpen(false) // the row usually disappears; if not, the panel closes
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span ref={anchorRef} className="inline-flex">
      <IconButton
        icon={icon}
        label={label}
        title={title}
        tone="danger"
        onClick={(e) => {
          e.stopPropagation() // e.g. don't open the card the button sits in
          if (open) close()
          else setOpen(true)
        }}
      />
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="alertdialog"
            aria-label={message}
            // React events bubble out of portals to the parent components: keep clicks and keys here.
            // That also stops Escape before the document listener, so it's handled here too.
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Escape') closeAndRefocus()
            }}
            style={{ width: PANEL_WIDTH, top: position?.top ?? -9999, left: position?.left ?? -9999 }}
            className="fixed z-[2000] p-3 space-y-3 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-xl text-sm"
          >
            <p className="font-medium text-slate-800">{message}</p>
            {failed && <p className="text-xs text-red-600">{errorMessage}</p>}
            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={closeAndRefocus}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className={cx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                  'bg-red-600 text-white hover:bg-red-700 disabled:opacity-60'
                )}
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </div>,
          document.body
        )}
    </span>
  )
}
