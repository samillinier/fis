'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  clearJobsOverride,
  loadJobsOverride,
  parseDate,
  parseJobsWorkbook,
  saveJobsOverride,
  type JobRecord,
} from '@/lib/jobsData'
import { Upload, Trash2, FileSpreadsheet, Search, X, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 50
const SEED_URL = '/data/jobsSeed.json'

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Scheduled: { bg: '#dbeafe', fg: '#1d4ed8' },
  'Ready To Schedule': { bg: '#fef3c7', fg: '#b45309' },
  'Work Complete': { bg: '#dcfce7', fg: '#15803d' },
  Closed: { bg: '#e5e7eb', fg: '#4b5563' },
  'Closed By Admin': { bg: '#f3f4f6', fg: '#6b7280' },
  Refunded: { bg: '#fee2e2', fg: '#b91c1c' },
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatInt(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function startOfWeek(ts: number): number {
  const d = new Date(ts)
  const diff = (d.getDay() + 6) % 7 // days since Monday
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff).getTime()
}

function startOfMonth(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatWeekLabel(ts: number): string {
  return `Week of ${new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function formatMonthLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || { bg: '#e5e7eb', fg: '#4b5563' }
  return (
    <span
      className="badge-pill"
      style={{ background: color.bg, color: color.fg, fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
    >
      {status}
    </span>
  )
}

function LeadSafeBadge({ value }: { value: string }) {
  const needs = value.toLowerCase() === 'needs assessment'
  return (
    <span
      className="badge-pill"
      style={
        needs
          ? { background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', padding: '0.2rem 0.5rem' }
          : { background: '#e5e7eb', color: '#4b5563', fontSize: '0.7rem', padding: '0.2rem 0.5rem' }
      }
    >
      {value || '—'}
    </span>
  )
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-2 text-sm bg-white"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function JobsView() {
  const [records, setRecords] = useState<JobRecord[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadedAt, setUploadedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [storeLocation, setStoreLocation] = useState('all')
  const [district, setDistrict] = useState('all')
  const [crewLead, setCrewLead] = useState('all')
  const [leadSafe, setLeadSafe] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<JobRecord | null>(null)
  const [expandedWeekly, setExpandedWeekly] = useState<Set<number>>(new Set())
  const [expandedMonthly, setExpandedMonthly] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const override = await loadJobsOverride()
        if (override.records && override.records.length > 0) {
          if (!cancelled) {
            setRecords(override.records)
            setFileName(override.fileName)
            setUploadedAt(override.uploadedAt)
          }
        } else {
          const res = await fetch(SEED_URL)
          if (!res.ok) throw new Error('Failed to load jobs data')
          const data = (await res.json()) as JobRecord[]
          if (!cancelled) {
            setRecords(Array.isArray(data) ? data : [])
            setFileName(null)
            setUploadedAt(null)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load jobs data')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(() => {
    const uniq = (key: (r: JobRecord) => string) =>
      Array.from(new Set(records.map(key).filter(Boolean))).sort()
    return {
      statuses: uniq((r) => r.jobStatus),
      categories: uniq((r) => r.laborCategory),
      storeLocations: uniq((r) => r.storeLocation),
      districts: uniq((r) => r.district),
      crewLeads: uniq((r) => r.crewLead),
      leadSafe: uniq((r) => r.leadSafePractices),
    }
  }, [records])

  const dateTs = useMemo(() => {
    const map = new Map<string, number>()
    records.forEach((r) => map.set(r.id, parseDate(r.createdOn)))
    return map
  }, [records])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null
    return records.filter((r) => {
      if (status !== 'all' && r.jobStatus !== status) return false
      if (category !== 'all' && r.laborCategory !== category) return false
      if (storeLocation !== 'all' && r.storeLocation !== storeLocation) return false
      if (district !== 'all' && r.district !== district) return false
      if (crewLead !== 'all' && r.crewLead !== crewLead) return false
      if (leadSafe !== 'all' && r.leadSafePractices !== leadSafe) return false
      const ts = dateTs.get(r.id) || 0
      if (fromTs != null && ts < fromTs) return false
      if (toTs != null && ts > toTs) return false
      if (q) {
        const hay = [
          r.id,
          r.firstName,
          r.lastName,
          r.laborCategory,
          r.jobStatus,
          r.customerPhone,
          r.customerAddress,
          r.customerEmail,
          r.crewLead,
          r.store,
          r.storeLocation,
          r.leadSafePractices,
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [records, search, status, category, storeLocation, district, crewLead, leadSafe, dateFrom, dateTo, dateTs])

  useEffect(() => {
    setPage(0)
  }, [search, status, category, storeLocation, district, crewLead, leadSafe, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage]
  )

  const kpis = useMemo(() => {
    const count = filtered.length
    const sumLabor = filtered.reduce((s, r) => s + (r.laborAmount || 0), 0)
    const byStatus = (s: string) => filtered.filter((r) => r.jobStatus === s).length
    return {
      total: count,
      scheduled: byStatus('Scheduled'),
      ready: byStatus('Ready To Schedule'),
      workComplete: byStatus('Work Complete'),
      sumLabor,
      stores: new Set(filtered.map((r) => r.store)).size,
    }
  }, [filtered])

  const weekly = useMemo(() => {
    const map = new Map<number, JobRecord[]>()
    filtered.forEach((r) => {
      const ts = dateTs.get(r.id) || 0
      if (!ts) return
      const key = startOfWeek(ts)
      const arr = map.get(key) || []
      arr.push(r)
      map.set(key, arr)
    })
    return Array.from(map.entries())
      .map(([ts, records]) => ({
        ts,
        jobs: records.length,
        labor: records.reduce((s, r) => s + (r.laborAmount || 0), 0),
        scheduled: records.filter((r) => r.jobStatus === 'Scheduled').length,
        ready: records.filter((r) => r.jobStatus === 'Ready To Schedule').length,
        complete: records.filter((r) => r.jobStatus === 'Work Complete').length,
        closed: records.filter((r) => r.jobStatus === 'Closed' || r.jobStatus === 'Closed By Admin').length,
        records,
      }))
      .sort((a, b) => b.ts - a.ts)
  }, [filtered, dateTs])

  const monthly = useMemo(() => {
    const map = new Map<number, JobRecord[]>()
    filtered.forEach((r) => {
      const ts = dateTs.get(r.id) || 0
      if (!ts) return
      const key = startOfMonth(ts)
      const arr = map.get(key) || []
      arr.push(r)
      map.set(key, arr)
    })
    return Array.from(map.entries())
      .map(([ts, records]) => ({
        ts,
        jobs: records.length,
        labor: records.reduce((s, r) => s + (r.laborAmount || 0), 0),
        scheduled: records.filter((r) => r.jobStatus === 'Scheduled').length,
        ready: records.filter((r) => r.jobStatus === 'Ready To Schedule').length,
        complete: records.filter((r) => r.jobStatus === 'Work Complete').length,
        closed: records.filter((r) => r.jobStatus === 'Closed' || r.jobStatus === 'Closed By Admin').length,
        records,
      }))
      .sort((a, b) => b.ts - a.ts)
  }, [filtered, dateTs])

  const hasFilters =
    search !== '' ||
    status !== 'all' ||
    category !== 'all' ||
    storeLocation !== 'all' ||
    district !== 'all' ||
    crewLead !== 'all' ||
    leadSafe !== 'all' ||
    dateFrom !== '' ||
    dateTo !== ''

  const resetFilters = () => {
    setSearch('')
    setStatus('all')
    setCategory('all')
    setStoreLocation('all')
    setDistrict('all')
    setCrewLead('all')
    setLeadSafe('all')
    setDateFrom('')
    setDateTo('')
  }

  const applyDatePreset = (preset: 'today' | 'week' | 'month' | '30d') => {
    const now = new Date()
    const to = new Date(now)
    let from: Date
    if (preset === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (preset === 'week') {
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      from = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
    } else if (preset === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      from = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
      from = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    }
    setDateFrom(toDateInput(from))
    setDateTo(toDateInput(to))
  }

  const toggleWeek = (ts: number) => {
    setExpandedWeekly((prev) => {
      const next = new Set(prev)
      if (next.has(ts)) next.delete(ts)
      else next.add(ts)
      return next
    })
  }

  const toggleMonth = (ts: number) => {
    setExpandedMonthly((prev) => {
      const next = new Set(prev)
      if (next.has(ts)) next.delete(ts)
      else next.add(ts)
      return next
    })
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseJobsWorkbook(buffer)
      await saveJobsOverride(parsed, file.name)
      setRecords(parsed)
      setFileName(file.name)
      setUploadedAt(new Date().toISOString())
      resetFilters()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClear = async () => {
    await clearJobsOverride()
    setRecords([])
    setFileName(null)
    setUploadedAt(null)
    setError(null)
    resetFilters()
    // Reload seed data
    fetch(SEED_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to reload'))))
      .then((data: JobRecord[]) => setRecords(Array.isArray(data) ? data : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to reload jobs data'))
  }

  const start = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1
  const end = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)
  const hasUpload = Boolean(fileName || uploadedAt)

  if (isLoading) {
    return (
      <section className="compact-section">
        <div className="compact-chart-container" style={{ minHeight: '300px', padding: '1rem' }}>
          <div
            style={{
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Loading jobs…
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header / actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job</h1>
          <p className="text-sm text-gray-500">
            Job export viewer — filter and search all jobs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasUpload && (
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-600">
              <FileSpreadsheet size={14} />
              <span className="font-medium text-gray-800 max-w-[180px] truncate">
                {fileName || 'Uploaded'}
              </span>
              {uploadedAt && (
                <span className="text-gray-400">{new Date(uploadedAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
          {!hasUpload && records.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-500">
              <FileSpreadsheet size={14} />
              <span>Seed export</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUpload(file)
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <Upload size={16} />
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
          {hasUpload && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              title="Remove the uploaded file and revert to the default seed data"
            >
              <Trash2 size={16} />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <section className="compact-section" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="compact-section-title" style={{ marginBottom: 0 }}>
              Filters
            </h3>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email, ID, address, crew lead…"
              className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                From
              </span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm bg-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                To
              </span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm bg-white"
              />
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['Today', 'today'],
                  ['This Week', 'week'],
                  ['This Month', 'month'],
                  ['Last 30 Days', '30d'],
                ] as const
              ).map(([label, preset]) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyDatePreset(preset)}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <SelectFilter label="Job Status" value={status} onChange={setStatus} options={options.statuses} />
            <SelectFilter label="Labor Category" value={category} onChange={setCategory} options={options.categories} />
            <SelectFilter label="Store Location" value={storeLocation} onChange={setStoreLocation} options={options.storeLocations} />
            <SelectFilter label="District" value={district} onChange={setDistrict} options={options.districts} />
            <SelectFilter label="Crew Lead" value={crewLead} onChange={setCrewLead} options={options.crewLeads} />
            <SelectFilter label="Lead Safe" value={leadSafe} onChange={setLeadSafe} options={options.leadSafe} />
          </div>
        </div>
      </section>

      {/* KPI summary */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <Kpi label="Total Jobs" value={formatInt(kpis.total)} />
          <Kpi label="Scheduled" value={formatInt(kpis.scheduled)} />
          <Kpi label="Ready To Schedule" value={formatInt(kpis.ready)} />
          <Kpi label="Work Complete" value={formatInt(kpis.workComplete)} />
          <Kpi label="Stores" value={formatInt(kpis.stores)} />
          <Kpi label="Total Labor" value={formatCurrency(kpis.sumLabor)} />
        </div>
      </section>

      {/* Table */}
      <section className="compact-section">
        <div className="compact-section-header">
          <h3 className="compact-section-title">Jobs</h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatInt(filtered.length)} job{filtered.length === 1 ? '' : 's'} · click any row for
            full details
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="compact-chart-container" style={{ minHeight: '220px', padding: '1rem' }}>
            <div
              style={{
                height: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              No jobs match the current filters.
            </div>
          </div>
        ) : (
          <>
            <div className="compact-table-container" style={{ marginTop: 0 }}>
              <div className="overflow-x-auto">
                <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>ID</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Customer</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor Category</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Status</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Store</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>District</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Crew Lead</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Lead Safe</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Created On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr
                        key={r.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelected(r)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = ''
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          {r.id}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                            {[r.firstName, r.lastName].filter(Boolean).join(' ')}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                            {r.customerPhone}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem' }}>{r.laborCategory}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <StatusBadge status={r.jobStatus} />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{r.store}</div>
                          <div style={{ fontSize: '0.65rem', color: '#6b7280', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.storeLocation}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          {r.district}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                          {r.crewLead || <span style={{ color: '#9ca3af' }}>—</span>}
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatCurrency(r.laborAmount || 0)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <LeadSafeBadge value={r.leadSafePractices} />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {r.createdOn}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
              <div className="text-xs text-gray-500">
                Showing {formatInt(start)}–{formatInt(end)} of {formatInt(filtered.length)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {safePage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Weekly & Monthly rollups */}
      <div className="analytics-grid-container">
        <section className="compact-section">
          <div className="compact-section-header">
            <h3 className="compact-section-title">Weekly Jobs</h3>
            <p className="text-xs text-gray-500 mt-1">
              Jobs grouped by week · click a row to see individual jobs
            </p>
          </div>
          {weekly.length === 0 ? (
            <div
              style={{
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              No jobs in range.
            </div>
          ) : (
            <div className="compact-table-container" style={{ marginTop: 0 }}>
              <div className="overflow-x-auto" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Week</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Jobs</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Sched</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Ready</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Done</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekly.map((w) => {
                      const expanded = expandedWeekly.has(w.ts)
                      return (
                        <RollupRow
                          key={w.ts}
                          expanded={expanded}
                          onToggle={() => toggleWeek(w.ts)}
                          label={formatWeekLabel(w.ts)}
                          jobs={w.jobs}
                          scheduled={w.scheduled}
                          ready={w.ready}
                          complete={w.complete}
                          labor={w.labor}
                          records={w.records}
                          onSelect={setSelected}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="compact-section">
          <div className="compact-section-header">
            <h3 className="compact-section-title">Monthly Jobs</h3>
            <p className="text-xs text-gray-500 mt-1">
              Jobs grouped by month · click a row to see individual jobs
            </p>
          </div>
          {monthly.length === 0 ? (
            <div
              style={{
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              No jobs in range.
            </div>
          ) : (
            <div className="compact-table-container" style={{ marginTop: 0 }}>
              <div className="overflow-x-auto" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Month</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Jobs</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Sched</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Ready</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Done</th>
                      <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => {
                      const expanded = expandedMonthly.has(m.ts)
                      return (
                        <RollupRow
                          key={m.ts}
                          expanded={expanded}
                          onToggle={() => toggleMonth(m.ts)}
                          label={formatMonthLabel(m.ts)}
                          jobs={m.jobs}
                          scheduled={m.scheduled}
                          ready={m.ready}
                          complete={m.complete}
                          labor={m.labor}
                          records={m.records}
                          onSelect={setSelected}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {selected && <JobDetailModal job={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function RollupRow({
  expanded,
  onToggle,
  label,
  jobs,
  scheduled,
  ready,
  complete,
  labor,
  records,
  onSelect,
}: {
  expanded: boolean
  onToggle: () => void
  label: string
  jobs: number
  scheduled: number
  ready: number
  complete: number
  labor: number
  records: JobRecord[]
  onSelect: (job: JobRecord) => void
}) {
  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={onToggle}>
        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {label}
          </span>
        </td>
        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
          {formatInt(jobs)}
        </td>
        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
          <span className="badge-pill" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
            {formatInt(scheduled)}
          </span>
        </td>
        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
          <span className="badge-pill" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
            {formatInt(ready)}
          </span>
        </td>
        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
          <span className="badge-pill" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
            {formatInt(complete)}
          </span>
        </td>
        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {formatCurrency(labor)}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0, background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ padding: '0.5rem 0.75rem' }}>
              <table className="professional-table" style={{ fontSize: '0.72rem', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#eef2f7' }}>
                    <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: '#374151' }}>ID</th>
                    <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: '#374151' }}>Customer</th>
                    <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: '#374151' }}>Category</th>
                    <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: '#374151' }}>Status</th>
                    <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: '#374151' }}>Crew Lead</th>
                    <th align="right" style={{ padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: '#374151' }}>Labor</th>
                    <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: '#374151' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(r)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.72rem', color: '#6b7280' }}>{r.id}</td>
                      <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                        {[r.firstName, r.lastName].filter(Boolean).join(' ')}
                      </td>
                      <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.68rem' }}>{r.laborCategory}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }}>
                        <StatusBadge status={r.jobStatus} />
                      </td>
                      <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.72rem' }}>
                        {r.crewLead || <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                      <td align="right" style={{ padding: '0.4rem 0.5rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(r.laborAmount || 0)}
                      </td>
                      <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.68rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {r.createdOn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function JobDetailModal({ job, onClose }: { job: JobRecord; onClose: () => void }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Job ID', value: job.id },
    { label: 'Job Type', value: job.jobType },
    { label: 'Customer', value: [job.firstName, job.lastName].filter(Boolean).join(' ') },
    { label: 'Labor Category', value: job.laborCategory },
    { label: 'Job Status', value: job.jobStatus },
    { label: 'Customer Phone', value: job.customerPhone },
    { label: 'Customer Email', value: job.customerEmail },
    { label: 'Customer Address', value: job.customerAddress },
    { label: 'Store', value: job.store },
    { label: 'Store Location', value: job.storeLocation },
    { label: 'District', value: job.district },
    { label: 'Crew Lead', value: job.crewLead },
    { label: 'Labor Amount', value: formatCurrency(job.laborAmount || 0) },
    { label: 'Lead Safe Practices', value: job.leadSafePractices },
    { label: 'Created On', value: job.createdOn },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.35)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 640,
          width: '100%',
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>JOB {job.id}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              {[job.firstName, job.lastName].filter(Boolean).join(' ')}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.25rem', display: 'grid', gap: '0.5rem' }}>
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: '0.75rem',
                alignItems: 'start',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>{row.label}</div>
              <div style={{ fontSize: '0.875rem', color: '#111827', wordBreak: 'break-word' }}>
                {row.value || <span style={{ color: '#9ca3af' }}>—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
