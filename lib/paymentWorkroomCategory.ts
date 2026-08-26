import type { PaymentRecord } from '@/context/PaymentContext'
import type { ScheduledJobData, ScheduledJobRecord } from '@/context/ScheduledJobContext'
import { getWorkroomForStore } from '@/lib/paymentExecutiveSummary'
import { getPaymentAmount } from '@/lib/paymentParser'

export type PaymentCategoryBucket =
  | 'vinyl'
  | 'carpet'
  | 'hardwoodLaminate'
  | 'ceramicTile'
  | 'lprFlooring'
  | 'other'

export interface WorkroomCategoryRow {
  workroom: string
  vinylJobs: number
  carpetJobs: number
  hardwoodLaminateJobs: number
  lprFlooringJobs: number
  vinylLabour: number
  carpetLabour: number
  hardwoodLaminateLabour: number
  ceramicTileLabour: number
  totalJobs: number
  totalLabour: number
}

function jobKey(record: PaymentRecord, index: number): string {
  const id = record.associatedJobId
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `row-${index}`
}

/** Map Labour Category (column K) to pivot bucket */
export function mapLabourCategoryToBucket(raw: string | undefined): PaymentCategoryBucket {
  const u = String(raw ?? '').toUpperCase().replace(/\s+/g, ' ').trim()
  if (!u) return 'other'
  if (u.includes('CARPET')) return 'carpet'
  if (u.includes('BACKSPLASH') || u.includes('CERAMIC') || u.includes('TILE')) return 'ceramicTile'
  if (u.includes('LPR') || u.includes('LVP') || u.includes('LUXURY VINYL')) return 'lprFlooring'
  if (u.includes('HWOOD') || u.includes('HARDWOOD') || u.includes('LAMINATE')) return 'hardwoodLaminate'
  if (u.includes('VINYL')) return 'vinyl'
  return 'other'
}

function emptyBucketCounts(): Record<PaymentCategoryBucket, { jobs: number; labour: number }> {
  return {
    vinyl: { jobs: 0, labour: 0 },
    carpet: { jobs: 0, labour: 0 },
    hardwoodLaminate: { jobs: 0, labour: 0 },
    ceramicTile: { jobs: 0, labour: 0 },
    lprFlooring: { jobs: 0, labour: 0 },
    other: { jobs: 0, labour: 0 },
  }
}

interface JobRollup {
  workroom: string
  bucket: PaymentCategoryBucket
  labourValue: number
}

/** Pivot unique jobs and labour by workroom × category bucket */
export function computeWorkroomCategoryPivot(payments: PaymentRecord[]): WorkroomCategoryRow[] {
  const jobs = new Map<string, JobRollup>()

  payments.forEach((record, index) => {
    const key = jobKey(record, index)
    const workroom = getWorkroomForStore(record.store)
    const bucket = mapLabourCategoryToBucket(record.labourCategory)
    const amount = getPaymentAmount(record)

    const existing = jobs.get(key)
    if (existing) {
      existing.labourValue += amount
    } else {
      jobs.set(key, { workroom, bucket, labourValue: amount })
    }
  })

  const byWorkroom = new Map<string, {
    buckets: Record<PaymentCategoryBucket, { jobs: number; labour: number }>
    totalJobs: number
    totalLabour: number
  }>()

  jobs.forEach(job => {
    const row = byWorkroom.get(job.workroom) || {
      buckets: emptyBucketCounts(),
      totalJobs: 0,
      totalLabour: 0,
    }

    row.buckets[job.bucket].jobs += 1
    row.buckets[job.bucket].labour += job.labourValue
    row.totalJobs += 1
    row.totalLabour += job.labourValue
    byWorkroom.set(job.workroom, row)
  })

  return Array.from(byWorkroom.entries())
    .map(([workroom, row]) => ({
      workroom,
      vinylJobs: row.buckets.vinyl.jobs,
      carpetJobs: row.buckets.carpet.jobs,
      hardwoodLaminateJobs: row.buckets.hardwoodLaminate.jobs,
      lprFlooringJobs: row.buckets.lprFlooring.jobs,
      vinylLabour: row.buckets.vinyl.labour,
      carpetLabour: row.buckets.carpet.labour,
      hardwoodLaminateLabour: row.buckets.hardwoodLaminate.labour,
      ceramicTileLabour: row.buckets.ceramicTile.labour,
      totalJobs: row.totalJobs,
      totalLabour: row.totalLabour,
    }))
    .sort((a, b) => b.totalLabour - a.totalLabour)
}

function scheduledJobRowKey(job: ScheduledJobRecord, source: string): string {
  return job.linkKey || `${source}:${job.id}`
}

/** Pivot export rows by workroom × category (each file row counted) */
export function computeWorkroomCategoryPivotFromScheduledJobBundles(
  data: ScheduledJobData
): WorkroomCategoryRow[] {
  const jobs = new Map<string, JobRollup>()

  ;(['measure', 'install', 'workorder'] as const).forEach(source => {
    data[source].jobs.forEach(job => {
      const key = scheduledJobRowKey(job, source)
      const workroom = getWorkroomForStore(job.store)
      const bucket = mapLabourCategoryToBucket(job.laborCategory)
      const amount = job.laborAmount ?? 0

      const existing = jobs.get(key)
      if (existing) {
        existing.labourValue += amount
      } else {
        jobs.set(key, { workroom, bucket, labourValue: amount })
      }
    })
  })

  const byWorkroom = new Map<string, {
    buckets: Record<PaymentCategoryBucket, { jobs: number; labour: number }>
    totalJobs: number
    totalLabour: number
  }>()

  jobs.forEach(job => {
    const row = byWorkroom.get(job.workroom) || {
      buckets: emptyBucketCounts(),
      totalJobs: 0,
      totalLabour: 0,
    }

    row.buckets[job.bucket].jobs += 1
    row.buckets[job.bucket].labour += job.labourValue
    row.totalJobs += 1
    row.totalLabour += job.labourValue
    byWorkroom.set(job.workroom, row)
  })

  return Array.from(byWorkroom.entries())
    .map(([workroom, row]) => ({
      workroom,
      vinylJobs: row.buckets.vinyl.jobs,
      carpetJobs: row.buckets.carpet.jobs,
      hardwoodLaminateJobs: row.buckets.hardwoodLaminate.jobs,
      lprFlooringJobs: row.buckets.lprFlooring.jobs,
      vinylLabour: row.buckets.vinyl.labour,
      carpetLabour: row.buckets.carpet.labour,
      hardwoodLaminateLabour: row.buckets.hardwoodLaminate.labour,
      ceramicTileLabour: row.buckets.ceramicTile.labour,
      totalJobs: row.totalJobs,
      totalLabour: row.totalLabour,
    }))
    .sort((a, b) => b.totalLabour - a.totalLabour)
}

export function sumWorkroomCategoryRows(rows: WorkroomCategoryRow[]): WorkroomCategoryRow {
  return rows.reduce(
    (acc, row) => ({
      workroom: 'Total',
      vinylJobs: acc.vinylJobs + row.vinylJobs,
      carpetJobs: acc.carpetJobs + row.carpetJobs,
      hardwoodLaminateJobs: acc.hardwoodLaminateJobs + row.hardwoodLaminateJobs,
      lprFlooringJobs: acc.lprFlooringJobs + row.lprFlooringJobs,
      vinylLabour: acc.vinylLabour + row.vinylLabour,
      carpetLabour: acc.carpetLabour + row.carpetLabour,
      hardwoodLaminateLabour: acc.hardwoodLaminateLabour + row.hardwoodLaminateLabour,
      ceramicTileLabour: acc.ceramicTileLabour + row.ceramicTileLabour,
      totalJobs: acc.totalJobs + row.totalJobs,
      totalLabour: acc.totalLabour + row.totalLabour,
    }),
    {
      workroom: 'Total',
      vinylJobs: 0,
      carpetJobs: 0,
      hardwoodLaminateJobs: 0,
      lprFlooringJobs: 0,
      vinylLabour: 0,
      carpetLabour: 0,
      hardwoodLaminateLabour: 0,
      ceramicTileLabour: 0,
      totalJobs: 0,
      totalLabour: 0,
    }
  )
}
