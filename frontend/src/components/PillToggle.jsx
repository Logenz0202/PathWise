// Two-option pill (e.g. EUR | PLN). The whole pill is one button: a click anywhere flips the value.
export default function PillToggle({ options, value, onChange, label, title }) {
  const next = options.find((o) => o !== value) ?? value
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title={title}
      aria-label={label}
      className="group flex items-center bg-slate-800/80 hover:bg-slate-800 p-1 rounded-xl border border-slate-700/60 hover:border-slate-600 text-xs font-semibold transition-colors"
    >
      {options.map((option) => (
        <span
          key={option}
          className={`px-2.5 py-1.5 rounded-lg transition-all ${
            value === option ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 group-hover:text-white'
          }`}
        >
          {option.toUpperCase()}
        </span>
      ))}
    </button>
  )
}
