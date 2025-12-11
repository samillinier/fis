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
  completed?: number
  // Job cycle time breakdown (Excel columns U–Y)
  rtsSchedDetails?: number
  schedStartDetails?: number
  startDocsSubDetails?: number
  detailsCycleTime?: number // Column S (index 18) - Details Cycle Time
  totalDetailCycleTime?: number // Column X (index 23) - Total Detail Cycle
  rtsSchedJobs?: number
  schedStartJobs?: number
  startCompleteJobs?: number
  jobsWorkCycleTime?: number
  rescheduleRate?: number
  getItRight?: number
  company?: string
  installerName?: string
  [key: string]: any
}

export interface DashboardData {
  workrooms: WorkroomData[]
  rawColumnLValues?: number[] // Store raw column L values directly from Excel file
  rawCraftValues?: number[] // Store raw Craft scores directly from Excel file
  rawProfValues?: number[] // Store raw Prof scores directly from Excel file
  rawLaborCategories?: string[] // Store raw Labor Category values directly from Excel file
  rawCompanyValues?: string[] // Store raw Company values from column T directly from Excel file
  rawInstallerNames?: string[] // Store raw Installer Name values from column U directly from Excel file
  excelFileTotalRows?: number // Store total rows from Excel file
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


