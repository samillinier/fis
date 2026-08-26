'use client'

import { createContext, useContext } from 'react'

/** Payment debit details export — columns A through T */
export interface PaymentRecord {
  id: string
  checkNumber?: string           // A
  paymentNumber?: string           // B
  checkAmount?: number             // C
  invoiceNumber?: string           // D
  associatedJobId?: string         // E
  customerName?: string            // F
  status?: string                  // G
  type?: string                    // H
  store?: string | number          // I
  jobType?: string                 // J
  labourCategory?: string          // K
  installerName?: string           // L
  amount?: number                  // M
  checkDate?: string               // N
  createdOn?: string               // O
  description?: string              // P
  initiator?: string               // Q
  rejectionReason?: string         // R
  installerInvoiceNumber?: string  // S
  purchaseOrder?: string           // T
  [key: string]: string | number | undefined
}

export interface PaymentData {
  payments: PaymentRecord[]
  fileName?: string
  uploadDate?: string
}

interface PaymentContextType {
  data: PaymentData
  setData: (data: PaymentData) => Promise<void>
  resetData: () => Promise<void>
  isLoading: boolean
}

export const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

export function usePaymentData() {
  const context = useContext(PaymentContext)
  if (!context) {
    throw new Error('usePaymentData must be used within PaymentProvider')
  }
  return context
}
