import { Link } from 'react-router'
import { Route } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CURRENCIES, useCurrency } from '@/utils/currency'
import { LANGUAGES, useI18n } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import { cn } from '@/lib/utils'
import type { Currency, Language } from '@/types'

const NAV_TABS: { to: string; labelKey: TranslationKey }[] = [
  { to: '/', labelKey: 'nav.map' },
  { to: '/history', labelKey: 'nav.history' },
  { to: '/cars', labelKey: 'nav.cars' },
]

// Two-option switch (EN | PL, EUR | PLN)
function Switch<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: T[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      spacing={0}
      variant="outline"
      value={value}
      // Radix sends '' when the active item is clicked again; keep the current value then
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          className="px-2 text-xs text-muted-foreground data-[state=on]:text-foreground"
        >
          {option.toUpperCase()}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// Top bar: name, page navigation, language and currency.
// `activeTab` is the nav path to highlight (a result page highlights the tab it was opened from).
export default function Header({ activeTab }: { activeTab: string }) {
  const { currency, setCurrency } = useCurrency()
  const { lang, setLang, t, stableText } = useI18n()
  const otherCurrency = currency === 'EUR' ? 'PLN' : 'EUR'
  const otherLang = lang === 'en' ? 'pl' : 'en'

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Route className="size-5 text-primary" />
          PathWise
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV_TABS.map(({ to, labelKey }) => (
            <Link
              key={to}
              to={to}
              aria-current={activeTab === to ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-1.5 transition-colors',
                activeTab === to ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {stableText(labelKey)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Switch
            options={Object.keys(LANGUAGES) as Language[]}
            value={lang}
            onChange={setLang}
            label={t('toggle.language', { current: lang.toUpperCase(), next: otherLang.toUpperCase() })}
          />
          <Switch
            options={Object.keys(CURRENCIES) as Currency[]}
            value={currency}
            onChange={setCurrency}
            label={t('toggle.currency', { current: currency, next: otherCurrency })}
          />
        </div>
      </div>
    </header>
  )
}
