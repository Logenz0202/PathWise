import type { MouseEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
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
}

// Small icon-only action button (edit, delete)
export default function IconButton({ icon: Icon, label, title, tone = 'primary', onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={label}
      className={cx('p-2 rounded-lg text-gray-400 transition-colors', TONES[tone])}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
