import { createContext, useContext, useEffect, useState } from 'react'
import { TRANSLATIONS } from './translations'

export const LANGUAGES = {
  en: { label: 'EN', locale: 'en-GB' },
  pl: { label: 'PL', locale: 'pl-PL' },
}

const STORAGE_KEY = 'pathwise.language'

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES[stored] ? stored : 'en'
  } catch {
    return 'en'
  }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Storage unavailable (private mode etc.): the choice just won't persist
    }
  }, [lang])

  const { locale } = LANGUAGES[lang]

  // Look up a key in the current language (falling back to English) and fill in {placeholders}
  const t = (key, vars = {}) => {
    const entry = TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key
    if (typeof entry === 'function') return entry(vars)
    return entry.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match))
  }

  // Text that keeps the same width in every language: all translations share one grid cell and only
  // the current one is visible, so the element is always as wide as the longest. Use it where a
  // language switch would otherwise shift the layout (e.g. header navigation).
  const stableText = (key) => (
    <span className="inline-grid">
      {Object.keys(LANGUAGES).map((code) => (
        <span
          key={code}
          className={`[grid-area:1/1] text-center ${code === lang ? '' : 'invisible'}`}
          aria-hidden={code === lang ? undefined : true}
        >
          {TRANSLATIONS[code][key] ?? TRANSLATIONS.en[key] ?? key}
        </span>
      ))}
    </span>
  )

  // Decimal separator follows the language: 95.1 / 95,1
  const formatNumber = (value, digits = 1) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)

  // Minutes -> "7h 9m" / "7 h 9 min"
  const formatDuration = (minutes) => {
    const total = Math.round(minutes)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (lang === 'pl') return h > 0 ? `${h} h ${m} min` : `${m} min`
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const sec = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (sec < 60) return t('time.justNow')
    const min = Math.floor(sec / 60)
    if (min < 60) return t('time.minutesAgo', { n: min })
    const hr = Math.floor(min / 60)
    if (hr < 24) return t('time.hoursAgo', { n: hr })
    return t('time.daysAgo', { n: Math.floor(hr / 24) })
  }

  const value = { lang, setLang, locale, t, stableText, formatNumber, formatDuration, timeAgo }
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>')
  return ctx
}
