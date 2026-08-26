'use client'

import { createContext, useContext } from 'react'

export type PaymentViewMode = 'monthly' | 'yearly'

export type PaymentPageTab =
  | 'overview'
  | 'executive'
  | 'category'
  | 'workroomCategory'
  | 'scheduled'
  | 'nextWeek'

interface PaymentShellContextType {
  mode: PaymentViewMode
  year: number
  activeTab: PaymentPageTab
  setActiveTab: (tab: PaymentPageTab) => void
}

export const PaymentShellContext = createContext<PaymentShellContextType>({
  mode: 'monthly',
  year: new Date().getFullYear(),
  activeTab: 'overview',
  setActiveTab: () => {},
})

export function usePaymentShell() {
  return useContext(PaymentShellContext)
}
