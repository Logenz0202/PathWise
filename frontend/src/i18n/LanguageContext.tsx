import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Language } from '@/types'
import { TRANSLATIONS, type TranslationKey, type Vars } from './translations'

export const LANGUAGES: Record<Language, { label: string; locale: string }> = {
  en: { label: 'EN', locale: 'en-GB' },
  pl: { label: 'PL', locale: 'pl-PL' },
}

const STORAGE_KEY = 'pathwise.language'

const isLanguage = (value: unknown): value is Language => typeof value === 'string' && value in LANGUAGES

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLanguage(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

export interface I18n {
  lang: Language
  setLang: (lang: Language) => void
  locale: string
  t: (key: TranslationKey, vars?: Vars) => string
  stableText: (key: TranslationKey) => ReactNode
  formatNumber: (value: number, digits?: number) => string
  formatDuration: (minutes: number) => string
  timeAgo: (date: string | null | undefined) => string
}

const LanguageContext = createContext<I18n | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Storage unavailable (private mode etc.): the choice just won't persist
    }
  }, [lang])

  const { locale } = LANGUAGES[lang]

  // Look up a key in the current language and fill in {placeholders}
  const t = (key: TranslationKey, vars: Vars = {}) => {
    const entry = TRANSLATIONS[lang][key]
    if (typeof entry === 'function') return entry(vars)
    return entry.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
  }

  // Text that keeps the same width in every language: all translations share one grid cell and only
  // the current one is visible, so the element is always as wide as the longest. Use it where a
  // language switch would otherwise shift the layout (e.g. header navigation).
  const stableText = (key: TranslationKey) => (
    <span className="inline-grid">
      {(Object.keys(LANGUAGES) as Language[]).map((code) => (
        <span
          key={code}
          className={`[grid-area:1/1] text-center ${code === lang ? '' : 'invisible'}`}
          aria-hidden={code === lang ? undefined : true}
        >
          {String(TRANSLATIONS[code][key])}
        </span>
      ))}
    </span>
  )

  // Decimal separator follows the language: 95.1 / 95,1
  const formatNumber = (value: number, digits = 1) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)

  // Minutes -> "7h 9m" / "7 h 9 min"
  const formatDuration = (minutes: number) => {
    const total = Math.round(minutes)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (lang === 'pl') return h > 0 ? `${h} h ${m} min` : `${m} min`
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const timeAgo = (date: string | null | undefined) => {
    if (!date) return ''
    const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (sec < 60) return t('time.justNow')
    const min = Math.floor(sec / 60)
    if (min < 60) return t('time.minutesAgo', { n: min })
    const hr = Math.floor(min / 60)
    if (hr < 24) return t('time.hoursAgo', { n: hr })
    return t('time.daysAgo', { n: Math.floor(hr / 24) })
  }

  const value: I18n = { lang, setLang, locale, t, stableText, formatNumber, formatDuration, timeAgo }
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>')
  return ctx
}
