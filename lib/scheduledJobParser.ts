import type { ScheduledJobRecord } from '@/context/ScheduledJobContext'

const HEADER_ALIASES: Record<string, keyof ScheduledJobRecord> = {
  id: 'id',
  jobtype: 'jobType',
  'job type': 'jobType',
  firstname: 'firstName',
  'first name': 'firstName',
  lastname: 'lastName',
  'last name': 'lastName',
  laborcategory: 'laborCategory',
  'labor category': 'laborCategory',
  'labour category': 'laborCategory',
  jobstatus: 'jobStatus',
  'job status': 'jobStatus',
  customerphone: 'customerPhone',
  'customer phone': 'customerPhone',
  customeraddress: 'customerAddress',
  'customer address': 'customerAddress',
  store: 'store',
  district: 'district',
  createdon: 'createdOn',
  'created on': 'createdOn',
  duedate: 'dueDate',
  'due date': 'dueDate',
  'scheduled date': 'dueDate',
  customeremail: 'customerEmail',
  'customer email': 'customerEmail',
  crewlead: 'crewLead',
  'crew lead': 'crewLead',
  storelocation: 'storeLocation',
  'store location': 'storeLocation',
  laboramount: 'laborAmount',
  'labor amount': 'laborAmount',
  'labour amount': 'laborAmount',
  leadsafepractices: 'leadSafePractices',
  'lead safe practices': 'leadSafePractices',
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').toLowerCase().trim()
}

function parseNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(num) ? num : undefined
}

function isHeaderRow(row: unknown[]): boolean {
  const first = normalizeHeader(row[0])
  return first === 'id' || first.includes('job')
}

function headerToField(header: unknown): keyof ScheduledJobRecord | null {
  const key = normalizeHeader(header)
  return HEADER_ALIASES[key] || null
}

export function parseJobExportDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const raw = String(value).trim()
  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    const parsed = new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

export function formatJobExportDate(value: unknown): string {
  const date = parseJobExportDate(value)
  if (!date) return String(value ?? '—')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function parseScheduledJobRows(jsonData: unknown[][]): ScheduledJobRecord[] {
  if (jsonData.length === 0) return []

  let headerRowIndex = 0
  for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
    if (isHeaderRow(jsonData[i] as unknown[])) {
      headerRowIndex = i
      break
    }
  }

  const headers = jsonData[headerRowIndex] as unknown[]
  const fieldIndexes: Partial<Record<keyof ScheduledJobRecord, number>> = {}
  headers.forEach((header, index) => {
    const field = headerToField(header)
    if (field) fieldIndexes[field] = index
  })

  if (fieldIndexes.id == null) return []

  const records: ScheduledJobRecord[] = []

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i] as unknown[]
    if (!row || row.length === 0) continue

    const id = String(row[fieldIndexes.id] ?? '').trim()
    if (!id) continue

    const record: ScheduledJobRecord = { id }

    ;(Object.keys(fieldIndexes) as (keyof ScheduledJobRecord)[]).forEach(field => {
      if (field === 'id') return
      const idx = fieldIndexes[field]
      if (idx == null) return
      const value = row[idx]
      if (value == null || value === '') return

      if (field === 'laborAmount') {
        record.laborAmount = parseNumber(value)
      } else if (field === 'store' || field === 'district') {
        (record as unknown as Record<string, unknown>)[field] = typeof value === 'number' ? value : String(value).trim()
      } else {
        (record as unknown as Record<string, unknown>)[field] = String(value).trim()
      }
    })

    if (!record.dueDate && record.createdOn) {
      record.dueDate = record.createdOn
    }

    records.push(record)
  }

  return records
}

/** Merge job exports by Id — non-empty fields from incoming fill gaps on existing */
export function mergeScheduledJobRecords(existing: ScheduledJobRecord[], incoming: ScheduledJobRecord[]): ScheduledJobRecord[] {
  const map = new Map<string, ScheduledJobRecord>()
  existing.forEach(job => map.set(job.id, job))
  incoming.forEach(job => {
    const prev = map.get(job.id)
    if (!prev) {
      map.set(job.id, job)
      return
    }
    const merged = { ...prev }
    ;(Object.keys(job) as (keyof ScheduledJobRecord)[]).forEach(key => {
      if (key === 'id') return
      const value = job[key]
      if (value != null && value !== '') {
        merged[key] = value as never
      }
    })
    map.set(job.id, merged)
  })
  return Array.from(map.values())
}
