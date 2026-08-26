import type { ScheduledJobRecord, ScheduledJobSourceType } from '@/context/ScheduledJobContext'

export function normalizePhone(value: string | undefined): string {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

/** Link measure / install / work order rows for the same customer job */
export function computeJobLinkKey(job: ScheduledJobRecord): string {
  const phone = normalizePhone(job.customerPhone)
  const store = String(job.store ?? '').trim()
  const category = String(job.laborCategory ?? '').trim().toUpperCase()
  const first = String(job.firstName ?? '').trim().toUpperCase()
  const last = String(job.lastName ?? '').trim().toUpperCase()

  if (phone && store && category) {
    return `link:${phone}|${store}|${category}|${first}|${last}`
  }

  return `id:${String(job.id).trim()}`
}

export function getScheduledJobRowId(job: ScheduledJobRecord): string {
  return job.linkKey || job.installId || job.measureId || job.workorderId || job.id
}

const SOURCE_TYPE_LABELS: Record<ScheduledJobSourceType, string> = {
  measure: 'MEASURE',
  install: 'INSTALL',
  workorder: 'WORK ORDER',
}

export function formatMergedTaskTypes(job: ScheduledJobRecord): string {
  if (job.sourceSnapshots?.length) {
    const types = job.sourceSnapshots
      .map(s => s.jobType || SOURCE_TYPE_LABELS[s.source])
      .filter(Boolean)
    return Array.from(new Set(types)).join(' · ')
  }
  if (job.exportSources?.length) {
    return job.exportSources.map(s => SOURCE_TYPE_LABELS[s]).join(' · ')
  }
  return job.jobType || '—'
}

export function formatMergedJobStatus(job: ScheduledJobRecord): string {
  if (!job.sourceSnapshots?.length) return job.jobStatus || '—'

  const parts = job.sourceSnapshots
    .map(s => {
      const label = SOURCE_TYPE_LABELS[s.source]
      const status = s.jobStatus?.trim()
      return status ? `${label}: ${status}` : null
    })
    .filter(Boolean) as string[]

  if (parts.length === 0) return job.jobStatus || '—'
  if (parts.length === 1) return parts[0].split(': ')[1] || parts[0]
  return parts.join(' · ')
}

export function getMergedLaborAmount(job: ScheduledJobRecord): number {
  if (job.sourceSnapshots?.length) {
    return job.sourceSnapshots.reduce((sum, s) => sum + (s.laborAmount ?? 0), 0)
  }
  return job.laborAmount ?? 0
}
