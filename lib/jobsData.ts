import * as XLSX from 'xlsx'

export interface JobRecord {
  id: string
  jobType: string
  firstName: string
  lastName: string
  laborCategory: string
  jobStatus: string
  customerPhone: string
  customerAddress: string
  store: string
  district: string
  createdOn: string
  customerEmail: string
  crewLead: string
  storeLocation: string
  laborAmount: number
  leadSafePractices: string
}

const DB_NAME = 'fis-jobs'
const STORE = 'jobs'
const DATA_KEY = 'override'

/** Legacy localStorage keys (pre-IndexedDB) — read for migration, then removed. */
const LEGACY_KEYS = {
  data: 'fis-jobs-data',
  fileName: 'fis-jobs-file-name',
  uploadedAt: 'fis-jobs-uploaded-at',
}

function str(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

function cleanAddress(raw: unknown): string {
  const s = str(raw)
  if (!s) return ''
  const line = s.match(/firstLine=([^,]*)/)
  const city = s.match(/city=([^,]*)/)
  const state = s.match(/state=([^,]*)/)
  const zip = s.match(/postalCode=([^,]*)/)
  const lineV = line ? line[1].trim() : ''
  const cityV = city ? city[1].trim() : ''
  const stateV = state ? state[1].trim() : ''
  const zipV = zip ? zip[1].trim() : ''
  if (!lineV && !cityV && !stateV && !zipV) {
    return s.replace(/^Address\(/i, '').replace(/\)$/, '')
  }
  const cityStateZip = stateV ? `${stateV} ${zipV}`.trim() : zipV
  return [lineV, cityV, cityStateZip].filter(Boolean).join(', ')
}

function parseAmount(value: unknown): number {
  const n = parseFloat(str(value).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function parseDate(value: unknown): number {
  const s = str(value)
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return 0
  let h = parseInt(m[4], 10)
  const isPM = /pm/i.test(m[6])
  if (isPM && h !== 12) h += 12
  if (!isPM && h === 12) h = 0
  return new Date(
    parseInt(m[3], 10),
    parseInt(m[1], 10) - 1,
    parseInt(m[2], 10),
    h,
    parseInt(m[5], 10)
  ).getTime()
}

export function parseJobsWorkbook(arrayBuffer: ArrayBuffer): JobRecord[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('No worksheet found in file')

  const worksheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][]
  if (rows.length === 0) throw new Error('The selected file is empty')

  const header = (rows[0] || []).map((h) => str(h))
  const idx: Record<string, number> = {}
  header.forEach((h, i) => {
    idx[h] = i
  })

  const has = (key: string) => idx[key] != null

  const records: JobRecord[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !str(row[idx.Id])) continue

    records.push({
      id: str(row[idx.Id]),
      jobType: has('JobType') ? str(row[idx.JobType]) : '',
      firstName: has('FirstName') ? str(row[idx.FirstName]) : '',
      lastName: has('LastName') ? str(row[idx.LastName]) : '',
      laborCategory: has('Labor Category') ? str(row[idx['Labor Category']]) : '',
      jobStatus: has('Job Status') ? str(row[idx['Job Status']]) : '',
      customerPhone: has('Customer Phone') ? str(row[idx['Customer Phone']]) : '',
      customerAddress: has('Customer Address') ? cleanAddress(row[idx['Customer Address']]) : '',
      store: has('Store') ? str(row[idx.Store]) : '',
      district: has('District') ? str(row[idx.District]) : '',
      createdOn: has('Created On') ? str(row[idx['Created On']]) : '',
      customerEmail: has('Customer Email') ? str(row[idx['Customer Email']]) : '',
      crewLead: has('Crew Lead') ? str(row[idx['Crew Lead']]) : '',
      storeLocation: has('Store Location') ? str(row[idx['Store Location']]) : '',
      laborAmount: has('Labor Amount') ? parseAmount(row[idx['Labor Amount']]) : 0,
      leadSafePractices: has('Lead Safe Practices')
        ? str(row[idx['Lead Safe Practices']])
        : '',
    })
  }

  if (records.length === 0) {
    throw new Error('No job rows found. Upload a jobs export (.xlsx) with an "Id" column.')
  }

  return records.sort((a, b) => parseDate(b.createdOn) - parseDate(a.createdOn))
}

export interface JobsOverride {
  records: JobRecord[] | null
  fileName: string | null
  uploadedAt: string | null
}

const EMPTY_OVERRIDE: JobsOverride = { records: null, fileName: null, uploadedAt: null }

function normalizeOverride(raw: unknown): JobsOverride {
  if (!raw || typeof raw !== 'object') return EMPTY_OVERRIDE
  const o = raw as Partial<JobsOverride>
  return {
    records: Array.isArray(o.records) ? o.records : null,
    fileName: typeof o.fileName === 'string' ? o.fileName : null,
    uploadedAt: typeof o.uploadedAt === 'string' ? o.uploadedAt : null,
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

async function idbGet(): Promise<JobsOverride | null> {
  const db = await openDb()
  try {
    return await new Promise<JobsOverride | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(DATA_KEY)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'))
      request.onsuccess = () => resolve(request.result ? normalizeOverride(request.result) : null)
    })
  } finally {
    db.close()
  }
}

async function idbSet(override: JobsOverride): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const request = tx.objectStore(STORE).put(override, DATA_KEY)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB write failed'))
      request.onsuccess = () => resolve()
    })
  } finally {
    db.close()
  }
}

async function idbClear(): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const request = tx.objectStore(STORE).delete(DATA_KEY)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB delete failed'))
      request.onsuccess = () => resolve()
    })
  } finally {
    db.close()
  }
}

function readLegacyOverride(): JobsOverride {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEYS.data)
    if (!raw) return EMPTY_OVERRIDE
    const records = JSON.parse(raw) as JobRecord[]
    return {
      records: Array.isArray(records) ? records : null,
      fileName: window.localStorage.getItem(LEGACY_KEYS.fileName),
      uploadedAt: window.localStorage.getItem(LEGACY_KEYS.uploadedAt),
    }
  } catch {
    return EMPTY_OVERRIDE
  }
}

function clearLegacyOverride(): void {
  try {
    window.localStorage.removeItem(LEGACY_KEYS.data)
    window.localStorage.removeItem(LEGACY_KEYS.fileName)
    window.localStorage.removeItem(LEGACY_KEYS.uploadedAt)
  } catch {
    // ignore
  }
}

/**
 * Load a user-uploaded jobs dataset, if one exists. Null records means "use seed".
 * Prefers IndexedDB (large capacity); migrates any legacy localStorage data on first read.
 */
export async function loadJobsOverride(): Promise<JobsOverride> {
  if (typeof window === 'undefined') return EMPTY_OVERRIDE
  try {
    const existing = await idbGet()
    if (existing && (existing.records?.length || existing.fileName || existing.uploadedAt)) {
      return existing
    }
    const legacy = readLegacyOverride()
    if (legacy.records && legacy.records.length > 0) {
      await idbSet(legacy)
      clearLegacyOverride()
      return legacy
    }
    return EMPTY_OVERRIDE
  } catch {
    // Fall back to legacy localStorage if IndexedDB is unavailable.
    return readLegacyOverride()
  }
}

export async function saveJobsOverride(records: JobRecord[], fileName: string): Promise<void> {
  if (typeof window === 'undefined') return
  const override: JobsOverride = {
    records,
    fileName,
    uploadedAt: new Date().toISOString(),
  }
  try {
    await idbSet(override)
    clearLegacyOverride()
  } catch {
    // Last-resort fallback so the user can still use the page this session.
    try {
      window.localStorage.setItem(LEGACY_KEYS.data, JSON.stringify(records))
      window.localStorage.setItem(LEGACY_KEYS.fileName, fileName)
      window.localStorage.setItem(LEGACY_KEYS.uploadedAt, override.uploadedAt!)
    } catch {
      // ignore — data remains in memory for the current session
    }
  }
}

export async function clearJobsOverride(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await idbClear()
  } catch {
    // ignore
  }
  clearLegacyOverride()
}
