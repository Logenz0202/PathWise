import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CurrencyProvider } from './utils/currency'
import { LanguageProvider } from './i18n/LanguageContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
