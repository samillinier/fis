'use client'

import { useContext } from 'react'
import { PaymentContext, type PaymentData } from '@/context/PaymentContext'
import { YearlyPaymentContext } from '@/context/YearlyPaymentContext'
import { usePaymentShell } from '@/context/PaymentShellContext'

interface ActivePaymentData {
  data: PaymentData
  setData: (data: PaymentData) => Promise<void>
  isLoading: boolean
}

export function useActivePaymentData(): ActivePaymentData {
  const { mode } = usePaymentShell()
  const monthly = useContext(PaymentContext)
  const yearly = useContext(YearlyPaymentContext)

  if (mode === 'yearly') {
    if (!yearly) {
      throw new Error('YearlyPaymentProvider required for yearly payment mode')
    }
    return {
      data: yearly.data,
      setData: yearly.setData,
      isLoading: yearly.isLoading,
    }
  }

  if (!monthly) {
    throw new Error('PaymentProvider required for monthly payment mode')
  }

  return {
    data: monthly.data,
    setData: monthly.setData,
    isLoading: monthly.isLoading,
  }
}
