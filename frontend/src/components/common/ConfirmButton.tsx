import { useState } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
// Radix handles closing on Escape or an outside click and returns focus to the button.
export default function ConfirmButton({
  icon: Icon,
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

  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (!next) setFailed(false)
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
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title={title ?? label}
          aria-label={label}
          className="text-muted-foreground hover:text-destructive"
          // e.g. don't open the card the button sits in
          onClick={(e) => e.stopPropagation()}
        >
          <Icon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        role="alertdialog"
        aria-label={message}
        align="end"
        className="w-60 gap-3 p-3"
        // React events bubble out of portals to the parent components: keep clicks here, and the keys
        // that would open a clickable card. Escape must pass, Radix closes the panel with it.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}
      >
        <p className="font-medium">{message}</p>
        {failed && <p className="text-xs text-destructive">{errorMessage}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => changeOpen(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
