'use client'

import { createContext, useContext } from 'react'

export interface WorkroomData {
  id: string
  name: string
  store: string | number
  sales?: number
  laborPO?: number
  vendorDebit?: number
  cycleTime?: number
  performanceIndex?: number
}

export interface DashboardData {
  workrooms: WorkroomData[]
}

interface DataContextType {
  data: DashboardData
  setData: (data: DashboardData) => void
}

export const DataContext = createContext<DataContextType | undefined>(undefined)

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataContext')
  }
  return context
}


