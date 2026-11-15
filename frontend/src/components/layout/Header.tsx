import { Link } from 'react-router'
import { CarFront, Compass, History, Leaf, type LucideIcon } from 'lucide-react'
import PillToggle from '../ui/PillToggle'
import { CURRENCIES, useCurrency } from '../../utils/currency'
import { LANGUAGES, useI18n } from '../../i18n/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'
import { cx } from '../../utils/cx'
import type { Currency, Language } from '../../types'

const NAV_TABS: { to: string; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { to: '/', labelKey: 'nav.map', icon: Compass },
  { to: '/history', labelKey: 'nav.history', icon: History },
  { to: '/cars', labelKey: 'nav.cars', icon: CarFront },
]

function Logo() {
  const { t } = useI18n()
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div
        className={cx(
          'p-2.5 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform',
          'bg-linear-to-tr from-emerald-600 via-primary-600 to-indigo-600'
        )}
      >
        <Leaf className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-black text-white tracking-tight">PathWise</h1>
          <span
            className={cx(
              'px-1.5 py-0.5 text-[10px] font-bold rounded-md',
              'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            )}
          >
            2.0
          </span>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block">{t('app.tagline')}</p>
      </div>
    </Link>
  )
}

// Sticky top bar: logo, language and currency switches, page navigation.
// `activeTab` is the nav path to highlight (a result page highlights the tab it was opened from).
export default function Header({ activeTab }: { activeTab: string }) {
  const { currency, setCurrency } = useCurrency()
  const { lang, setLang, t, stableText } = useI18n()
  const otherCurrency = currency === 'EUR' ? 'PLN' : 'EUR'
  const otherLang = lang === 'en' ? 'pl' : 'en'

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <div className="flex items-center gap-3">
            <PillToggle
              options={Object.keys(LANGUAGES) as Language[]}
              value={lang}
              onChange={setLang}
              label={t('toggle.language', { current: lang.toUpperCase(), next: otherLang.toUpperCase() })}
              title={t('toggle.languageTitle', { next: otherLang.toUpperCase() })}
            />
            <PillToggle
              options={Object.keys(CURRENCIES) as Currency[]}
              value={currency}
              onChange={setCurrency}
              label={t('toggle.currency', { current: currency, next: otherCurrency })}
              title={t('toggle.currencyTitle', { next: otherCurrency })}
            />

            <nav className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
              {NAV_TABS.map(({ to, labelKey, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  aria-current={activeTab === to ? 'page' : undefined}
                  className={cx(
                    'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                    activeTab === to
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {stableText(labelKey)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
