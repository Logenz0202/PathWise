import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../utils/cx'

interface ChoiceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean
}

// One option in a group of choices (fuel type, trip priority). Layout comes from `className`;
// the selected/unselected look is shared. Set aria-pressed or role="radio" + aria-checked.
export default function ChoiceButton({ selected, className, ...props }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'rounded-lg border transition-all',
        selected
          ? 'border-primary-500 bg-primary-50 text-primary-900 font-bold shadow-xs'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
        className
      )}
    />
  )
}
