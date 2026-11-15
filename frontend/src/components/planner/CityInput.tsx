import { useEffect, useState, type KeyboardEvent, type Ref } from 'react'
import { MapPin, X } from 'lucide-react'
import { searchCities } from '../../utils/geoData'
import { useI18n } from '../../i18n/LanguageContext'
import { cx } from '../../utils/cx'

type Accent = 'emerald' | 'indigo'

// Literal class names so Tailwind picks them up
const ACCENTS: Record<Accent, Record<'dot' | 'pin' | 'focus' | 'hover' | 'hoverText', string>> = {
  emerald: {
    dot: 'bg-emerald-500 ring-emerald-200',
    pin: 'text-emerald-600',
    focus: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    hover: 'hover:bg-emerald-50',
    hoverText: 'group-hover:text-emerald-700',
  },
  indigo: {
    dot: 'bg-indigo-500 ring-indigo-200',
    pin: 'text-indigo-600',
    focus: 'focus:ring-indigo-500/20 focus:border-indigo-500',
    hover: 'hover:bg-indigo-50',
    hoverText: 'group-hover:text-indigo-700',
  },
}

// City search box with an autocomplete list. `value` is the selected city; typing only filters
// suggestions, and leaving the field without picking one restores the selected city's name.
interface CityInputProps {
  label: string
  placeholder: string
  value: string
  onSelect: (name: string) => void
  accent: Accent
  ref?: Ref<HTMLInputElement>
}

export default function CityInput({ label, placeholder, value, onSelect, accent, ref }: CityInputProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const colors = ACCENTS[accent]
  const suggestions = open ? searchCities(query) : []

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  const close = () => {
    setOpen(false)
    setQuery(value || '')
  }

  const select = (name: string) => {
    onSelect(name)
    setQuery(name)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && open && suggestions.length > 0) {
      e.preventDefault() // don't submit the form
      select(suggestions[0].name)
    } else if (e.key === 'Escape') {
      close()
    }
  }

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
        <span className={cx('w-2.5 h-2.5 rounded-full ring-2', colors.dot)} />
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={close}
          onKeyDown={onKeyDown}
          className={cx(
            'w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg',
            'text-sm font-medium text-slate-900 placeholder:text-slate-400',
            'focus:outline-hidden focus:ring-2 transition-all',
            colors.focus
          )}
        />
        <MapPin className={cx('w-4 h-4 absolute left-3 pointer-events-none', colors.pin)} />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select('')}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div
          className={cx(
            'absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto',
            'bg-white rounded-xl shadow-xl border border-slate-200 divide-y divide-slate-100'
          )}
        >
          {suggestions.map((city) => (
            <button
              key={city.id}
              type="button"
              // mousedown would blur the input (closing the list) before the click registers
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(city.name)}
              className={cx('w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors group', colors.hover)}
            >
              <div className="flex items-center gap-2">
                <span className={cx('font-medium text-slate-800', colors.hoverText)}>{city.name}</span>
                {city.isCapital && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-sm">
                    {t('sidebar.capital')}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">{city.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
