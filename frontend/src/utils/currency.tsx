import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Currency, Language } from '@/types'
import { useI18n } from '@/i18n/LanguageContext'

// All prices are calculated and stored in EUR; this only changes how they're shown and entered.
// Fixed rate for the MVP; keep in sync with EUR_TO_PLN_RATE in backend/app/core/config.py.
const EUR_TO_PLN = 4.25

interface CurrencyInfo {
  rate: number
  symbol: string
  // `amount` is already formatted for the language (72.07 / 72,07)
  place: (amount: string, lang: Language) => string
}

// Polish puts € after the amount
export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  EUR: { rate: 1, symbol: '€', place: (amount, lang) => (lang === 'pl' ? `${amount} €` : `€${amount}`) },
  PLN: { rate: EUR_TO_PLN, symbol: 'zł', place: (amount) => `${amount} zł` },
}

const STORAGE_KEY = 'pathwise.currency'

const isCurrency = (value: unknown): value is Currency => typeof value === 'string' && value in CURRENCIES

function readStoredCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isCurrency(stored) ? stored : 'EUR'
  } catch {
    return 'EUR'
  }
}

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (currency: Currency) => void
  symbol: string
  // EUR amount -> formatted string in the chosen currency
  formatMoney: (eur: number) => string
  // Amount typed in the chosen currency -> EUR, and back (for prefilling inputs)
  toEur: (amount: number) => number
  fromEur: (eur: number) => number
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(readStoredCurrency)
  const { lang, formatNumber } = useI18n()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency)
    } catch {
      // Storage unavailable (private mode etc.): the choice just won't persist
    }
  }, [currency])

  const { rate, symbol, place } = CURRENCIES[currency]
  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    symbol,
    formatMoney: (eur) => place(formatNumber(eur * rate, 2), lang),
    toEur: (amount) => amount / rate,
    fromEur: (eur) => eur * rate,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>')
  return ctx
}
