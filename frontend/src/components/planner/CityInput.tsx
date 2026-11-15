import { useEffect, useState, type KeyboardEvent, type Ref } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchCities } from '@/utils/geoData'
import { useI18n } from '@/i18n/LanguageContext'
import { cn } from '@/lib/utils'

type Endpoint = 'start' | 'finish'

// Literal class names so Tailwind picks them up
const DOT: Record<Endpoint, string> = { start: 'bg-start', finish: 'bg-finish' }

interface CityInputProps {
  label: string
  placeholder: string
  value: string
  onSelect: (name: string) => void
  // Which end of the trip: shown as the matching map colour (green A / violet B)
  endpoint: Endpoint
  ref?: Ref<HTMLInputElement>
}

// Place search box with an autocomplete list. `value` is the selected place; typing only filters
// suggestions, and leaving the field without picking one restores the selected place's name.
export default function CityInput({ label, placeholder, value, onSelect, endpoint, ref }: CityInputProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
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
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={cn('size-2 rounded-full', DOT[endpoint])} />
        {label}
      </label>
      <div className="relative">
        <Input
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
          className="h-9 pr-8"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select('')}
            aria-label={t('sidebar.clearAll')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
          {suggestions.map((city) => (
            <button
              key={city.id}
              type="button"
              // mousedown would blur the input (closing the list) before the click registers
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(city.name)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <span>{city.name}</span>
                {city.isCapital && <span className="text-[10px] text-muted-foreground">{t('sidebar.capital')}</span>}
              </span>
              <span className="text-xs text-muted-foreground">{city.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
