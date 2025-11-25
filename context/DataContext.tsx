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
  surveyDate?: string | number | Date
  surveyComment?: string
  laborCategory?: string
  category?: string
  reliableHomeImprovementScore?: number
  reliableHomeImprovement?: number
  timeTakenToComplete?: number
  timeToComplete?: number
  projectValueScore?: number
  projectValue?: number
  installerKnowledgeScore?: number
  installerKnowledge?: number
  ltrScore?: number
  craftScore?: number
  profScore?: number
  professionalScore?: number
  [key: string]: any
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


