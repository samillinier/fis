import * as XLSX from 'xlsx'
import { getStoreName } from '@/data/storeNames'
import { workroomStoreData } from '@/data/workroomStoreData'

export type CycleTimeVariant = 'ytd' | 'ly'

export interface CycleTimeStoreRecord {
  location: number
  storeName: string
  workroom: string
  division: string
  region: number | null
  district: number | null
  detailsCompleted: number
  detailsRtsSch: number | null
  detailsSchStart: number | null
  detailsStartDocs: number | null
  detailsTotal: number | null
  jobsCompleted: number
  jobsRtsSch: number | null
  jobsSchStart: number | null
  jobsStartComp: number | null
  jobsTotal: number | null
  woCompleted: number
  woRtsSch: number | null
  woSchStart: number | null
  woStartComp: number | null
  woTotal: number | null
  /** Present on full scorecard exports (e.g. LY.xlsx); 0 when missing */
  laborPO: number
  vendorDebit: number
}

export interface CycleTimeDataset {
  records: CycleTimeStoreRecord[]
  fileName: string | null
  uploadedAt: string | null
}

interface ColumnLayout {
  location: number
  division: number
  region: number
  district: number
  detailsCompleted: number
  detailsRtsSch: number
  detailsSchStart: number
  detailsStartDocs: number
  detailsTotal: number
  jobsCompleted: number
  jobsRtsSch: number
  jobsSchStart: number
  jobsStartComp: number
  jobsTotal: number
  woCompleted: number
  woRtsSch: number
  woSchStart: number
  woStartComp: number
  woTotal: number
  laborPO: number | null
  vendorDebit: number | null
}

/** Compact Details/Jobs/WO export (YTD.xlsx) */
const YTD_LAYOUT: ColumnLayout = {
  location: 1,
  division: 2,
  region: 3,
  district: 4,
  detailsCompleted: 5,
  detailsRtsSch: 6,
  detailsSchStart: 7,
  detailsStartDocs: 8,
  detailsTotal: 9,
  jobsCompleted: 10,
  jobsRtsSch: 11,
  jobsSchStart: 12,
  jobsStartComp: 13,
  jobsTotal: 14,
  woCompleted: 15,
  woRtsSch: 16,
  woSchStart: 17,
  woStartComp: 18,
  woTotal: 19,
  laborPO: null,
  vendorDebit: null,
}

/** Full scorecard export with LTR/etc. (LY.xlsx) */
const LY_LAYOUT: ColumnLayout = {
  location: 4,
  division: 1,
  region: 2,
  district: 3,
  detailsCompleted: 14,
  detailsRtsSch: 15,
  detailsSchStart: 16,
  detailsStartDocs: 17,
  detailsTotal: 18,
  jobsCompleted: 19,
  jobsRtsSch: 20,
  jobsSchStart: 21,
  jobsStartComp: 22,
  jobsTotal: 23,
  woCompleted: 28,
  woRtsSch: 29,
  woSchStart: 30,
  woStartComp: 31,
  woTotal: 32,
  laborPO: 50,
  vendorDebit: 48,
}

const STORAGE_KEYS: Record<CycleTimeVariant, { data: string; fileName: string; uploadedAt: string }> = {
  ytd: {
    data: 'fis-cycle-time-ytd-data',
    fileName: 'fis-cycle-time-ytd-file-name',
    uploadedAt: 'fis-cycle-time-ytd-uploaded-at',
  },
  ly: {
    data: 'fis-cycle-time-ly-data',
    fileName: 'fis-cycle-time-ly-file-name',
    uploadedAt: 'fis-cycle-time-ly-uploaded-at',
  },
}

// Back-compat: migrate old single-key YTD storage if present
const LEGACY_YTD_KEYS = {
  data: 'fis-cycle-time-data',
  fileName: 'fis-cycle-time-file-name',
  uploadedAt: 'fis-cycle-time-uploaded-at',
}

const storeToWorkroom = new Map<number, string>(
  workroomStoreData.map((r) => [r.store, r.workroom])
)

function cleanCell(value: unknown): unknown {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed.toLowerCase() === 'nan') return null
    return trimmed
  }
  if (typeof value === 'number' && Number.isNaN(value)) return null
  return value
}

function toNumber(value: unknown): number | null {
  const cleaned = cleanCell(value)
  if (cleaned == null) return null
  const n = typeof cleaned === 'number' ? cleaned : Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function toInt(value: unknown): number {
  const n = toNumber(value)
  return n == null ? 0 : Math.round(n)
}

function resolveWorkroom(location: number): string {
  return storeToWorkroom.get(location) || 'Unassigned'
}

function isHierarchyRow(record: Omit<CycleTimeStoreRecord, 'storeName' | 'workroom'>): boolean {
  const hasAnyMetric =
    record.detailsTotal != null ||
    record.jobsTotal != null ||
    record.woTotal != null ||
    record.detailsCompleted > 0 ||
    record.jobsCompleted > 0 ||
    record.woCompleted > 0

  return !hasAnyMetric
}

function headerText(row: unknown[] | undefined, index: number): string {
  const value = cleanCell(row?.[index])
  return value == null ? '' : String(value).trim().toLowerCase()
}

function findHeaderIndex(headers: string[], candidates: string[]): number | null {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]
    if (candidates.some((c) => h === c || h.includes(c))) return i
  }
  return null
}

function detectLayout(headerRow: unknown[] | undefined, groupRow: unknown[] | undefined): ColumnLayout {
  const headers = (headerRow || []).map((v) => String(cleanCell(v) ?? '').trim().toLowerCase())
  const groups = (groupRow || []).map((v) => String(cleanCell(v) ?? '').trim().toLowerCase())

  const hasLtr = headers.includes('ltr%') || groups.includes('ltr')
  const locationAt4 = headerText(headerRow, 4) === 'location #'
  const locationAt1 = headerText(headerRow, 1) === 'location #'

  let layout: ColumnLayout
  if (hasLtr || locationAt4) layout = { ...LY_LAYOUT }
  else if (locationAt1) layout = { ...YTD_LAYOUT }
  else if ((headerRow?.length || 0) > 25) layout = { ...LY_LAYOUT }
  else layout = { ...YTD_LAYOUT }

  // Prefer header names when present so column shifts still work
  const laborIdx = findHeaderIndex(headers, ['labor po $', 'labor po'])
  const vendorIdx = findHeaderIndex(headers, ['vendor debits $', 'vendor debit $', 'vendor debits'])
  if (laborIdx != null) layout.laborPO = laborIdx
  if (vendorIdx != null) layout.vendorDebit = vendorIdx

  return layout
}

export function parseCycleTimeWorkbook(arrayBuffer: ArrayBuffer): CycleTimeStoreRecord[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName =
    workbook.SheetNames.find((n) => n.toLowerCase() === 'report') || workbook.SheetNames[0]
  if (!sheetName) throw new Error('No worksheet found in file')

  const worksheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true }) as unknown[][]

  // Row 1 = group headers, Row 2 = column headers, data starts at row 3 (index 2)
  const layout = detectLayout(rows[1], rows[0])
  const records: CycleTimeStoreRecord[] = []

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 10) continue

    const location = toNumber(row[layout.location])
    if (location == null) continue

    const draft = {
      location: Math.round(location),
      division: String(cleanCell(row[layout.division]) ?? ''),
      region: toNumber(row[layout.region]),
      district: toNumber(row[layout.district]),
      detailsCompleted: toInt(row[layout.detailsCompleted]),
      detailsRtsSch: toNumber(row[layout.detailsRtsSch]),
      detailsSchStart: toNumber(row[layout.detailsSchStart]),
      detailsStartDocs: toNumber(row[layout.detailsStartDocs]),
      detailsTotal: toNumber(row[layout.detailsTotal]),
      jobsCompleted: toInt(row[layout.jobsCompleted]),
      jobsRtsSch: toNumber(row[layout.jobsRtsSch]),
      jobsSchStart: toNumber(row[layout.jobsSchStart]),
      jobsStartComp: toNumber(row[layout.jobsStartComp]),
      jobsTotal: toNumber(row[layout.jobsTotal]),
      woCompleted: toInt(row[layout.woCompleted]),
      woRtsSch: toNumber(row[layout.woRtsSch]),
      woSchStart: toNumber(row[layout.woSchStart]),
      woStartComp: toNumber(row[layout.woStartComp]),
      woTotal: toNumber(row[layout.woTotal]),
      laborPO: layout.laborPO != null ? toNumber(row[layout.laborPO]) ?? 0 : 0,
      vendorDebit: layout.vendorDebit != null ? toNumber(row[layout.vendorDebit]) ?? 0 : 0,
    }

    if (isHierarchyRow(draft)) continue

    records.push({
      ...draft,
      storeName: getStoreName(draft.location),
      workroom: resolveWorkroom(draft.location),
    })
  }

  if (records.length === 0) {
    throw new Error('No store-level cycle time rows found. Upload the Details Cycle Time report (.xlsx).')
  }

  return records.sort((a, b) => a.location - b.location)
}

function migrateLegacyYtdIfNeeded(): void {
  if (typeof window === 'undefined') return
  try {
    const keys = STORAGE_KEYS.ytd
    if (localStorage.getItem(keys.data)) return
    const legacy = localStorage.getItem(LEGACY_YTD_KEYS.data)
    if (!legacy) return
    localStorage.setItem(keys.data, legacy)
    const fileName = localStorage.getItem(LEGACY_YTD_KEYS.fileName)
    const uploadedAt = localStorage.getItem(LEGACY_YTD_KEYS.uploadedAt)
    if (fileName) localStorage.setItem(keys.fileName, fileName)
    if (uploadedAt) localStorage.setItem(keys.uploadedAt, uploadedAt)
  } catch {
    // ignore
  }
}

export function loadCycleTimeDataset(variant: CycleTimeVariant = 'ytd'): CycleTimeDataset {
  if (typeof window === 'undefined') {
    return { records: [], fileName: null, uploadedAt: null }
  }
  if (variant === 'ytd') migrateLegacyYtdIfNeeded()
  const keys = STORAGE_KEYS[variant]
  try {
    const raw = localStorage.getItem(keys.data)
    const records = raw ? (JSON.parse(raw) as CycleTimeStoreRecord[]) : []
    return {
      records: Array.isArray(records) ? records : [],
      fileName: localStorage.getItem(keys.fileName),
      uploadedAt: localStorage.getItem(keys.uploadedAt),
    }
  } catch {
    return { records: [], fileName: null, uploadedAt: null }
  }
}

export function saveCycleTimeDataset(
  records: CycleTimeStoreRecord[],
  fileName: string,
  variant: CycleTimeVariant = 'ytd'
): void {
  if (typeof window === 'undefined') return
  const keys = STORAGE_KEYS[variant]
  const uploadedAt = new Date().toISOString()
  localStorage.setItem(keys.data, JSON.stringify(records))
  localStorage.setItem(keys.fileName, fileName)
  localStorage.setItem(keys.uploadedAt, uploadedAt)
}

export function clearCycleTimeDataset(variant: CycleTimeVariant = 'ytd'): void {
  if (typeof window === 'undefined') return
  const keys = STORAGE_KEYS[variant]
  localStorage.removeItem(keys.data)
  localStorage.removeItem(keys.fileName)
  localStorage.removeItem(keys.uploadedAt)
}

export function averageNullable(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
