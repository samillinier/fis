'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { FileText, Upload, CheckCircle2, AlertTriangle, RotateCcw, Cloud } from 'lucide-react'
import * as XLSX from 'xlsx'
import { storeLocations } from '@/data/storeLocations'
import { storeNames } from '@/data/storeNames'
import { getWorkroomsForDistrictAsString } from '@/data/districtToWorkroom'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'

type StoreForecastLike = {
  district: string
  store: string
}

export type WeeklyCountForVariance = {
  district: string
  week_number: number
  category: string
  actual_count: number
}

export type Q1GoalForVariance = {
  district: string
  week_number: number
  category: string
  planned_count: number
}

type TrackerCat = 'CARPET' | 'HSF' | 'TILE'

const CSV_WORKROOM_TO_DISTRICT: Record<string, string> = {
  ALBANY: '1222',
  DOTHAN: '1222',
  'PANAMA CITY': '1222',
  TALLAHASSEE: '1222',
  GAINESVILLE: '868',
  OCALA: '868',
  TAMPA: '1270',
  LAKELAND: '1297',
  NAPLES: '1226',
  SARASOTA: '1385',
}

function normalizeWorkroomName(raw: string | undefined): string {
  return safeString(raw).toUpperCase().replace(/\s+/g, ' ').trim()
}

function getDistrictFromCsvWorkroom(raw: string | undefined): string | null {
  const workroom = normalizeWorkroomName(raw)
  return workroom ? CSV_WORKROOM_TO_DISTRICT[workroom] || null : null
}

/** Map CSV project category labels to Q1 tracker / gateway categories */
function mapProjectCategoryToTracker(raw: string): TrackerCat | null {
  const u = safeString(raw).toUpperCase().replace(/\s+/g, ' ').trim()
  if (!u) return null
  if (u.includes('CARPET')) return 'CARPET'
  if (u.includes('BACKSPLASH')) return 'TILE'
  if (u.includes('CERAMIC') || u.endsWith('TILE') || u.includes(' TILE')) return 'TILE'
  if (
    u.includes('HWOOD') ||
    u.includes('LAMINATE') ||
    u.includes('VINYL') ||
    u.includes('HARDWOOD')
  ) {
    return 'HSF'
  }
  return null
}

/** Align with weekly-counts POST: numeric district id (e.g. 868, "868", "District 868") */
function normalizeDistrictKey(raw: string | number | undefined | null): string {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(Math.trunc(raw))
  let s = safeString(raw).replace(/^district\s*/i, '').trim()
  if (!s) return ''
  const match = s.match(/\d+/)
  if (match) return String(parseInt(match[0], 10))
  return s.toUpperCase()
}

function buildGatewayByDistrictWeek(counts: WeeklyCountForVariance[]) {
  const m = new Map<string, { TOTAL?: number; CARPET?: number; HSF?: number; TILE?: number }>()
  for (const c of counts) {
    const d = normalizeDistrictKey(c.district)
    const w = parseInt(String(c.week_number), 10)
    if (!d || !Number.isFinite(w)) continue
    const key = `${d}|${w}`
    const cat = safeString(c.category).toUpperCase()
    let row = m.get(key)
    if (!row) {
      row = {}
      m.set(key, row)
    }
    const n = Number(c.actual_count) || 0
    if (cat === 'TOTAL') row.TOTAL = (row.TOTAL || 0) + n
    else if (cat === 'CARPET') row.CARPET = (row.CARPET || 0) + n
    else if (cat === 'HSF') row.HSF = (row.HSF || 0) + n
    else if (cat === 'TILE') row.TILE = (row.TILE || 0) + n
  }
  return m
}

/** Planned counts from Q1 Goals upload (same shape as gateway index for lookup). */
function buildPlanIndexFromGoals(goalsRows: Q1GoalForVariance[]) {
  const m = new Map<string, { TOTAL?: number; CARPET?: number; HSF?: number; TILE?: number }>()
  for (const g of goalsRows) {
    const d = normalizeDistrictKey(g.district)
    const w = parseInt(String(g.week_number), 10)
    if (!d || !Number.isFinite(w)) continue
    const key = `${d}|${w}`
    const cat = safeString(g.category).toUpperCase()
    let row = m.get(key)
    if (!row) {
      row = {}
      m.set(key, row)
    }
    const n = Number(g.planned_count) || 0
    if (cat === 'TOTAL') row.TOTAL = (row.TOTAL || 0) + n
    else if (cat === 'CARPET') row.CARPET = (row.CARPET || 0) + n
    else if (cat === 'HSF') row.HSF = (row.HSF || 0) + n
    else if (cat === 'TILE') row.TILE = (row.TILE || 0) + n
  }
  return m
}

function getGatewayTotal(g: { TOTAL?: number; CARPET?: number; HSF?: number; TILE?: number } | undefined): number | null {
  if (!g) return null
  if (g.TOTAL != null && Number.isFinite(g.TOTAL)) return g.TOTAL
  const parts = [g.CARPET, g.HSF, g.TILE].filter((v): v is number => v != null && Number.isFinite(v))
  if (parts.length === 0) return null
  return parts.reduce((a, b) => a + b, 0)
}

function getGatewayRow(
  index: Map<string, { TOTAL?: number; CARPET?: number; HSF?: number; TILE?: number }>,
  districtFromPivot: string,
  week: number | null
): { TOTAL?: number; CARPET?: number; HSF?: number; TILE?: number } | undefined {
  if (week == null || !Number.isFinite(week)) return undefined
  const keys: string[] = []
  const norm = normalizeDistrictKey(districtFromPivot)
  if (norm) keys.push(`${norm}|${week}`)
  const raw = safeString(districtFromPivot).trim()
  if (raw) {
    const alt = `${raw}|${week}`
    if (!keys.includes(alt)) keys.push(alt)
  }
  for (const k of keys) {
    const row = index.get(k)
    if (row) return row
  }
  return undefined
}

/** Unique project counts by CARPET / HSF / TILE across all project types in the district */
function csvRollupByTrackerCat(byType: Map<string, Map<string, Set<string>>>): Record<TrackerCat, number> {
  const sets: Record<TrackerCat, Set<string>> = {
    CARPET: new Set(),
    HSF: new Set(),
    TILE: new Set(),
  }
  for (const byCat of Array.from(byType.values())) {
    for (const [label, projSet] of Array.from(byCat.entries())) {
      const t = mapProjectCategoryToTracker(label)
      if (!t) continue
      for (const p of Array.from(projSet)) sets[t].add(p)
    }
  }
  return {
    CARPET: sets.CARPET.size,
    HSF: sets.HSF.size,
    TILE: sets.TILE.size,
  }
}

type SalesRow = {
  dateSold?: string
  projectNumber?: string
  workroomType?: string
  storeName?: string
  customerName?: string
  projectType?: string
  projectCategory?: string
}

// Lowe's Q1 tracker week 1 aligns with the uploaded sales file period,
// which starts on 2026-02-01 (Sunday) for the current 2026 tracker.
const Q1_2026_START_UTC = Date.UTC(2026, 1, 1)
const Q1_2026_WEEK_COUNT = 13

function normalizeStoreName(input: string): string {
  return String(input || '')
    .toUpperCase()
    .replace(/’/g, "'")
    .replace(/&/g, 'AND')
    .replace(/'/g, '') // normalize LOWE'S vs LOWES
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeString(v: any): string {
  if (v == null) return ''
  return String(v).trim()
}

function parseSalesDate(input: string | undefined): Date | null {
  const raw = safeString(input)
  if (!raw) return null

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw)
    const parsed = XLSX.SSF.parse_date_code(serial)
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
    }
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch
    const year = yyyy.length === 2 ? 2000 + parseInt(yyyy, 10) : parseInt(yyyy, 10)
    return new Date(Date.UTC(year, parseInt(mm, 10) - 1, parseInt(dd, 10)))
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch
    return new Date(Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10)))
  }

  const fallback = new Date(raw)
  if (!Number.isNaN(fallback.getTime())) {
    return new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()))
  }

  return null
}

function getQ1WeekNumberFromSalesDate(dateSold: string | undefined): number | null {
  const parsed = parseSalesDate(dateSold)
  if (!parsed) return null

  const diffDays = Math.floor((parsed.getTime() - Q1_2026_START_UTC) / 86400000)
  if (diffDays < 0) return null

  const weekNumber = Math.floor(diffDays / 7) + 1
  if (weekNumber < 1 || weekNumber > Q1_2026_WEEK_COUNT) return null
  return weekNumber
}

function parseCsvViaXlsx(file: File): Promise<SalesRow[]> {
  return (async () => {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[]

    // Expected headers (from your CSV):
    // Date Sold, Project Number, Workroom Type, Store Name, Customer Name, ... Project Type, ... Project Category
    return rows.map((r) => ({
      dateSold: safeString(r['Date Sold'] ?? r['Date']),
      projectNumber: safeString(r['Project Number'] ?? r['Project'] ?? r['ProjectNumber']),
      workroomType: safeString(r['Workroom Type'] ?? r['Workroom']),
      storeName: safeString(r['Store Name'] ?? r['Store']),
      customerName: safeString(r['Customer Name'] ?? r['Customer']),
      projectType: safeString(r['Project Type'] ?? r['Type']),
      projectCategory: safeString(r['Project Category'] ?? r['Category']),
    }))
  })()
}

function parseCsvTextViaXlsx(csvText: string): SalesRow[] {
  const workbook = XLSX.read(csvText, { type: 'string' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[]

  return rows.map((r) => ({
    dateSold: safeString(r['Date Sold'] ?? r['Date']),
    projectNumber: safeString(r['Project Number'] ?? r['Project'] ?? r['ProjectNumber']),
    workroomType: safeString(r['Workroom Type'] ?? r['Workroom']),
    storeName: safeString(r['Store Name'] ?? r['Store']),
    customerName: safeString(r['Customer Name'] ?? r['Customer']),
    projectType: safeString(r['Project Type'] ?? r['Type']),
    projectCategory: safeString(r['Project Category'] ?? r['Category']),
  }))
}

export default function SalesLastWeekDistrictPivot(props: {
  storeForecasts: StoreForecastLike[]
  weeklyCounts?: WeeklyCountForVariance[]
  /** Q1 Goals file data — used for variance when Vendor Gateway actuals (`lowes_weekly_job_counts`) are empty */
  q1Goals?: Q1GoalForVariance[]
}) {
  const { user, isAdmin, isOwner } = useAuth()
  const canViewAdminSalesTools = isAdmin || isOwner
  const authEmail = user?.email || ''
  const { showNotification } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [csvSourceText, setCsvSourceText] = useState<string | null>(null)
  const [rows, setRows] = useState<SalesRow[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all')
  const [parseError, setParseError] = useState<string | null>(null)
  const [isLoadingFromServer, setIsLoadingFromServer] = useState(false)
  const [cloudLoading, setCloudLoading] = useState(true)
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null)
  const [hasCloudSnapshot, setHasCloudSnapshot] = useState(false)
  const [isSavingCloud, setIsSavingCloud] = useState(false)
  const [isClearingCloud, setIsClearingCloud] = useState(false)

  const defaultServerFileName = 'Sales Last Week_1_2026_2_23 (2).csv'

  const [fetchedWeeklyCounts, setFetchedWeeklyCounts] = useState<WeeklyCountForVariance[]>([])
  const [weeklyCountsFetchDone, setWeeklyCountsFetchDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/lowes-weekly-counts')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (Array.isArray(d?.counts)) setFetchedWeeklyCounts(d.counts as WeeklyCountForVariance[])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setWeeklyCountsFetchDone(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const weeklyCounts = useMemo(() => {
    const fromProps = props.weeklyCounts
    if (fromProps && fromProps.length > 0) return fromProps
    return fetchedWeeklyCounts
  }, [props.weeklyCounts, fetchedWeeklyCounts])

  const q1Goals = props.q1Goals || []

  /** Prefer comparing CSV output against Q1 plan when plan exists. */
  const comparisonSource: 'gateway' | 'plan' | 'none' =
    q1Goals.length > 0 ? 'plan' : weeklyCounts.length > 0 ? 'gateway' : 'none'

  const comparisonIndex = useMemo(() => {
    if (q1Goals.length > 0) return buildPlanIndexFromGoals(q1Goals)
    if (weeklyCounts.length > 0) return buildGatewayByDistrictWeek(weeklyCounts)
    return new Map<string, { TOTAL?: number; CARPET?: number; HSF?: number; TILE?: number }>()
  }, [weeklyCounts, q1Goals])

  const varianceWeekOptions = useMemo(() => {
    const weeks = new Set<number>()
    for (const g of q1Goals) {
      const w = parseInt(String(g.week_number), 10)
      if (Number.isFinite(w) && w >= 1 && w <= 52) weeks.add(w)
    }
    if (weeks.size === 0) {
      for (const c of weeklyCounts) {
        const w = parseInt(String(c.week_number), 10)
        if (Number.isFinite(w) && w >= 1 && w <= 52) weeks.add(w)
      }
    }
    return Array.from(weeks).sort((a, b) => a - b)
  }, [weeklyCounts, q1Goals])

  const defaultVarianceWeek = useMemo(() => {
    if (varianceWeekOptions.length === 0) return null
    return varianceWeekOptions[varianceWeekOptions.length - 1]
  }, [varianceWeekOptions])

  const [varianceWeekOverride, setVarianceWeekOverride] = useState<number | null>(null)
  const varianceWeek =
    varianceWeekOverride != null ? varianceWeekOverride : defaultVarianceWeek

  const hasWeeklyCounts = weeklyCounts.length > 0
  const hasQ1Goals = q1Goals.length > 0

  const filteredSalesRows = useMemo(() => {
    if (varianceWeek == null) return rows
    return rows.filter((row) => getQ1WeekNumberFromSalesDate(row.dateSold) === varianceWeek)
  }, [rows, varianceWeek])

  const salesRowsOutsideSelectedWeek = rows.length - filteredSalesRows.length

  const comparisonDistrictsForWeek = useMemo(() => {
    if (varianceWeek == null) return []

    const districts = new Set<string>()
    for (const key of Array.from(comparisonIndex.keys())) {
      const [district, week] = key.split('|')
      const parsedWeek = parseInt(week, 10)
      if (district && parsedWeek === varianceWeek) {
        districts.add(district)
      }
    }

    return Array.from(districts).sort((a, b) => {
      if (a === 'UNKNOWN') return 1
      if (b === 'UNKNOWN') return -1
      const na = parseInt(a, 10) || 0
      const nb = parseInt(b, 10) || 0
      return na - nb
    })
  }, [comparisonIndex, varianceWeek])

  useEffect(() => {
    let cancelled = false
    const loadCloud = async () => {
      setCloudLoading(true)
      try {
        const res = await fetch('/api/lowes-sales-last-week-cloud')
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          if (data?.error && typeof data.error === 'string') {
            console.warn('Sales Last Week cloud:', data.error)
          }
          setHasCloudSnapshot(false)
          return
        }
        const snap = data?.snapshot
        if (snap?.csvText && typeof snap.csvText === 'string') {
          try {
            const parsed = parseCsvTextViaXlsx(snap.csvText)
            setRows(parsed)
            setUploadedFileName(String(snap.fileName || 'cloud-snapshot.csv'))
            setCsvSourceText(snap.csvText)
            setSelectedDistrict('all')
            setParseError(null)
            setHasCloudSnapshot(true)
            if (snap.updatedAt) setCloudUpdatedAt(String(snap.updatedAt))
          } catch (e) {
            console.error('Failed to parse cloud CSV:', e)
            setHasCloudSnapshot(false)
          }
        } else {
          setHasCloudSnapshot(false)
        }
      } catch (e) {
        if (!cancelled) console.error('Failed to load Sales Last Week from cloud:', e)
      } finally {
        if (!cancelled) setCloudLoading(false)
      }
    }
    loadCloud()
    return () => {
      cancelled = true
    }
  }, [])

  const storeNameToStoreNumber = useMemo(() => {
    const m = new Map<string, string>()

    // Prefer the explicit store name mapping first (covers many stores even if location data is missing)
    for (const [storeNum, storeName] of Object.entries(storeNames)) {
      const key = normalizeStoreName(storeName)
      if (key && !m.has(key)) m.set(key, String(storeNum))
    }

    for (const s of storeLocations) {
      const key = normalizeStoreName(s.name)
      if (key && !m.has(key)) m.set(key, s.number)
    }
    return m
  }, [])

  const storeToDistrict = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of props.storeForecasts || []) {
      const store = safeString(f.store)
      const district = safeString(f.district)
      if (!store || !district) continue
      if (!m.has(store)) m.set(store, district)
    }
    return m
  }, [props.storeForecasts])

  const getDistrictForRow = (r: SalesRow): { district: string; storeNumber?: string } => {
    const csvDistrict = getDistrictFromCsvWorkroom(r.workroomType)
    const storeNameNorm = normalizeStoreName(r.storeName || '')
    let storeNumber = storeNameNorm ? storeNameToStoreNumber.get(storeNameNorm) : undefined

    // Fuzzy fallback: contains match (helps with apostrophe / punctuation inconsistencies)
    if (!storeNumber && storeNameNorm) {
      for (const [k, v] of Array.from(storeNameToStoreNumber.entries())) {
        if (k.includes(storeNameNorm) || storeNameNorm.includes(k)) {
          storeNumber = v
          break
        }
      }
    }

    if (csvDistrict) return { district: csvDistrict, storeNumber }

    if (storeNumber) {
      const district = storeToDistrict.get(storeNumber)
      if (district) return { district, storeNumber }
    }

    return { district: 'UNKNOWN', storeNumber }
  }

  const pivot = useMemo(() => {
    // district -> projectType -> projectCategory -> Set(projectNumber)
    const data = new Map<string, Map<string, Map<string, Set<string>>>>()
    let unknownDistrictCount = 0
    let unknownStoreCount = 0

    for (const r of filteredSalesRows) {
      const { district, storeNumber } = getDistrictForRow(r)
      if (district === 'UNKNOWN') unknownDistrictCount++
      if (!storeNumber) unknownStoreCount++

      const projectType = safeString(r.projectType) || 'UNKNOWN TYPE'
      const category = safeString(r.projectCategory) || 'UNKNOWN CATEGORY'
      const projectNumber =
        safeString(r.projectNumber) ||
        `${safeString(r.storeName)}|${safeString(r.customerName)}|${safeString(r.dateSold)}`

      if (!data.has(district)) data.set(district, new Map())
      const byType = data.get(district)!
      if (!byType.has(projectType)) byType.set(projectType, new Map())
      const byCat = byType.get(projectType)!
      if (!byCat.has(category)) byCat.set(category, new Set())
      byCat.get(category)!.add(projectNumber)
    }

    const districts = Array.from(data.keys()).sort((a, b) => {
      const na = parseInt(a) || 0
      const nb = parseInt(b) || 0
      if (a === 'UNKNOWN') return 1
      if (b === 'UNKNOWN') return -1
      return na - nb
    })

    return {
      data,
      districts,
      unknownDistrictCount,
      unknownStoreCount,
      totalRows: rows.length,
      filteredRows: filteredSalesRows.length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSalesRows, rows.length, storeNameToStoreNumber, storeToDistrict])

  const allVisibleDistricts = useMemo(() => {
    return Array.from(new Set([...pivot.districts, ...comparisonDistrictsForWeek])).sort((a, b) => {
      if (a === 'UNKNOWN') return 1
      if (b === 'UNKNOWN') return -1
      const na = parseInt(a, 10) || 0
      const nb = parseInt(b, 10) || 0
      return na - nb
    })
  }, [pivot.districts, comparisonDistrictsForWeek])

  const visibleDistricts = useMemo(() => {
    if (selectedDistrict === 'all') return allVisibleDistricts
    return allVisibleDistricts.filter((d) => d === selectedDistrict)
  }, [allVisibleDistricts, selectedDistrict])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    try {
      const text = await file.text()
      const parsed = parseCsvTextViaXlsx(text)
      setCsvSourceText(text)
      setRows(parsed)
      setUploadedFileName(file.name)
      setSelectedDistrict('all')
    } catch (err: any) {
      console.error('Failed to parse Sales Last Week CSV:', err)
      setParseError(err?.message || 'Failed to parse CSV')
      setRows([])
      setUploadedFileName(null)
      setCsvSourceText(null)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleLoadFromServer = async () => {
    setParseError(null)
    setIsLoadingFromServer(true)
    try {
      const res = await fetch(`/api/lowes-sales-last-week?name=${encodeURIComponent(defaultServerFileName)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load CSV from server')
      }
      const raw = String(data?.csvText || '')
      const parsed = parseCsvTextViaXlsx(raw)
      setCsvSourceText(raw)
      setRows(parsed)
      setUploadedFileName(defaultServerFileName)
      setSelectedDistrict('all')
    } catch (err: any) {
      console.error('Failed to load Sales Last Week CSV from server:', err)
      setParseError(err?.message || 'Failed to load CSV from server')
      setRows([])
      setUploadedFileName(null)
      setCsvSourceText(null)
    } finally {
      setIsLoadingFromServer(false)
    }
  }

  const handleSaveToCloud = async () => {
    if (!isAdmin || !uploadedFileName || !csvSourceText || rows.length === 0) return
    setIsSavingCloud(true)
    try {
      const res = await fetch('/api/lowes-sales-last-week-cloud', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authEmail}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: uploadedFileName, csvText: csvSourceText }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Save failed')
      }
      setHasCloudSnapshot(true)
      setCloudUpdatedAt(new Date().toISOString())
      showNotification('Sales Last Week file saved to cloud.', 'success')
    } catch (err: any) {
      showNotification(err?.message || 'Could not save to cloud', 'error')
    } finally {
      setIsSavingCloud(false)
    }
  }

  const handleClearCloudAndLocal = async () => {
    if (!isAdmin) return
    setIsClearingCloud(true)
    try {
      const res = await fetch('/api/lowes-sales-last-week-cloud', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authEmail}`,
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Clear failed')
      }
      setRows([])
      setUploadedFileName(null)
      setCsvSourceText(null)
      setParseError(null)
      setHasCloudSnapshot(false)
      setCloudUpdatedAt(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      showNotification('Sales Last Week cloud data cleared. Upload a new CSV when ready.', 'success')
    } catch (err: any) {
      showNotification(err?.message || 'Could not clear cloud data', 'error')
    } finally {
      setIsClearingCloud(false)
    }
  }

  const formatCount = (n: number) => n.toLocaleString()

  const varianceColorClass = (diff: number) =>
    diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-gray-700'

  const varianceBadgeClass = (diff: number) =>
    diff > 0
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : diff < 0
        ? 'bg-red-50 text-red-800 border-red-200'
        : 'bg-gray-50 text-gray-700 border-gray-200'

  /** diff = csvVal − comparison; pct null when comparison baseline is 0 */
  const varianceMetrics = (csvVal: number, cmpVal: number | null) => {
    if (cmpVal == null) return null
    const diff = csvVal - cmpVal
    const pct = cmpVal !== 0 ? (diff / cmpVal) * 100 : null
    return { diff, pct }
  }

  const formatSignedCount = (n: number) => {
    if (n === 0) return '0'
    const sign = n > 0 ? '+' : '−'
    return `${sign}${formatCount(Math.abs(n))}`
  }

  const renderVarianceSummaryCards = (
    csvVal: number,
    cmpVal: number | null,
    cmpKind: 'gateway' | 'plan'
  ) => {
    if (cmpVal == null) {
      return <span className="text-gray-400">—</span>
    }
    const m = varianceMetrics(csvVal, cmpVal)
    if (!m) return null
    const baselineWord = cmpKind === 'gateway' ? 'actual' : 'plan'

    return (
      <div className="mt-2 max-w-sm">
        <div className="rounded-md bg-gray-50/90 border border-gray-200/80 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
            Difference (file − {baselineWord})
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums ${varianceBadgeClass(
                m.diff
              )}`}
            >
              {formatSignedCount(m.diff)}
            </span>
            <span className="text-[11px] font-normal text-gray-500">
              {m.diff === 0
                ? '(same as comparison)'
                : m.diff > 0
                  ? '(higher than comparison)'
                  : '(lower than comparison)'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderDistrictSection = (district: string) => {
    const byType = pivot.data.get(district) || new Map<string, Map<string, Set<string>>>()

    const typeNames = Array.from(byType.keys()).sort()

    const districtTotal = typeNames.reduce((sum, t) => {
      const byCat = byType.get(t)!
      let tSum = 0
      for (const s of Array.from(byCat.values())) tSum += s.size
      return sum + tSum
    }, 0)

    const cmpRow =
      varianceWeek != null ? getGatewayRow(comparisonIndex, district, varianceWeek) : undefined
    const cmpDistrictTotal = getGatewayTotal(cmpRow)
    const rollup = csvRollupByTrackerCat(byType)
    const trackerCats: TrackerCat[] = ['CARPET', 'HSF', 'TILE']
    const showCategoryVariance =
      varianceWeek != null &&
      comparisonSource !== 'none' &&
      trackerCats.some(
        (t) =>
          rollup[t] > 0 ||
          (cmpRow != null && cmpRow[t] != null && Number.isFinite(cmpRow[t] as number))
      )

    const cmpLabel =
      comparisonSource === 'gateway'
        ? `Vendor Gateway Week ${varianceWeek} (TOTAL)`
        : `Q1 planned Week ${varianceWeek} (TOTAL)`
    const cmpColumnHeader = comparisonSource === 'gateway' ? 'Gateway' : 'Planned'
    const cmpKind = comparisonSource === 'gateway' ? 'gateway' : 'plan'

    return (
      <div key={district} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900">
              District {district}
              {getWorkroomsForDistrictAsString(district, ' / ')
                ? ` (${getWorkroomsForDistrictAsString(district, ' / ')})`
                : ''}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Lowes 2026 Total last week:{' '}
              <span className="font-semibold text-gray-900">{formatCount(districtTotal)}</span>
            </div>
            {varianceWeek != null && comparisonSource !== 'none' ? (
              <div className="text-xs text-gray-600 mt-2 space-y-2">
                <div>
                  <span className="font-medium text-gray-700">{cmpLabel}:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {cmpDistrictTotal != null ? formatCount(cmpDistrictTotal) : '—'}
                  </span>
                  {cmpDistrictTotal == null ? (
                    <span className="text-gray-400">
                      {' '}
                      — no {comparisonSource === 'gateway' ? 'gateway' : 'goals'} row for this district/week
                    </span>
                  ) : null}
                </div>
                {cmpDistrictTotal != null
                  ? renderVarianceSummaryCards(districtTotal, cmpDistrictTotal, cmpKind)
                  : null}
                {showCategoryVariance ? (
                  <div className="mt-2 rounded-md border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                      By category — sales file vs {comparisonSource === 'gateway' ? 'gateway' : 'Q1 plan'}
                    </div>
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-white">
                          <th className="text-left font-medium text-gray-600 px-3 py-1.5">Category</th>
                          <th className="text-right font-medium text-gray-600 px-3 py-1.5">Sales file</th>
                          <th className="text-right font-medium text-gray-600 px-3 py-1.5">{cmpColumnHeader}</th>
                          <th
                            className="text-right font-medium text-gray-600 px-3 py-1.5"
                            title="Sales file count minus the comparison column"
                          >
                            Difference
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {trackerCats.map((t) => {
                          const cmpv = cmpRow?.[t]
                          const cmpNum = cmpv != null && Number.isFinite(cmpv) ? cmpv : null
                          const csvN = rollup[t]
                          if (cmpNum == null && csvN === 0) return null
                          const vm = varianceMetrics(csvN, cmpNum)
                          return (
                            <tr key={t} className="border-b border-gray-50">
                              <td className="px-3 py-1.5 text-gray-800">{t}</td>
                              <td className="px-3 py-1.5 text-right font-medium text-gray-900 tabular-nums">
                                {formatCount(csvN)}
                              </td>
                              <td className="px-3 py-1.5 text-right text-gray-700 tabular-nums">
                                {cmpNum != null ? formatCount(cmpNum) : '—'}
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums">
                                {vm == null ? (
                                  <span className="text-gray-400">—</span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center rounded-md border px-2 py-0.5 font-medium ${varianceBadgeClass(
                                      vm.diff
                                    )}`}
                                  >
                                    {formatSignedCount(vm.diff)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td className="px-3 py-1.5 text-gray-900 font-semibold">TOTAL</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-gray-900 tabular-nums">
                            {formatCount(districtTotal)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold text-gray-800 tabular-nums">
                            {cmpDistrictTotal != null ? formatCount(cmpDistrictTotal) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {cmpDistrictTotal == null ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 font-semibold ${varianceBadgeClass(
                                  districtTotal - cmpDistrictTotal
                                )}`}
                              >
                                {formatSignedCount(districtTotal - cmpDistrictTotal)}
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {typeNames.length > 0 ? (
            typeNames.map((typeName) => {
              const byCat = byType.get(typeName)!
              const categories = Array.from(byCat.keys()).sort()
              const typeTotal = categories.reduce((sum, c) => sum + (byCat.get(c)?.size || 0), 0)
              const typeNameNorm = safeString(typeName).toUpperCase().replace(/\s+/g, ' ').trim()
              const isWorkOrder = typeNameNorm === 'WORK ORDER' || typeNameNorm === 'WORKORDER'

              return (
                <div key={typeName} className="border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    {isWorkOrder ? (
                      <div className="w-full flex items-center justify-end">
                        <div className="text-sm font-bold text-gray-900">{formatCount(typeTotal)}</div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-gray-900">{typeName}</div>
                        <div className="text-sm font-bold text-gray-900">{formatCount(typeTotal)}</div>
                      </>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                      <div key={cat} className="px-4 py-2 flex items-center justify-between">
                        <div className="text-xs text-gray-700">{cat}</div>
                        <div className="text-xs font-semibold text-gray-900">
                          {formatCount(byCat.get(cat)!.size)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="md:col-span-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              No sales-file rows matched district {district} for week {varianceWeek ?? 'the selected week'}. Plan and
              actual comparison still appears above.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-gray-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Sales Last Week (by District)</h3>
          </div>
        </div>
        {canViewAdminSalesTools && uploadedFileName ? <CheckCircle2 size={16} className="text-green-600" /> : null}
      </div>

      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
        {isAdmin ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleUpload}
              className="hidden"
              id="sales-last-week-upload"
            />
            <label
              htmlFor="sales-last-week-upload"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] cursor-pointer transition-colors text-sm font-medium"
            >
              <Upload size={16} />
              Choose CSV
            </label>

            <button
              type="button"
              onClick={handleLoadFromServer}
              disabled={isLoadingFromServer}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Dev convenience: loads the CSV if it exists beside the `fis/` folder"
            >
              {isLoadingFromServer ? 'Loading…' : 'Load from Project File'}
            </button>
          </>
        ) : canViewAdminSalesTools ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Read Only
          </div>
        ) : null}

        {isAdmin && (rows.length > 0 || hasCloudSnapshot) ? (
          <>
            <button
              type="button"
              onClick={handleSaveToCloud}
              disabled={
                isSavingCloud ||
                isClearingCloud ||
                !csvSourceText ||
                rows.length === 0 ||
                !uploadedFileName
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#89ac44] text-[#5a7230] rounded-md hover:bg-[#89ac44]/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Store this CSV in the shared cloud copy for all users"
            >
              {isSavingCloud ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Cloud size={16} />
                  Save to cloud
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClearCloudAndLocal}
              disabled={isClearingCloud || isSavingCloud}
              className="inline-flex items-center justify-center gap-2 px-2 py-2 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Remove the cloud copy and clear this section (upload again next week)"
            >
              {isClearingCloud ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Clearing…
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  Clear
                </>
              )}
            </button>
          </>
        ) : null}

        {cloudLoading ? (
          <span className="text-xs text-gray-500">{canViewAdminSalesTools ? 'Loading cloud copy…' : 'Loading…'}</span>
        ) : null}

        {canViewAdminSalesTools && uploadedFileName ? (
          <div className="text-xs text-gray-700">
            Loaded: <span className="font-semibold">{uploadedFileName}</span> ({formatCount(pivot.totalRows)} rows)
            {varianceWeek != null ? (
              <span className="block text-gray-500 mt-0.5">
                Showing {formatCount(pivot.filteredRows)} rows from sales week {varianceWeek}
                {salesRowsOutsideSelectedWeek > 0 ? ` (${formatCount(salesRowsOutsideSelectedWeek)} rows excluded)` : ''}
              </span>
            ) : null}
            {hasCloudSnapshot && cloudUpdatedAt ? (
              <span className="block text-gray-500 mt-0.5">
                Cloud: {new Date(cloudUpdatedAt).toLocaleString()}
              </span>
            ) : null}
          </div>
        ) : !canViewAdminSalesTools && rows.length > 0 ? (
          <div className="text-xs text-gray-600">
            {formatCount(pivot.filteredRows)} projects in roll-up
          </div>
        ) : null}
      </div>

      {parseError && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5" />
            <div>
              <div className="font-semibold">Couldn’t read that CSV</div>
              <div className="mt-1">{parseError}</div>
            </div>
          </div>
        </div>
      )}

      {!canViewAdminSalesTools && !cloudLoading && rows.length === 0 && !parseError ? (
        <p className="mt-3 text-xs text-gray-500">No sales roll-up has been published yet.</p>
      ) : null}

      {rows.length > 0 && (
        <>
          {varianceWeek != null && pivot.filteredRows === 0 ? (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-900">
              No `Sales Last Week` rows matched Q1 week {varianceWeek} in this CSV. Sales values below are shown as `0`,
              while plan/actual comparison still remains visible for that week.
            </div>
          ) : null}

          {weeklyCountsFetchDone && !hasWeeklyCounts && !hasQ1Goals ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
              <span className="font-semibold">Variance needs Q1 data.</span> Uploading{' '}
              <span className="font-medium">Q1 Goals</span> only saves plans to{' '}
              <code className="rounded bg-amber-100/80 px-1 py-0.5 text-[10px]">lowes_q1_goals</code>. Actual job
              counts live in{' '}
              <code className="rounded bg-amber-100/80 px-1 py-0.5 text-[10px]">lowes_weekly_job_counts</code> (Vendor
              Gateway or manual POST). There are no goal rows and no gateway rows to compare yet — upload the Goals file
              and/or load actuals.
            </div>
          ) : null}

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-gray-700">
              {pivot.unknownDistrictCount > 0 || pivot.unknownStoreCount > 0 ? (
                <span>
                  Note: <span className="font-semibold">{formatCount(pivot.unknownDistrictCount)}</span> rows couldn’t
                  be mapped to a district
                  {pivot.unknownStoreCount > 0 ? (
                    <>
                      {' '}
                      (and <span className="font-semibold">{formatCount(pivot.unknownStoreCount)}</span> store names
                      didn’t match our store list)
                    </>
                  ) : null}
                  .
                </span>
              ) : (
                <span>All rows mapped to a district successfully.</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">District:</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
                >
                  <option value="all">All Districts</option>
                  {allVisibleDistricts.map((d) => (
                    <option key={d} value={d}>
                      District {d}
                    </option>
                  ))}
                </select>
              </div>
              {varianceWeekOptions.length > 0 ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    {comparisonSource === 'gateway' ? 'Variance vs Gateway week:' : 'Variance vs Q1 plan week:'}
                  </label>
                  <select
                    value={varianceWeek ?? varianceWeekOptions[varianceWeekOptions.length - 1]}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      setVarianceWeekOverride(Number.isFinite(v) ? v : null)
                    }}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
                  >
                    {varianceWeekOptions.map((w) => (
                      <option key={w} value={w}>
                        Week {w}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-4">{visibleDistricts.map(renderDistrictSection)}</div>
        </>
      )}
    </div>
  )
}

