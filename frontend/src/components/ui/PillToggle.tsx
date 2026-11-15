import { cx } from '../../utils/cx'

interface PillToggleProps<T extends string> {
  options: T[]
  value: T
  onChange: (value: T) => void
  label: string
  title: string
}

// Two-option pill (e.g. EUR | PLN). The whole pill is one button: a click anywhere flips the value.
export default function PillToggle<T extends string>({ options, value, onChange, label, title }: PillToggleProps<T>) {
  const next = options.find((o) => o !== value) ?? value
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title={title}
      aria-label={label}
      className={cx(
        'group flex items-center p-1 rounded-xl border text-xs font-semibold transition-colors',
        'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600'
      )}
    >
      {options.map((option) => (
        <span
          key={option}
          className={cx(
            'px-2.5 py-1.5 rounded-lg transition-all',
            value === option ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 group-hover:text-white'
          )}
        >
          {option.toUpperCase()}
        </span>
      ))}
    </button>
  )
}
