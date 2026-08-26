'use client'

import { useState, useEffect, useCallback } from 'react'
import { PaymentContext } from '@/context/PaymentContext'
import type { PaymentData } from '@/context/PaymentContext'
import { fetchPaymentData, savePaymentData, clearPaymentData } from '@/lib/database'
import { PAYMENT_DATA_UPDATED_EVENT } from '@/lib/dashboardEvents'

const emptyPaymentData = (): PaymentData => ({ payments: [] })

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<PaymentData>(emptyPaymentData())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const fromDb = await fetchPaymentData()
        setDataState(fromDb)
      } catch (error) {
        console.error('Error loading payment data:', error)
        setDataState(emptyPaymentData())
      } finally {
        setIsLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      loadData()
    }
  }, [])

  useEffect(() => {
    const handleUpdated = async () => {
      const fromDb = await fetchPaymentData()
      setDataState(fromDb)
    }
    window.addEventListener(PAYMENT_DATA_UPDATED_EVENT, handleUpdated)
    return () => window.removeEventListener(PAYMENT_DATA_UPDATED_EVENT, handleUpdated)
  }, [])

  const setData = useCallback(async (newData: PaymentData) => {
    let previousData = emptyPaymentData()
    setDataState(prev => {
      previousData = prev
      return newData
    })

    const saved = await savePaymentData(newData)
    if (!saved) {
      setDataState(previousData)
    }
  }, [])

  const resetData = useCallback(async () => {
    setDataState(emptyPaymentData())
    await clearPaymentData()
  }, [])

  return (
    <PaymentContext.Provider value={{ data, setData, resetData, isLoading }}>
      {children}
    </PaymentContext.Provider>
  )
}
