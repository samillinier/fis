import type { ScheduledJobRecord } from '@/context/ScheduledJobContext'
import { getWorkroomForStore } from '@/lib/paymentExecutiveSummary'
import {
  formatMergedJobStatus,
  formatMergedTaskTypes,
  getMergedLaborAmount,
  getScheduledJobRowId,
} from '@/lib/scheduledJobLink'
import { formatJobExportDate, parseJobExportDate } from '@/lib/scheduledJobParser'
import { formatPaymentCurrency } from '@/lib/paymentParser'

export interface ScheduledThisWeekRow {
  id: string
  taskType: string
  dueDate: string
  workroom: string
  store: string
  district: string
  category: string
  laborAmount: number
  laborAmountDisplay: string
  jobStatus: string
  customerName: string
  crewLead: string
  storeLocation: string
}

function getWeekBounds(reference = new Date(), weekOffset = 0): { start: Date; end: Date } {
  const ref = new Date(reference)
  if (weekOffset !== 0) {
    ref.setDate(ref.getDate() + weekOffset * 7)
  }

  const start = new Date(ref)
  start.setHours(0, 0, 0, 0)
  start.setDate(ref.getDate() - ref.getDay())

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function isScheduledStatus(status: string | undefined): boolean {
  return String(status ?? '').trim().toLowerCase() === 'scheduled'
}

function jobScheduleDate(job: ScheduledJobRecord): Date | null {
  return parseJobExportDate(job.dueDate || job.createdOn)
}

function snapshotIsScheduledInWeek(
  snapshot: { jobStatus?: string; dueDate?: string; createdOn?: string },
  weekOffset: number,
  reference: Date
): boolean {
  if (!isScheduledStatus(snapshot.jobStatus)) return false
  const date = parseJobExportDate(snapshot.dueDate || snapshot.createdOn)
  if (!date) return false
  const { start, end } = getWeekBounds(reference, weekOffset)
  return date >= start && date <= end
}

export function isScheduledInWeek(
  job: ScheduledJobRecord,
  reference = new Date(),
  weekOffset = 0
): boolean {
  if (job.sourceSnapshots?.length) {
    return job.sourceSnapshots.some(s => snapshotIsScheduledInWeek(s, weekOffset, reference))
  }
  if (!isScheduledStatus(job.jobStatus)) return false
  const date = jobScheduleDate(job)
  if (!date) return false
  const { start, end } = getWeekBounds(reference, weekOffset)
  return date >= start && date <= end
}

export function isScheduledThisWeek(job: ScheduledJobRecord, reference = new Date()): boolean {
  return isScheduledInWeek(job, reference, 0)
}

export function isScheduledNextWeek(job: ScheduledJobRecord, reference = new Date()): boolean {
  return isScheduledInWeek(job, reference, 1)
}

export function filterScheduledInWeek(
  jobs: ScheduledJobRecord[],
  reference = new Date(),
  weekOffset = 0
): ScheduledJobRecord[] {
  return jobs.filter(job => isScheduledInWeek(job, reference, weekOffset))
}

export function filterScheduledThisWeek(
  jobs: ScheduledJobRecord[],
  reference = new Date()
): ScheduledJobRecord[] {
  return filterScheduledInWeek(jobs, reference, 0)
}

export function filterScheduledNextWeek(
  jobs: ScheduledJobRecord[],
  reference = new Date()
): ScheduledJobRecord[] {
  return filterScheduledInWeek(jobs, reference, 1)
}

function getDisplayDueDate(job: ScheduledJobRecord): string {
  const scheduledSnapshot = job.sourceSnapshots?.find(s => isScheduledStatus(s.jobStatus))
  const raw =
    scheduledSnapshot?.dueDate ||
    scheduledSnapshot?.createdOn ||
    job.dueDate ||
    job.createdOn
  return formatJobExportDate(raw)
}

function formatCustomerName(job: ScheduledJobRecord): string {
  const first = String(job.firstName ?? '').trim()
  const last = String(job.lastName ?? '').trim()
  const name = [first, last].filter(Boolean).join(' ')
  return name || '—'
}

function mapJobToRow(job: ScheduledJobRecord): ScheduledThisWeekRow {
  const laborAmount = getMergedLaborAmount(job)
  return {
    id: getScheduledJobRowId(job),
    taskType: formatMergedTaskTypes(job),
    dueDate: getDisplayDueDate(job),
    workroom: getWorkroomForStore(job.store),
    store: job.store != null ? String(job.store) : '—',
    district: job.district != null ? String(job.district) : '—',
    category: job.laborCategory || '—',
    laborAmount,
    laborAmountDisplay: formatPaymentCurrency(laborAmount),
    jobStatus: formatMergedJobStatus(job),
    customerName: formatCustomerName(job),
    crewLead: job.crewLead || '—',
    storeLocation: job.storeLocation || '—',
  }
}

export function buildScheduledWeekRows(
  jobs: ScheduledJobRecord[],
  weekOffset = 0,
  reference = new Date()
): ScheduledThisWeekRow[] {
  return filterScheduledInWeek(jobs, reference, weekOffset)
    .map(mapJobToRow)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.workroom.localeCompare(b.workroom))
}

export function buildScheduledThisWeekRows(jobs: ScheduledJobRecord[]): ScheduledThisWeekRow[] {
  return buildScheduledWeekRows(jobs, 0)
}

export function buildScheduledNextWeekRows(jobs: ScheduledJobRecord[]): ScheduledThisWeekRow[] {
  return buildScheduledWeekRows(jobs, 1)
}

export function getWeekLabel(reference = new Date(), weekOffset = 0): string {
  const { start, end } = getWeekBounds(reference, weekOffset)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function getScheduledWeekLabel(reference = new Date(), weekOffset = 0): string {
  return getWeekLabel(reference, weekOffset)
}
