import type { MouseEvent } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cx } from '../../utils/cx'

const TONES = {
  primary: 'hover:text-primary-600 hover:bg-primary-50',
  danger: 'hover:text-red-600 hover:bg-red-50',
}

interface IconButtonProps {
  icon: LucideIcon
  // Accessible name; also shown as the tooltip unless `title` is given
  label: string
  title?: string
  tone?: keyof typeof TONES
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  // Shows a spinner and disables the button (e.g. while deleting)
  busy?: boolean
}

// Small icon-only action button (edit, delete)
export default function IconButton({ icon: Icon, label, title, tone = 'primary', onClick, busy = false }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title ?? label}
      aria-label={label}
      className={cx('p-2 rounded-lg text-gray-400 transition-colors disabled:opacity-50', TONES[tone])}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
    </button>
  )
}
