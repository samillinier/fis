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
  columnM?: number // Column M (index 12) - 20% weight
  columnN?: number // Column N (index 13) - 10% weight
  columnP?: number // Column P (index 15) - 2% weight
  columnQ?: number // Column Q (index 16) - 3% weight
  completed?: number
  // Details Cycle Time breakdown (Excel columns P–T)
  detailsRtsSched?: number // Column P (index 15) - RTS - Sch (Details)
  detailsSchedStart?: number // Column Q (index 16) - Sch - Start (Details)
  detailsStartDocsSub?: number // Column R (index 17) - Start - Docs Sub (Details)
  detailsCycleTime?: number // Column S (index 18) - Details Cycle Time (Total Provider Cycle Time)
  // completed is Column T (index 19) - Completed
  // Job cycle time breakdown (Excel columns U–Y)
  rtsSchedDetails?: number
  schedStartDetails?: number
  startDocsSubDetails?: number
  totalDetailCycleTime?: number // Column X (index 23) - Total Detail Cycle
  rtsSchedJobs?: number
  schedStartJobs?: number
  startCompleteJobs?: number
  jobsWorkCycleTime?: number
  // Work Order Cycle Time breakdown (Excel columns Z–AC)
  workOrderStage1?: number // Column Z (index 25)
  workOrderStage2?: number // Column AA (index 26)
  workOrderStage3?: number // Column AB (index 27)
  totalWorkOrderCycleTime?: number // Column AC (index 28) - Total Work Order Cycle Time
  rescheduleRate?: number // Column AD (index 29) - Reschedule Rate
  // Reschedule Rate breakdown (Excel columns AD–AH)
  rescheduleRateLY?: number // Column AE (index 30) - Reschedule Rate Last Year
  detailRate?: number // Column AF (index 31) - Detail Reschedule Rate
  jobRate?: number // Column AG (index 32) - Job Reschedule Rate
  workOrderRate?: number // Column AH (index 33) - Work Order Reschedule Rate
  getItRight?: number // Column AQ (index 42) - Get it Right
  getItRightLY?: number // Column AR (index 43) - Get it Right Last Year
  poNumber?: string | number // Column J (index 9) - PO Number
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
  setData: (data: DashboardData) => Promise<void>
}

export const DataContext = createContext<DataContextType | undefined>(undefined)

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataContext')
  }
  return context
}


