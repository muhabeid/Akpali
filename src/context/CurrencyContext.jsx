import React, { createContext, useContext, useState, useEffect } from 'react'

export const CurrencyContext = createContext()

// Fallback rates if offline or API delay
const DEFAULT_RATES = {
  USD: 1,
  KES: 129.50,
  TZS: 2680.00
}

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('KES')
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString())

  // Fetch real-time live exchange rates on mount
  useEffect(() => {
    const fetchLiveRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const data = await res.json()
        if (data && data.rates && data.rates.KES && data.rates.TZS) {
          setRates({
            USD: 1,
            KES: Number(data.rates.KES) || 129.50,
            TZS: Number(data.rates.TZS) || 2680.00
          })
          setIsLive(true)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (err) {
        console.warn('Using default exchange rates due to network fetch notice:', err)
      }
    }

    fetchLiveRates()
    const interval = setInterval(fetchLiveRates, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  // Convert USD base amount to selected currency
  const convertAmount = (amountInUSD) => {
    const numeric = Number(amountInUSD) || 0
    const rate = rates[currency] || 1
    return Math.round(numeric * rate)
  }

  // Format currency with symbol & locale formatting
  const formatAmount = (amountInUSD, customDecimals = 0) => {
    const converted = convertAmount(amountInUSD)
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: customDecimals,
      maximumFractionDigits: customDecimals
    })

    if (currency === 'KES') return `KSh ${formatted}`
    if (currency === 'TZS') return `TSh ${formatted}`
    return `$${formatted}`
  }

  const getSymbol = () => {
    if (currency === 'KES') return 'KSh'
    if (currency === 'TZS') return 'TSh'
    return '$'
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      isLive,
      lastUpdated,
      convertAmount,
      formatAmount,
      getSymbol
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
