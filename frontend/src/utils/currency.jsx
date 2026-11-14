import { createContext, useContext, useEffect, useState } from 'react'

// All prices are calculated and stored in EUR; this only changes how they're shown and entered.
// Fixed rate for the MVP; keep in sync with EUR_TO_PLN_RATE in backend/app/core/config.py.
export const EUR_TO_PLN = 4.25

export const CURRENCIES = {
  EUR: { rate: 1, symbol: '€', format: (v) => `€${v.toFixed(2)}` },
  PLN: { rate: EUR_TO_PLN, symbol: 'zł', format: (v) => `${v.toFixed(2)} zł` },
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency)
    } catch {
      // Storage unavailable (private mode etc.): the choice just won't persist
    }
  }, [currency])

  const { rate, symbol, format } = CURRENCIES[currency]
  const value = {
    currency,
    setCurrency,
    symbol,
    // EUR amount -> formatted string in the chosen currency
    formatMoney: (eur) => format(eur * rate),
    // Amount typed in the chosen currency -> EUR
    toEur: (amount) => amount / rate,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>')
  return ctx
}
