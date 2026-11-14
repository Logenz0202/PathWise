import { createContext, useContext, useEffect, useState } from 'react'
import { useI18n } from '../i18n/LanguageContext'

// All prices are calculated and stored in EUR; this only changes how they're shown and entered.
// Fixed rate for the MVP; keep in sync with EUR_TO_PLN_RATE in backend/app/core/config.py.
const EUR_TO_PLN = 4.25

// `amount` is already formatted for the language (72.07 / 72,07); Polish puts € after the amount
export const CURRENCIES = {
  EUR: { rate: 1, symbol: '€', place: (amount, lang) => (lang === 'pl' ? `${amount} €` : `€${amount}`) },
  PLN: { rate: EUR_TO_PLN, symbol: 'zł', place: (amount) => `${amount} zł` },
}

const STORAGE_KEY = 'pathwise.currency'

function readStoredCurrency() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return CURRENCIES[stored] ? stored : 'EUR'
  } catch {
    return 'EUR'
  }
}

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(readStoredCurrency)
  const { lang, formatNumber } = useI18n()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency)
    } catch {
      // Storage unavailable (private mode etc.): the choice just won't persist
    }
  }, [currency])

  const { rate, symbol, place } = CURRENCIES[currency]
  const value = {
    currency,
    setCurrency,
    symbol,
    // EUR amount -> formatted string in the chosen currency
    formatMoney: (eur) => place(formatNumber(eur * rate, 2), lang),
    // Amount typed in the chosen currency -> EUR, and back (for prefilling inputs)
    toEur: (amount) => amount / rate,
    fromEur: (eur) => eur * rate,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>')
  return ctx
}
