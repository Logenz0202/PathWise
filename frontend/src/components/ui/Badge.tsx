import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '../../utils/cx'

// Literal class names so Tailwind picks them up
const TONES = {
  violet: { badge: 'bg-violet-100 text-violet-900', icon: 'text-violet-600', fill: 'fill-violet-600' },
  amber: { badge: 'bg-amber-100 text-amber-900', icon: 'text-amber-600', fill: 'fill-amber-600' },
  blue: { badge: 'bg-blue-100 text-blue-900', icon: 'text-blue-600', fill: 'fill-blue-600' },
  emerald: { badge: 'bg-emerald-100 text-emerald-900', icon: 'text-emerald-600', fill: 'fill-emerald-600' },
}

export type BadgeTone = keyof typeof TONES

interface BadgeProps {
  tone: BadgeTone
  icon: LucideIcon
  // Fill the icon shape too (for solid-looking icons like the lightning bolt)
  filled?: boolean
  children: ReactNode
}

// Small coloured label with an icon, e.g. "Fastest" on a result card
export default function Badge({ tone, icon: Icon, filled = false, children }: BadgeProps) {
  const colors = TONES[tone]
  return (
    <span className={cx('px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs', colors.badge)}>
      <Icon className={cx('w-3.5 h-3.5', colors.icon, filled && colors.fill)} />
      {children}
    </span>
  )
}
