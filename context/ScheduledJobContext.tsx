'use client'

import { createContext, useContext } from 'react'

export type ScheduledJobSourceType = 'install' | 'measure' | 'workorder'

export interface ScheduledJobSourceSnapshot {
  source: ScheduledJobSourceType
  id: string
  jobType?: string
  jobStatus?: string
  dueDate?: string
  createdOn?: string
  crewLead?: string
  laborAmount?: number
}

/** Jobs export (measure / install / work order) */
export interface ScheduledJobRecord {
  id: string
  linkKey?: string
  measureId?: string
  installId?: string
  workorderId?: string
  jobType?: string
  firstName?: string
  lastName?: string
  laborCategory?: string
  jobStatus?: string
  customerPhone?: string
  customerAddress?: string
  store?: string | number
  district?: string | number
  createdOn?: string
  dueDate?: string
  customerEmail?: string
  crewLead?: string
  storeLocation?: string
  laborAmount?: number
  leadSafePractices?: string
  /** Which export file(s) contributed to this row after merge */
  exportSources?: ScheduledJobSourceType[]
  /** Per-file details preserved for filtering and display */
  sourceSnapshots?: ScheduledJobSourceSnapshot[]
}

export interface ScheduledJobSourceBundle {
  jobs: ScheduledJobRecord[]
  fileName?: string
  uploadDate?: string
}

export interface ScheduledJobData {
  install: ScheduledJobSourceBundle
  measure: ScheduledJobSourceBundle
  workorder: ScheduledJobSourceBundle
}

export const SCHEDULED_JOB_SOURCE_LABELS: Record<ScheduledJobSourceType, string> = {
  install: 'Install',
  measure: 'Measure',
  workorder: 'Work Order',
}

export function emptyScheduledJobSourceBundle(): ScheduledJobSourceBundle {
  return { jobs: [] }
}

export function emptyScheduledJobData(): ScheduledJobData {
  return {
    install: emptyScheduledJobSourceBundle(),
    measure: emptyScheduledJobSourceBundle(),
    workorder: emptyScheduledJobSourceBundle(),
  }
}

interface ScheduledJobContextType {
  data: ScheduledJobData
  setData: (data: ScheduledJobData) => Promise<void>
  updateSource: (source: ScheduledJobSourceType, bundle: ScheduledJobSourceBundle) => Promise<boolean>
  mergedJobs: ScheduledJobRecord[]
  isLoading: boolean
}

export const ScheduledJobContext = createContext<ScheduledJobContextType | undefined>(undefined)

export function useScheduledJobData() {
  const context = useContext(ScheduledJobContext)
  if (!context) {
    throw new Error('useScheduledJobData must be used within ScheduledJobProvider')
  }
  return context
}
