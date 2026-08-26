import type { PaymentRecord } from '@/context/PaymentContext'
import { workroomStoreData } from '@/data/workroomStoreData'
import { getPaymentAmount } from '@/lib/paymentParser'

export interface ExecutiveSummaryMetrics {
  totalJobs: number
  closed: number
  scheduled: number
  waitingForProduct: number
  readyToSchedule: number
  workComplete: number
  refunded: number
  totalInvoices: number
}

export interface ExecutiveSummaryMetricConfig {
  key: keyof ExecutiveSummaryMetrics
  label: string
  description: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'amber' | 'teal' | 'rose' | 'slate'
}

export const EXECUTIVE_SUMMARY_METRICS: ExecutiveSummaryMetricConfig[] = [
  {
    key: 'totalJobs',
    label: 'Total Jobs',
    description: 'Unique jobs in the uploaded payment file',
    color: 'blue',
  },
  {
    key: 'closed',
    label: 'Closed',
    description: 'Paid / closed jobs (e.g. INVOICE_PAID, Closed)',
    color: 'slate',
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    description: 'Jobs marked scheduled in status or description',
    color: 'purple',
  },
  {
    key: 'waitingForProduct',
    label: 'Waiting for Product',
    description: 'WFP / waiting for product / materials',
    color: 'amber',
  },
  {
    key: 'readyToSchedule',
    label: 'Ready to Schedule',
    description: 'RTS / ready to schedule',
    color: 'orange',
  },
  {
    key: 'workComplete',
    label: 'Work Complete',
    description: 'Job or detail completed',
    color: 'green',
  },
  {
    key: 'refunded',
    label: 'Refunded',
    description: 'Refunded or reversal entries',
    color: 'rose',
  },
]

function recordText(record: PaymentRecord): string {
  return [
    record.status,
    record.description,
    record.type,
    record.rejectionReason,
    record.jobType,
  ]
    .filter(v => v != null && v !== '')
    .join(' ')
    .toLowerCase()
}

function jobKey(record: PaymentRecord, index: number): string {
  const id = record.associatedJobId
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `row-${index}`
}

function matchesRefunded(text: string): boolean {
  return /\brefund|\breversal|\bchargeback|\bcredit memo\b/.test(text)
}

function matchesWorkComplete(text: string): boolean {
  return (
    /\bwork complete\b/.test(text) ||
    /\bjob completed\b/.test(text) ||
    /\bdetail completed\b/.test(text) ||
    /\binstall(ation)? complete\b/.test(text)
  )
}

function matchesClosed(text: string): boolean {
  return (
    /\binvoice_paid\b/.test(text) ||
    /\bclosed\b/.test(text) ||
    /\bpaid\b/.test(text) ||
    /\bcomplete(d)?\b/.test(text)
  )
}

function matchesScheduled(text: string): boolean {
  return /\bschedul(ed|ing)?\b/.test(text) && !/\bready to schedul/.test(text)
}

function matchesWaitingForProduct(text: string): boolean {
  return (
    /\bwfp\b/.test(text) ||
    /\bwaiting for product\b/.test(text) ||
    /\bwaiting on product\b/.test(text) ||
    /\bmaterial(s)? pending\b/.test(text)
  )
}

function matchesReadyToSchedule(text: string): boolean {
  return (
    /\brts\b/.test(text) ||
    /\bready to schedul(e|ing)?\b/.test(text) ||
    /\bready-to-schedule\b/.test(text)
  )
}

/** Group records by job, merge text for classification */
function groupJobsByKey(payments: PaymentRecord[]): Map<string, string> {
  const map = new Map<string, string>()
  payments.forEach((record, index) => {
    const key = jobKey(record, index)
    const text = recordText(record)
    const existing = map.get(key)
    map.set(key, existing ? `${existing} ${text}` : text)
  })
  return map
}

export function computeExecutiveSummary(payments: PaymentRecord[]): ExecutiveSummaryMetrics {
  const jobs = groupJobsByKey(payments)
  const metrics: ExecutiveSummaryMetrics = {
    totalJobs: jobs.size,
    closed: 0,
    scheduled: 0,
    waitingForProduct: 0,
    readyToSchedule: 0,
    workComplete: 0,
    refunded: 0,
    totalInvoices: payments.length,
  }

  jobs.forEach(text => {
    if (matchesRefunded(text)) metrics.refunded += 1
    if (matchesWorkComplete(text)) metrics.workComplete += 1
    if (matchesClosed(text)) metrics.closed += 1
    if (matchesScheduled(text)) metrics.scheduled += 1
    if (matchesWaitingForProduct(text)) metrics.waitingForProduct += 1
    if (matchesReadyToSchedule(text)) metrics.readyToSchedule += 1
  })

  return metrics
}

export function executiveSummaryPercent(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export interface WorkroomExecutiveRow {
  workroom: string
  jobs: number
  labourValue: number
  avgJobValue: number
  openJobs: number
  openLabor: number
  shareOfTotal: number
}

const storeToWorkroomMap = new Map<number, string>(
  workroomStoreData.map(row => [row.store, row.workroom])
)

export function getWorkroomForStore(store: string | number | null | undefined): string {
  if (store == null || store === '') return 'Unknown'
  const storeNum = typeof store === 'string' ? parseInt(store.replace(/[^\d]/g, ''), 10) : Number(store)
  if (!Number.isFinite(storeNum)) return 'Unknown'
  return storeToWorkroomMap.get(storeNum) || `Unmapped (${storeNum})`
}

function isJobOpen(text: string): boolean {
  if (matchesRefunded(text)) return false
  return !matchesClosed(text)
}

interface JobRollup {
  workroom: string
  labourValue: number
  text: string
}

interface CategoryJobRollup {
  categoryVotes: Map<string, number>
  labourValue: number
  text: string
}

function normalizeCategory(value: string | undefined): string {
  const trimmed = String(value ?? '').trim()
  return trimmed || 'Unknown'
}

function resolvePrimaryCategory(votes: Map<string, number>): string {
  let best = 'Unknown'
  let bestCount = 0
  votes.forEach((count, category) => {
    if (count > bestCount) {
      best = category
      bestCount = count
    }
  })
  return best
}

export interface CategoryExecutiveRow {
  category: string
  jobs: number
  labourValue: number
  avgJobValue: number
  closed: number
  scheduled: number
  waitingForProduct: number
  readyToSchedule: number
  workComplete: number
  openJobs: number
  openLabor: number
  shareOfTotal: number
}

/** Aggregate payment records by labour category (vinyl, carpet, etc.) */
export function computeCategoryExecutiveSummary(payments: PaymentRecord[]): CategoryExecutiveRow[] {
  const jobs = new Map<string, CategoryJobRollup>()

  payments.forEach((record, index) => {
    const key = jobKey(record, index)
    const category = normalizeCategory(record.labourCategory)
    const amount = getPaymentAmount(record)
    const text = recordText(record)

    const existing = jobs.get(key)
    if (existing) {
      existing.labourValue += amount
      existing.text = `${existing.text} ${text}`
      existing.categoryVotes.set(category, (existing.categoryVotes.get(category) || 0) + 1)
    } else {
      jobs.set(key, {
        categoryVotes: new Map([[category, 1]]),
        labourValue: amount,
        text,
      })
    }
  })

  const byCategory = new Map<string, {
    jobs: number
    labourValue: number
    closed: number
    scheduled: number
    waitingForProduct: number
    readyToSchedule: number
    workComplete: number
    openJobs: number
    openLabor: number
  }>()

  jobs.forEach(job => {
    const category = resolvePrimaryCategory(job.categoryVotes)
    const existing = byCategory.get(category) || {
      jobs: 0,
      labourValue: 0,
      closed: 0,
      scheduled: 0,
      waitingForProduct: 0,
      readyToSchedule: 0,
      workComplete: 0,
      openJobs: 0,
      openLabor: 0,
    }

    existing.jobs += 1
    existing.labourValue += job.labourValue
    if (matchesClosed(job.text)) existing.closed += 1
    if (matchesScheduled(job.text)) existing.scheduled += 1
    if (matchesWaitingForProduct(job.text)) existing.waitingForProduct += 1
    if (matchesReadyToSchedule(job.text)) existing.readyToSchedule += 1
    if (matchesWorkComplete(job.text)) existing.workComplete += 1
    if (isJobOpen(job.text)) {
      existing.openJobs += 1
      existing.openLabor += job.labourValue
    }

    byCategory.set(category, existing)
  })

  const grandTotalLabour = Array.from(byCategory.values()).reduce((sum, row) => sum + row.labourValue, 0)

  return Array.from(byCategory.entries())
    .map(([category, row]) => ({
      category,
      jobs: row.jobs,
      labourValue: row.labourValue,
      avgJobValue: row.jobs > 0 ? row.labourValue / row.jobs : 0,
      closed: row.closed,
      scheduled: row.scheduled,
      waitingForProduct: row.waitingForProduct,
      readyToSchedule: row.readyToSchedule,
      workComplete: row.workComplete,
      openJobs: row.openJobs,
      openLabor: row.openLabor,
      shareOfTotal: grandTotalLabour > 0 ? (row.labourValue / grandTotalLabour) * 100 : 0,
    }))
    .sort((a, b) => b.labourValue - a.labourValue)
}

export type JobStatusBucket =
  | 'refunded'
  | 'waitingForProduct'
  | 'readyToSchedule'
  | 'scheduled'
  | 'closed'
  | 'workComplete'
  | 'open'

export const STATUS_SUMMARY_ORDER: JobStatusBucket[] = [
  'waitingForProduct',
  'readyToSchedule',
  'scheduled',
  'workComplete',
  'closed',
  'open',
  'refunded',
]

export const STATUS_SUMMARY_LABELS: Record<JobStatusBucket, string> = {
  waitingForProduct: 'Waiting for Product',
  readyToSchedule: 'Ready to Schedule',
  scheduled: 'Scheduled',
  workComplete: 'Work Complete',
  closed: 'Closed',
  open: 'Open',
  refunded: 'Refunded',
}

/** Assign each job to one primary status (mutually exclusive for share totals). */
export function classifyPrimaryJobStatus(text: string): JobStatusBucket {
  if (matchesRefunded(text)) return 'refunded'
  if (matchesWaitingForProduct(text)) return 'waitingForProduct'
  if (matchesReadyToSchedule(text)) return 'readyToSchedule'
  if (matchesScheduled(text)) return 'scheduled'
  if (matchesClosed(text)) return 'closed'
  if (matchesWorkComplete(text)) return 'workComplete'
  return 'open'
}

export interface StatusExecutiveRow {
  status: JobStatusBucket
  label: string
  jobs: number
  labourValue: number
  avgJobValue: number
  shareOfTotal: number
}

interface StatusJobRollup {
  labourValue: number
  text: string
}

/** Aggregate unique jobs by primary status bucket */
export function computeStatusExecutiveSummary(payments: PaymentRecord[]): StatusExecutiveRow[] {
  const jobs = new Map<string, StatusJobRollup>()

  payments.forEach((record, index) => {
    const key = jobKey(record, index)
    const amount = getPaymentAmount(record)
    const text = recordText(record)

    const existing = jobs.get(key)
    if (existing) {
      existing.labourValue += amount
      existing.text = `${existing.text} ${text}`
    } else {
      jobs.set(key, { labourValue: amount, text })
    }
  })

  const byStatus = new Map<JobStatusBucket, { jobs: number; labourValue: number }>()
  STATUS_SUMMARY_ORDER.forEach(status => {
    byStatus.set(status, { jobs: 0, labourValue: 0 })
  })

  jobs.forEach(job => {
    const status = classifyPrimaryJobStatus(job.text)
    const existing = byStatus.get(status)!
    existing.jobs += 1
    existing.labourValue += job.labourValue
  })

  const grandTotalLabour = Array.from(byStatus.values()).reduce((sum, row) => sum + row.labourValue, 0)

  return STATUS_SUMMARY_ORDER.map(status => {
    const row = byStatus.get(status)!
    return {
      status,
      label: STATUS_SUMMARY_LABELS[status],
      jobs: row.jobs,
      labourValue: row.labourValue,
      avgJobValue: row.jobs > 0 ? row.labourValue / row.jobs : 0,
      shareOfTotal: grandTotalLabour > 0 ? (row.labourValue / grandTotalLabour) * 100 : 0,
    }
  })
}

/** Aggregate payment records by workroom (via store → workroom sync) */
export function computeWorkroomExecutiveSummary(payments: PaymentRecord[]): WorkroomExecutiveRow[] {
  const jobs = new Map<string, JobRollup>()

  payments.forEach((record, index) => {
    const key = jobKey(record, index)
    const workroom = getWorkroomForStore(record.store)
    const amount = getPaymentAmount(record)
    const text = recordText(record)

    const existing = jobs.get(key)
    if (existing) {
      existing.labourValue += amount
      existing.text = `${existing.text} ${text}`
    } else {
      jobs.set(key, {
        workroom,
        labourValue: amount,
        text,
      })
    }
  })

  const byWorkroom = new Map<string, {
    jobs: number
    labourValue: number
    openJobs: number
    openLabor: number
  }>()

  jobs.forEach(job => {
    const existing = byWorkroom.get(job.workroom) || {
      jobs: 0,
      labourValue: 0,
      openJobs: 0,
      openLabor: 0,
    }

    existing.jobs += 1
    existing.labourValue += job.labourValue

    if (isJobOpen(job.text)) {
      existing.openJobs += 1
      existing.openLabor += job.labourValue
    }

    byWorkroom.set(job.workroom, existing)
  })

  const grandTotalLabour = Array.from(byWorkroom.values()).reduce((sum, row) => sum + row.labourValue, 0)

  return Array.from(byWorkroom.entries())
    .map(([workroom, row]) => ({
      workroom,
      jobs: row.jobs,
      labourValue: row.labourValue,
      avgJobValue: row.jobs > 0 ? row.labourValue / row.jobs : 0,
      openJobs: row.openJobs,
      openLabor: row.openLabor,
      shareOfTotal: grandTotalLabour > 0 ? (row.labourValue / grandTotalLabour) * 100 : 0,
    }))
    .sort((a, b) => b.labourValue - a.labourValue)
}
