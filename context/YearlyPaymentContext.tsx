'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PaymentData } from '@/context/PaymentContext'
import {
  fetchYearlyPaymentData,
  saveYearlyPaymentData,
  clearYearlyPaymentData,
} from '@/lib/database'
import { PAYMENT_DATA_UPDATED_EVENT } from '@/lib/dashboardEvents'

const emptyPaymentData = (): PaymentData => ({ payments: [] })

interface YearlyPaymentContextType {
  year: number
  data: PaymentData
  setData: (data: PaymentData) => Promise<void>
  resetData: () => Promise<void>
  isHydrated: boolean
  isLoading: boolean
}

export const YearlyPaymentContext = createContext<YearlyPaymentContextType | undefined>(undefined)

export function useYearlyPaymentData() {
  const context = useContext(YearlyPaymentContext)
  if (!context) {
    throw new Error('useYearlyPaymentData must be used within YearlyPaymentProvider')
  }
  return context
}

export function YearlyPaymentProvider({ year, children }: { year: number; children: React.ReactNode }) {
  const [data, setDataState] = useState<PaymentData>(emptyPaymentData())
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const fromDb = await fetchYearlyPaymentData(year)
        setDataState(fromDb)
      } catch {
        setDataState(emptyPaymentData())
      } finally {
        setIsHydrated(true)
        setIsLoading(false)
      }
    }
    load()
  }, [year])

  useEffect(() => {
    const handleUpdated = async () => {
      const fromDb = await fetchYearlyPaymentData(year)
      setDataState(fromDb)
    }
    window.addEventListener(PAYMENT_DATA_UPDATED_EVENT, handleUpdated)
    return () => window.removeEventListener(PAYMENT_DATA_UPDATED_EVENT, handleUpdated)
  }, [year])

  const setData = useCallback(async (next: PaymentData) => {
    let previous = emptyPaymentData()
    setDataState(prev => {
      previous = prev
      return next
    })

    const saved = await saveYearlyPaymentData(year, next)
    if (!saved) {
      setDataState(previous)
    }
  }, [year])

  const resetData = useCallback(async () => {
    setDataState(emptyPaymentData())
    await clearYearlyPaymentData(year)
  }, [year])

  const value = useMemo(
    () => ({ year, data, setData, resetData, isHydrated, isLoading }),
    [year, data, setData, resetData, isHydrated, isLoading]
  )

  return (
    <YearlyPaymentContext.Provider value={value}>
      {children}
    </YearlyPaymentContext.Provider>
  )
}
