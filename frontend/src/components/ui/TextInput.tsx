import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // 'sm' for compact panels (sidebar, popovers), 'md' for forms
  size?: 'sm' | 'md'
  // Unit shown inside the field on the right (e.g. "L/100km"); give the input matching right
  // padding through `className` (e.g. pr-24) so typed text doesn't run under it
  suffix?: ReactNode
}

// Text/number input with the app's border and focus style
export default function TextInput({ size = 'md', suffix, className, ...props }: TextInputProps) {
  const input = (
    <input
      {...props}
      className={cx(
        'w-full px-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400',
        'focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
        size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm',
        className
      )}
    />
  )
  if (!suffix) return input

  return (
    <span className="relative block">
      {input}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
        {suffix}
      </span>
    </span>
  )
}
