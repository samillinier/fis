import type {
  ScheduledJobData,
  ScheduledJobRecord,
  ScheduledJobSourceSnapshot,
  ScheduledJobSourceType,
} from '@/context/ScheduledJobContext'
import { mergeScheduledJobSources, countJobsLinkedAcrossSources } from '@/lib/scheduledJobMerge'
import type {
  CategoryExecutiveRow,
  ExecutiveSummaryMetrics,
  JobStatusBucket,
  StatusExecutiveRow,
  WorkroomExecutiveRow,
} from '@/lib/paymentExecutiveSummary'
import { getWorkroomForStore, STATUS_SUMMARY_LABELS, STATUS_SUMMARY_ORDER } from '@/lib/paymentExecutiveSummary'
import { getMergedLaborAmount } from '@/lib/scheduledJobLink'

function normalizeCategory(value: string | undefined): string {
  const trimmed = String(value ?? '').trim()
  return trimmed || 'Unknown'
}

/** Map Job Status column from jobs export to dashboard status bucket */
export function mapExportJobStatusToBucket(status: string | undefined): JobStatusBucket {
  const s = String(status ?? '').trim().toLowerCase()
  if (!s) return 'open'
  if (s.includes('refund')) return 'refunded'
  if (s.includes('waiting for product') || s.includes('waiting on product') || s === 'wfp') {
    return 'waitingForProduct'
  }
  if (s.includes('ready to schedule') || s === 'rts') return 'readyToSchedule'
  if (s.includes('scheduled')) return 'scheduled'
  if (s.includes('work complete') || s === 'completed') return 'workComplete'
  if (s.includes('closed') || s.includes('cancelled') || s.includes('invoice_paid') || s === 'paid') {
    return 'closed'
  }
  return 'open'
}

function snapshotsForJob(job: ScheduledJobRecord): ScheduledJobSourceSnapshot[] {
  if (job.sourceSnapshots?.length) return job.sourceSnapshots
  return [
    {
      source: 'install',
      id: job.id,
      jobType: job.jobType,
      jobStatus: job.jobStatus,
      dueDate: job.dueDate,
      createdOn: job.createdOn,
      crewLead: job.crewLead,
      laborAmount: job.laborAmount,
    },
  ]
}

function emptyCategoryRow(): {
  jobs: Set<string>
  labourValue: number
  closed: number
  scheduled: number
  waitingForProduct: number
  readyToSchedule: number
  workComplete: number
  openJobs: number
  openLabor: number
} {
  return {
    jobs: new Set(),
    labourValue: 0,
    closed: 0,
    scheduled: 0,
    waitingForProduct: 0,
    readyToSchedule: 0,
    workComplete: 0,
    openJobs: 0,
    openLabor: 0,
  }
}

function incrementStatusCount(
  row: ReturnType<typeof emptyCategoryRow>,
  bucket: JobStatusBucket,
  labour: number
) {
  switch (bucket) {
    case 'closed':
      row.closed += 1
      break
    case 'scheduled':
      row.scheduled += 1
      break
    case 'waitingForProduct':
      row.waitingForProduct += 1
      break
    case 'readyToSchedule':
      row.readyToSchedule += 1
      break
    case 'workComplete':
      row.workComplete += 1
      break
    case 'open':
    case 'refunded':
      row.openJobs += 1
      row.openLabor += labour
      break
  }
}

/** Category + status breakdown from merged jobs exports */
export function computeCategoryExecutiveSummaryFromScheduledJobs(
  jobs: ScheduledJobRecord[]
): CategoryExecutiveRow[] {
  const byCategory = new Map<string, ReturnType<typeof emptyCategoryRow>>()

  jobs.forEach(job => {
    const category = normalizeCategory(job.laborCategory)
    const row = byCategory.get(category) || emptyCategoryRow()
    const jobId = job.linkKey || job.id

    row.jobs.add(jobId)
    row.labourValue += getMergedLaborAmount(job)

    snapshotsForJob(job).forEach(snap => {
      const bucket = mapExportJobStatusToBucket(snap.jobStatus)
      incrementStatusCount(row, bucket, snap.laborAmount ?? 0)
    })

    byCategory.set(category, row)
  })

  const grandTotalLabour = Array.from(byCategory.values()).reduce((sum, row) => sum + row.labourValue, 0)

  return Array.from(byCategory.entries())
    .map(([category, row]) => {
      const jobCount = row.jobs.size
      return {
        category,
        jobs: jobCount,
        labourValue: row.labourValue,
        avgJobValue: jobCount > 0 ? row.labourValue / jobCount : 0,
        closed: row.closed,
        scheduled: row.scheduled,
        waitingForProduct: row.waitingForProduct,
        readyToSchedule: row.readyToSchedule,
        workComplete: row.workComplete,
        openJobs: row.openJobs,
        openLabor: row.openLabor,
        shareOfTotal: grandTotalLabour > 0 ? (row.labourValue / grandTotalLabour) * 100 : 0,
      }
    })
    .sort((a, b) => b.labourValue - a.labourValue)
}

/** Status summary from jobs export Job Status column (each measure/install/work order row counted) */
export function computeStatusExecutiveSummaryFromScheduledJobs(
  jobs: ScheduledJobRecord[]
): StatusExecutiveRow[] {
  const byStatus = new Map<JobStatusBucket, { jobs: number; labourValue: number }>()
  STATUS_SUMMARY_ORDER.forEach(status => {
    byStatus.set(status, { jobs: 0, labourValue: 0 })
  })

  jobs.forEach(job => {
    snapshotsForJob(job).forEach(snap => {
      const bucket = mapExportJobStatusToBucket(snap.jobStatus)
      const row = byStatus.get(bucket)!
      row.jobs += 1
      row.labourValue += snap.laborAmount ?? 0
    })
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

export function hasScheduledJobExportData(jobs: ScheduledJobRecord[]): boolean {
  return jobs.length > 0
}

export function hasScheduledJobExportDataFromBundles(data: ScheduledJobData): boolean {
  return (
    data.install.jobs.length > 0 ||
    data.measure.jobs.length > 0 ||
    data.workorder.jobs.length > 0
  )
}

const BUNDLE_SOURCES: ScheduledJobSourceType[] = ['measure', 'install', 'workorder']

/** Every row from all three export files (measure + install + work order) */
export function getAllScheduledJobExportRows(data: ScheduledJobData): ScheduledJobRecord[] {
  const rows: ScheduledJobRecord[] = []
  BUNDLE_SOURCES.forEach(source => {
    data[source].jobs.forEach(job => rows.push(job))
  })
  return rows
}

/** Category table: unique linked jobs with per-file status snapshots */
export function computeCategoryExecutiveSummaryFromScheduledJobBundles(
  data: ScheduledJobData
): CategoryExecutiveRow[] {
  return computeCategoryExecutiveSummaryFromScheduledJobs(mergeScheduledJobSources(data))
}

/** Status table: count each export row by its Job Status column */
export function computeStatusExecutiveSummaryFromScheduledJobBundles(
  data: ScheduledJobData
): StatusExecutiveRow[] {
  const byStatus = new Map<JobStatusBucket, { jobs: number; labourValue: number }>()
  STATUS_SUMMARY_ORDER.forEach(status => {
    byStatus.set(status, { jobs: 0, labourValue: 0 })
  })

  getAllScheduledJobExportRows(data).forEach(job => {
    const bucket = mapExportJobStatusToBucket(job.jobStatus)
    const row = byStatus.get(bucket)!
    row.jobs += 1
    row.labourValue += job.laborAmount ?? 0
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

function isOpenExportStatus(status: string | undefined): boolean {
  const bucket = mapExportJobStatusToBucket(status)
  return bucket !== 'closed' && bucket !== 'refunded'
}

/** Status metric cards from all export rows */
export function computeExecutiveSummaryFromScheduledJobBundles(
  data: ScheduledJobData
): ExecutiveSummaryMetrics {
  const rows = getAllScheduledJobExportRows(data)
  const metrics: ExecutiveSummaryMetrics = {
    totalJobs: rows.length,
    closed: 0,
    scheduled: 0,
    waitingForProduct: 0,
    readyToSchedule: 0,
    workComplete: 0,
    refunded: 0,
    totalInvoices: rows.length,
  }

  rows.forEach(job => {
    const bucket = mapExportJobStatusToBucket(job.jobStatus)
    switch (bucket) {
      case 'closed':
        metrics.closed += 1
        break
      case 'scheduled':
        metrics.scheduled += 1
        break
      case 'waitingForProduct':
        metrics.waitingForProduct += 1
        break
      case 'readyToSchedule':
        metrics.readyToSchedule += 1
        break
      case 'workComplete':
        metrics.workComplete += 1
        break
      case 'refunded':
        metrics.refunded += 1
        break
      default:
        break
    }
  })

  return metrics
}

export interface JobExportVolumeSummary {
  measureRows: number
  installRows: number
  workorderRows: number
  totalExportRows: number
  uniqueLinkedJobs: number
  linkedAcrossFiles: number
}

/** Row counts per export file + unique jobs after linking */
export function computeJobExportVolumeSummary(data: ScheduledJobData): JobExportVolumeSummary {
  const merged = mergeScheduledJobSources(data)
  return {
    measureRows: data.measure.jobs.length,
    installRows: data.install.jobs.length,
    workorderRows: data.workorder.jobs.length,
    totalExportRows:
      data.measure.jobs.length + data.install.jobs.length + data.workorder.jobs.length,
    uniqueLinkedJobs: merged.length,
    linkedAcrossFiles: countJobsLinkedAcrossSources(merged),
  }
}
export function computeWorkroomExecutiveSummaryFromScheduledJobBundles(
  data: ScheduledJobData
): WorkroomExecutiveRow[] {
  const merged = mergeScheduledJobSources(data)
  const byWorkroom = new Map<string, {
    jobs: number
    labourValue: number
    openJobs: number
    openLabor: number
  }>()

  merged.forEach(job => {
    const workroom = getWorkroomForStore(job.store)
    const labour = getMergedLaborAmount(job)
    const row = byWorkroom.get(workroom) || {
      jobs: 0,
      labourValue: 0,
      openJobs: 0,
      openLabor: 0,
    }

    row.jobs += 1
    row.labourValue += labour

    const snapshots = snapshotsForJob(job)
    const isOpen = snapshots.some(s => isOpenExportStatus(s.jobStatus))
    if (isOpen) {
      row.openJobs += 1
      row.openLabor += labour
    }

    byWorkroom.set(workroom, row)
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
