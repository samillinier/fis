import type {
  ScheduledJobData,
  ScheduledJobRecord,
  ScheduledJobSourceSnapshot,
  ScheduledJobSourceType,
} from '@/context/ScheduledJobContext'
import { emptyScheduledJobData } from '@/context/ScheduledJobContext'
import { computeJobLinkKey } from '@/lib/scheduledJobLink'

const MERGE_ORDER: ScheduledJobSourceType[] = ['measure', 'install', 'workorder']

const SOURCE_ID_FIELD: Record<ScheduledJobSourceType, keyof ScheduledJobRecord> = {
  measure: 'measureId',
  install: 'installId',
  workorder: 'workorderId',
}

function snapshotFromJob(job: ScheduledJobRecord, source: ScheduledJobSourceType): ScheduledJobSourceSnapshot {
  return {
    source,
    id: job.id,
    jobType: job.jobType,
    jobStatus: job.jobStatus,
    dueDate: job.dueDate,
    createdOn: job.createdOn,
    crewLead: job.crewLead,
    laborAmount: job.laborAmount,
  }
}

function mergeTwoRecords(
  existing: ScheduledJobRecord,
  incoming: ScheduledJobRecord,
  incomingSource: ScheduledJobSourceType
): ScheduledJobRecord {
  const merged: ScheduledJobRecord = { ...existing }
  const sources = new Set<ScheduledJobSourceType>([
    ...(existing.exportSources || []),
    incomingSource,
    ...(incoming.exportSources || []),
  ])

  const snapshots = [...(existing.sourceSnapshots || [])]
  const incomingSnapshot = snapshotFromJob(incoming, incomingSource)
  const snapshotIdx = snapshots.findIndex(s => s.source === incomingSource)
  if (snapshotIdx >= 0) snapshots[snapshotIdx] = incomingSnapshot
  else snapshots.push(incomingSnapshot)

  ;(Object.keys(incoming) as (keyof ScheduledJobRecord)[]).forEach(key => {
    if (
      key === 'id' ||
      key === 'exportSources' ||
      key === 'sourceSnapshots' ||
      key === 'linkKey' ||
      key === 'measureId' ||
      key === 'installId' ||
      key === 'workorderId' ||
      key === 'laborAmount'
    ) {
      return
    }
    const value = incoming[key]
    if (value != null && value !== '') {
      merged[key] = value as never
    }
  })

  const idField = SOURCE_ID_FIELD[incomingSource]
  ;(merged as unknown as Record<string, unknown>)[idField] = incoming.id

  merged.exportSources = Array.from(sources)
  merged.sourceSnapshots = snapshots
  merged.laborAmount = snapshots.reduce((sum, s) => sum + (s.laborAmount ?? 0), 0)
  merged.linkKey = merged.linkKey || computeJobLinkKey(merged)

  return merged
}

function tagJobForSource(job: ScheduledJobRecord, source: ScheduledJobSourceType): ScheduledJobRecord {
  const linkKey = computeJobLinkKey(job)
  const idField = SOURCE_ID_FIELD[source]
  return {
    ...job,
    linkKey,
    [idField]: job.id,
    exportSources: [source],
    sourceSnapshots: [snapshotFromJob(job, source)],
  }
}

/** Merge all three exports — links same customer job across measure / install / work order */
export function mergeScheduledJobSources(data: ScheduledJobData): ScheduledJobRecord[] {
  const byLink = new Map<string, ScheduledJobRecord>()

  MERGE_ORDER.forEach(source => {
    data[source].jobs.forEach(job => {
      const tagged = tagJobForSource(job, source)
      const linkKey = tagged.linkKey || computeJobLinkKey(tagged)
      const existing = byLink.get(linkKey)

      if (existing) {
        byLink.set(linkKey, mergeTwoRecords(existing, tagged, source))
      } else {
        byLink.set(linkKey, tagged)
      }
    })
  })

  return Array.from(byLink.values())
}

export function countJobsLinkedAcrossSources(jobs: ScheduledJobRecord[]): number {
  return jobs.filter(job => (job.exportSources?.length || 0) > 1).length
}

export interface ScheduledJobSyncSummary {
  measure: number
  install: number
  workorder: number
  mergedTotal: number
  linkedAcrossFiles: number
}

export function getScheduledJobSyncSummary(data: ScheduledJobData): ScheduledJobSyncSummary {
  const merged = mergeScheduledJobSources(data)
  return {
    measure: data.measure.jobs.length,
    install: data.install.jobs.length,
    workorder: data.workorder.jobs.length,
    mergedTotal: merged.length,
    linkedAcrossFiles: countJobsLinkedAcrossSources(merged),
  }
}

/** Normalize API/localStorage payloads (legacy flat array or new 3-file shape) */
export function normalizeScheduledJobData(raw: unknown): ScheduledJobData {
  if (!raw || typeof raw !== 'object') {
    return emptyScheduledJobData()
  }

  const obj = raw as Record<string, unknown>

  if (Array.isArray(raw)) {
    return {
      ...emptyScheduledJobData(),
      measure: { jobs: raw as ScheduledJobRecord[] },
    }
  }

  if (Array.isArray(obj.jobs)) {
    return {
      ...emptyScheduledJobData(),
      measure: {
        jobs: obj.jobs as ScheduledJobRecord[],
        fileName: typeof obj.fileName === 'string' ? obj.fileName : undefined,
        uploadDate: typeof obj.uploadDate === 'string' ? obj.uploadDate : undefined,
      },
    }
  }

  const readBundle = (key: ScheduledJobSourceType) => {
    const bundle = obj[key]
    if (!bundle || typeof bundle !== 'object') return { jobs: [] as ScheduledJobRecord[] }
    const b = bundle as Record<string, unknown>
    return {
      jobs: Array.isArray(b.jobs) ? (b.jobs as ScheduledJobRecord[]) : [],
      fileName: typeof b.fileName === 'string' ? b.fileName : undefined,
      uploadDate: typeof b.uploadDate === 'string' ? b.uploadDate : undefined,
    }
  }

  return {
    install: readBundle('install'),
    measure: readBundle('measure'),
    workorder: readBundle('workorder'),
  }
}
