import type {
  ScheduledJobData,
  ScheduledJobSourceBundle,
  ScheduledJobSourceType,
} from '@/context/ScheduledJobContext'
import { emptyScheduledJobData } from '@/context/ScheduledJobContext'

export type ScheduledJobStorageMode = 'monthly' | 'yearly'

const STORE = 'bundles'

const SOURCE_KEYS: Record<ScheduledJobSourceType, string> = {
  install: 'install',
  measure: 'measure',
  workorder: 'workorder',
}

/** Legacy keys before monthly/yearly split — treated as monthly */
const LEGACY_DB_NAME = 'fis-scheduled-jobs'
const LEGACY_LS_KEYS: Record<ScheduledJobSourceType, string> = {
  install: 'fis-scheduled-jobs-install',
  measure: 'fis-scheduled-jobs-measure',
  workorder: 'fis-scheduled-jobs-workorder',
}

function dbName(mode: ScheduledJobStorageMode, year?: number): string {
  if (mode === 'yearly') {
    const y = year ?? new Date().getFullYear()
    return `fis-scheduled-jobs-yearly-${y}`
  }
  return 'fis-scheduled-jobs-monthly'
}

function emptyBundle(): ScheduledJobSourceBundle {
  return { jobs: [] }
}

function normalizeBundle(raw: unknown): ScheduledJobSourceBundle {
  if (!raw || typeof raw !== 'object') return emptyBundle()
  const parsed = raw as ScheduledJobSourceBundle
  if (!Array.isArray(parsed.jobs)) return emptyBundle()
  return {
    jobs: parsed.jobs,
    fileName: typeof parsed.fileName === 'string' ? parsed.fileName : undefined,
    uploadDate: typeof parsed.uploadDate === 'string' ? parsed.uploadDate : undefined,
  }
}

function openDb(name: string): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1)
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

async function idbGet(db: IDBDatabase, source: ScheduledJobSourceType): Promise<ScheduledJobSourceBundle | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.get(SOURCE_KEYS[source])
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'))
    request.onsuccess = () => {
      resolve(request.result ? normalizeBundle(request.result) : null)
    }
  })
}

async function idbSet(db: IDBDatabase, source: ScheduledJobSourceType, bundle: ScheduledJobSourceBundle): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const request = store.put(bundle, SOURCE_KEYS[source])
    request.onerror = () => reject(request.error ?? new Error('IndexedDB write failed'))
    request.onsuccess = () => resolve()
  })
}

async function withDb<T>(
  mode: ScheduledJobStorageMode,
  fn: (db: IDBDatabase) => Promise<T>,
  year?: number
): Promise<T> {
  const db = await openDb(dbName(mode, year))
  try {
    return await fn(db)
  } finally {
    db.close()
  }
}

function readLegacyLocalStorage(source: ScheduledJobSourceType): ScheduledJobSourceBundle {
  if (typeof window === 'undefined') return emptyBundle()
  try {
    const raw = window.localStorage.getItem(LEGACY_LS_KEYS[source])
    if (!raw) return emptyBundle()
    return normalizeBundle(JSON.parse(raw))
  } catch {
    return emptyBundle()
  }
}

async function migrateLegacyMonthlyIfNeeded(mode: ScheduledJobStorageMode): Promise<void> {
  if (mode !== 'monthly' || typeof window === 'undefined') return

  await withDb('monthly', async db => {
    for (const source of ['install', 'measure', 'workorder'] as const) {
      const existing = await idbGet(db, source)
      if (existing && existing.jobs.length > 0) continue

      let legacy = readLegacyLocalStorage(source)
      if (legacy.jobs.length === 0) {
        try {
          const oldDb = await openDb(LEGACY_DB_NAME)
          const fromOldDb = await idbGet(oldDb, source)
          oldDb.close()
          if (fromOldDb && fromOldDb.jobs.length > 0) legacy = fromOldDb
        } catch {
          // ignore
        }
      }

      if (legacy.jobs.length > 0) {
        await idbSet(db, source, legacy)
        try {
          window.localStorage.removeItem(LEGACY_LS_KEYS[source])
        } catch {
          // ignore
        }
      }
    }
  })
}

export async function loadScheduledJobDataLocal(
  mode: ScheduledJobStorageMode,
  year?: number
): Promise<ScheduledJobData> {
  if (typeof window === 'undefined') return emptyScheduledJobData()

  try {
    await migrateLegacyMonthlyIfNeeded(mode)

    return await withDb(
      mode,
      async db => {
        const [install, measure, workorder] = await Promise.all([
          idbGet(db, 'install'),
          idbGet(db, 'measure'),
          idbGet(db, 'workorder'),
        ])

        return {
          install: install ?? emptyBundle(),
          measure: measure ?? emptyBundle(),
          workorder: workorder ?? emptyBundle(),
        }
      },
      year
    )
  } catch (error) {
    console.error(`❌ [loadScheduledJobDataLocal] ${mode}:`, error)
    if (mode === 'monthly') {
      return {
        install: readLegacyLocalStorage('install'),
        measure: readLegacyLocalStorage('measure'),
        workorder: readLegacyLocalStorage('workorder'),
      }
    }
    return emptyScheduledJobData()
  }
}

export async function saveScheduledJobSourceLocal(
  mode: ScheduledJobStorageMode,
  source: ScheduledJobSourceType,
  bundle: ScheduledJobSourceBundle,
  year?: number
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    await withDb(mode, db => idbSet(db, source, bundle), year)
    return true
  } catch (error) {
    console.error(`❌ [saveScheduledJobSourceLocal] ${mode}/${source}:`, error)
    return false
  }
}

export async function saveScheduledJobDataLocal(
  mode: ScheduledJobStorageMode,
  data: ScheduledJobData,
  year?: number
): Promise<boolean> {
  const results = await Promise.all(
    (['install', 'measure', 'workorder'] as const).map(source =>
      saveScheduledJobSourceLocal(mode, source, data[source], year)
    )
  )
  return results.every(Boolean)
}

export function countScheduledJobRows(data: ScheduledJobData): number {
  return data.install.jobs.length + data.measure.jobs.length + data.workorder.jobs.length
}

export async function clearScheduledJobLocalData(mode: ScheduledJobStorageMode, year?: number): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    await withDb(
      mode,
      db =>
        new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite')
          const store = tx.objectStore(STORE)
          const request = store.clear()
          request.onerror = () => reject(request.error ?? new Error('IndexedDB clear failed'))
          request.onsuccess = () => resolve()
        }),
      year
    )
  } catch (error) {
    console.error(`❌ [clearScheduledJobLocalData] ${mode}:`, error)
  }
}

export { emptyScheduledJobData }
