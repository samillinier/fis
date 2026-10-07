'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { DollarSign, Store, FileSpreadsheet, TrendingUp, Wallet, Layers, ChevronDown, ChevronRight } from 'lucide-react'
import budgetData from '@/lib/budget-data.json'
import skuData from '@/lib/sku-data.json'

const CATEGORIES = ['Carpet', 'Tile', 'Vinyl', 'Hardwood/Laminate', 'Backsplash'] as const

const SKU_STREAM_ORDER = ['install', 'removal', 'furniture', 'detail', 'pad', 'ancillary', 'adjustment', 'other'] as const
const SKU_STREAM_LABEL: Record<string, string> = {
  install: 'Install',
  removal: 'Removal',
  furniture: 'Furniture',
  detail: 'Detail',
  pad: 'Pad / Materials',
  ancillary: 'Ancillary',
  adjustment: 'Adjustments',
  other: 'Other',
}

const CAT_COLORS: Record<string, string> = {
  Carpet: '#89ac44',
  Tile: '#eab308',
  Vinyl: '#6d8a35',
  'Hardwood/Laminate': '#f59e0b',
  Backsplash: '#a5c266',
}

// Revenue stream colors (distinct hues)
const STREAM_COLORS: Record<string, string> = {
  Install: '#89ac44',
  Removal: '#eab308',
  Furniture: '#b45309',
  Ancillary: '#0d9488',
  Detail: '#14532d',
}

// Global (non-store) assumptions that remain editable
type Params = {
  avgJob: Record<string, string>
  removalPct: Record<string, string>
  furnitureRooms: Record<string, string>
  ancillaryPct: Record<string, string>
  ancillaryRate: Record<string, string>
  installLabor: Record<string, string>
  removalLabor: Record<string, string>
  furnitureLabor: Record<string, string>
  ancillaryLabor: Record<string, string>
}

const d: any = budgetData

// Detail payout ($/detail) for EXISTING workrooms, from South BID V2.0 "Current Labor" (Assessment pay).
// These are read-only references — they are not part of the 5 new Florida workrooms in this budget.
const EXISTING_DETAIL_PAY: Record<string, string> = {
  Naples: '30',
  Sarasota: '30',
  Lodi: '40',
  Reno: '40',
  'San Jose': '40',
  SLO: '40',
  Utah: '35',
  'West Virginia': '35',
}

function num(v: string | number | undefined | null): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0
  const n = parseFloat(v as string)
  return isFinite(n) ? n : 0
}
function money(n: number): string {
  const v = Math.round(n)
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M'
  if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K'
  return '$' + v.toLocaleString()
}
function nf(n: number): string {
  const v = Math.round(n)
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toLocaleString()
}
function count(n: number): string {
  return Math.round(n).toLocaleString()
}
function fmtRate(n: number): string {
  if (n === Math.round(n)) return String(Math.round(n))
  return n.toFixed(2)
}
// SKU line item with per-SKU grand totals from the SKU report
type SkuLine = {
  sku: string
  desc: string
  count?: number
  cost?: number
  payment?: number
  margin?: number
  pct?: number
}
// Count values can be fractional (e.g. linear feet), so keep decimals when non-integer.
function skuCount(n?: number): string {
  if (n === undefined || n === null || !isFinite(n)) return '—'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}
function skuMoney(n?: number): string {
  if (n === undefined || n === null || !isFinite(n)) return '—'
  const v = Math.round(n)
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M'
  if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K'
  return '$' + v.toLocaleString()
}
function skuMarginPct(margin?: number, cost?: number): string {
  if (margin === undefined || margin === null || !isFinite(margin)) return '—'
  if (!cost || !isFinite(cost)) return '—'
  return ((margin / cost) * 100).toFixed(1) + '%'
}

function defaultParams(): Params {
  return {
    avgJob: Object.fromEntries(CATEGORIES.map((c) => [c, String(d.avgJobSize[c] ?? '')])),
    removalPct: Object.fromEntries(
      CATEGORIES.map((c) => [c, String(Math.round((d.removalPct[c] ?? 0) * 1000) / 10)])
    ),
    furnitureRooms: Object.fromEntries(CATEGORIES.map((c) => [c, String(d.furnitureRoomsPerJob?.[c] ?? '0')])),
    ancillaryPct: Object.fromEntries(CATEGORIES.map((c) => [c, '0'])),
    ancillaryRate: Object.fromEntries(CATEGORIES.map((c) => [c, String(d.pricing.ancillary?.[c] ?? '')])),
    installLabor: Object.fromEntries(CATEGORIES.map((c) => [c, String(d.labor.install[c] ?? '')])),
    removalLabor: Object.fromEntries(CATEGORIES.map((c) => [c, String(d.labor.removal[c] ?? '')])),
    furnitureLabor: Object.fromEntries(CATEGORIES.map((c) => [c, String(d.labor.furniture[c] ?? '')])),
    ancillaryLabor: Object.fromEntries(CATEGORIES.map((c) => [c, String(d.labor.ancillary?.[c] ?? '')])),
  }
}

const histByStore: Record<number, Record<string, any>> = {}
d.historical.forEach((h: any) => {
  ;(histByStore[h.Location] = histByStore[h.Location] || {})[h.cat] = h
})

type Status = 'verified' | 'old' | 'pending'

const STATUS_STYLES: Record<Status, string> = {
  verified: 'bg-[#e7f3d8] text-[#4a5d24] border-[#bcd49a]',
  old: 'bg-amber-100 text-amber-800 border-amber-300',
  pending: 'bg-orange-100 text-orange-800 border-orange-300',
}

function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  )
}

// Toggle to hide/show the "Data verification status" section (hidden for now).
const SHOW_DATA_STATUS = false

const DATA_STATUS: { label: string; detail: string; status: Status }[] = [
  { label: 'FY26 RFP revenue rates', detail: 'Install · removal · furniture · detail, per store', status: 'verified' },
  { label: 'Detail revenue ($54/detail)', detail: 'From FY26 RFP, all categories', status: 'verified' },
  { label: 'Furniture mix (rooms/job)', detail: 'Derived from SKU Sales By Store (South BID)', status: 'verified' },
  { label: 'Installer payout rates', detail: 'South BID V2.0 — Jacksonville labor (proxy for new workrooms)', status: 'verified' },
  { label: 'Detail payout', detail: 'South BID "Assessment" pay — per workroom ($30–$40), new workrooms pending', status: 'pending' },
  { label: 'Ancillary', detail: 'Included as % of sqft × $/sqft — rate & mix still 0, needs boss input', status: 'pending' },
]

// store-level revenue rates from FY26 RFP (fall back to flat pricing)
function storeRate(store: number, cat: string, stream: string): number {
  const sr = d.storeRates?.[String(store)]?.[cat]
  if (sr && sr[stream] != null && num(sr[stream]) !== 0) return num(sr[stream])
  return num(d.pricing[stream]?.[cat])
}

export default function Budget() {
  const [assign, setAssign] = useState<Record<string, string>>(() =>
    Object.fromEntries(d.stores.map((s: any) => [String(s.store), s.workroom ?? '']))
  )
  const [params, setParams] = useState<Params>(defaultParams)
  // Pad / material cost as a % of revenue (boss: "pad 7% is material cost" — Danita confirming final %)
  const [padPct, setPadPct] = useState('7')
  // Detail payout ($/detail) per workroom. Source: South BID V2.0 "Current Labor" Assessment pay.
  // Known branch rates: JAX/Naples/Sarasota $30, Lodi/Reno/San Jose/SLO $40, Utah/WV $35.
  // The 5 new workrooms default to $30 (Jacksonville proxy) until the boss confirms each.
  const [detailPay, setDetailPay] = useState<Record<string, string>>(() =>
    Object.fromEntries(d.workrooms.map((w: string) => [w, '30']))
  )
  // Which category rows are expanded (drill-down for install/removal/furniture/detail)
  const [expandedCat, setExpandedCat] = useState<Record<string, boolean>>({})
  const toggleCat = (wr: string, cat: string) =>
    setExpandedCat((p) => ({ ...p, [`${wr}|${cat}`]: !p[`${wr}|${cat}`] }))

  function computeForStores(storeIds: number[]) {
    const byCat: Record<string, any> = {}
    CATEGORIES.forEach((c) => (byCat[c] = { jobs: 0, details: 0 }))
    const t = {
      jobs: 0,
      details: 0,
      estSqft: 0,
      installIncome: 0,
      removalIncome: 0,
      furnitureIncome: 0,
      ancillaryIncome: 0,
      detailRevenue: 0,
      revenue: 0,
      payout: 0,
      pad: 0,
      contribution: 0,
    }
    storeIds.forEach((st) => {
      CATEGORIES.forEach((c) => {
        const h = histByStore[st]?.[c]
        const jobs = h ? h.Jobs : 0
        const details = h ? h.Details : 0
        if (jobs === 0 && details === 0) return
        const avg = num(params.avgJob[c])
        const estSqft = jobs * avg
        // revenue — store-level rates from FY26 RFP
        const install = storeRate(st, c, 'install')
        const removal = storeRate(st, c, 'removal')
        const furniture = storeRate(st, c, 'furniture')
        const detail = storeRate(st, c, 'detail')
        const installIncome = estSqft * install
        const removalSqft = estSqft * (num(params.removalPct[c]) / 100)
        const removalIncome = removalSqft * removal
        const furnitureRooms = jobs * num(params.furnitureRooms[c])
        const furnitureIncome = furnitureRooms * furniture
        const ancillarySqft = estSqft * (num(params.ancillaryPct[c]) / 100)
        const ancillaryIncome = ancillarySqft * num(params.ancillaryRate[c])
        const detailRevenue = details * detail
        // payout — global labor rates (still from South BID; update when labor file is available)
        const installPay = estSqft * num(params.installLabor[c])
        const removalPay = removalSqft * num(params.removalLabor[c])
        const furniturePay = furnitureRooms * num(params.furnitureLabor[c])
        const ancillaryPay = ancillarySqft * num(params.ancillaryLabor[c])
        const wr = assign[String(st)] ?? ''
        const detailPayout = details * num(detailPay[wr] ?? '30')

        const r = byCat[c]
        r.jobs += jobs
        r.details += details
        r.estSqft = (r.estSqft || 0) + estSqft
        r.installIncome = (r.installIncome || 0) + installIncome
        r.removalIncome = (r.removalIncome || 0) + removalIncome
        r.furnitureIncome = (r.furnitureIncome || 0) + furnitureIncome
        r.ancillaryIncome = (r.ancillaryIncome || 0) + ancillaryIncome
        r.detailRevenue = (r.detailRevenue || 0) + detailRevenue
        r.payout = (r.payout || 0) + installPay + removalPay + furniturePay + ancillaryPay + detailPayout

        t.jobs += jobs
        t.details += details
        t.estSqft += estSqft
        t.installIncome += installIncome
        t.removalIncome += removalIncome
        t.furnitureIncome += furnitureIncome
        t.ancillaryIncome += ancillaryIncome
        t.detailRevenue += detailRevenue
        t.payout += installPay + removalPay + furniturePay + ancillaryPay + detailPayout
      })
    })
    const padRate = num(padPct) / 100
    CATEGORIES.forEach((c) => {
      const r = byCat[c]
      r.revenue = r.installIncome + r.removalIncome + r.furnitureIncome + r.ancillaryIncome + r.detailRevenue
      r.pad = r.revenue * padRate
      r.contribution = r.revenue - r.payout - r.pad
    })
    t.revenue = t.installIncome + t.removalIncome + t.furnitureIncome + t.ancillaryIncome + t.detailRevenue
    t.pad = t.revenue * padRate
    t.contribution = t.revenue - t.payout - t.pad
    return { byCat, totals: t }
  }

  // SKU association (catalog-level): category -> stream -> list of SKU line items with totals
  const skuByCat = useMemo(() => {
    const map: Record<string, Record<string, SkuLine[]>> = {}
    for (const s of (skuData as any).skus ?? []) {
      const cat: string = s.category
      const stream: string = s.stream
      if (!map[cat]) map[cat] = {}
      if (!map[cat][stream]) map[cat][stream] = []
      map[cat][stream].push({
        sku: s.sku,
        desc: s.desc,
        count: s.totalCount,
        cost: s.totalCost,
        payment: s.totalPayment,
        margin: s.margin,
        pct: s.pct,
      })
    }
    return map
  }, [])

  const all = useMemo(() => computeForStores(d.stores.map((s: any) => s.store)), [params, assign, padPct, detailPay])

  const workroomRows = useMemo(
    () =>
      d.workrooms
        .map((w: string) => {
          const ids = d.stores.filter((s: any) => assign[s.store] === w).map((s: any) => s.store)
          if (ids.length === 0) return null
          const r = computeForStores(ids)
          const cats = CATEGORIES.map((c) => {
            const row = r.byCat[c]
            return {
              cat: c,
              ...row,
              margin: row.revenue > 0 ? (row.contribution / row.revenue) * 100 : 0,
            }
          })
          return {
            workroom: w,
            stores: ids.length,
            cats,
            margin: r.totals.revenue > 0 ? (r.totals.contribution / r.totals.revenue) * 100 : 0,
            ...r.totals,
          }
        })
        .filter(Boolean),
    [params, assign, padPct, detailPay]
  )

  // rate summary across all 56 historical stores (read-only, from FY26 RFP)
  const rateSummary = useMemo(() => {
    const ids = d.stores.map((s: any) => s.store)
    return CATEGORIES.map((c) => {
      const pick = (stream: string) =>
        ids.map((st) => storeRate(st, c, stream)).filter((v) => v !== 0)
      const rng = (arr: number[]) => {
        if (arr.length === 0) return '—'
        const mn = Math.min(...arr)
        const mx = Math.max(...arr)
        return mn === mx ? fmtRate(mn) : `${fmtRate(mn)}–${fmtRate(mx)}`
      }
      return {
        cat: c,
        install: rng(pick('install')),
        removal: rng(pick('removal')),
        furniture: rng(pick('furniture')),
        detail: rng(pick('detail')),
      }
    })
  }, [])

  const barData = workroomRows.map((r: any) => ({
    workroom: r.workroom,
    Install: Math.round(r.installIncome),
    Removal: Math.round(r.removalIncome),
    Furniture: Math.round(r.furnitureIncome),
    Ancillary: Math.round(r.ancillaryIncome),
    Detail: Math.round(r.detailRevenue),
  }))

  const pieData = CATEGORIES.map((c) => ({
    name: c,
    value: Math.max(0, Math.round(all.byCat[c].revenue)),
  }))
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0)

  const contributionMargin =
    all.totals.revenue > 0 ? ((all.totals.contribution / all.totals.revenue) * 100).toFixed(1) + '%' : '—'

  const kpis = [
    { icon: Store, label: 'Stores (Region 27)', value: String(d.stores.length), color: 'text-[#6d8a35]' },
    { icon: FileSpreadsheet, label: 'Details · FY2025', value: count(all.totals.details), color: 'text-[#6d8a35]' },
    { icon: Layers, label: 'Jobs · FY2025', value: count(all.totals.jobs), color: 'text-[#6d8a35]' },
    { icon: TrendingUp, label: 'Est. install sqft', value: nf(all.totals.estSqft) + ' sqft', color: 'text-[#6d8a35]' },
    { icon: DollarSign, label: 'Total revenue', value: money(all.totals.revenue), color: 'text-[#89ac44]' },
    { icon: Wallet, label: 'Installer payout', value: money(all.totals.payout), color: 'text-[#b45309]' },
    { icon: DollarSign, label: 'Contribution (after payout)', value: money(all.totals.contribution), color: 'text-[#6d8a35]' },
    { icon: TrendingUp, label: 'Contribution margin', value: contributionMargin, color: 'text-[#6d8a35]' },
  ]

  const inputCls =
    'w-24 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-[#89ac44] focus:outline-none focus:ring-1 focus:ring-[#89ac44]'
  const rateField = (key: keyof Params, c: string) => (
    <input
      type="number"
      value={params[key][c]}
      onChange={(e) => setParams((p) => ({ ...p, [key]: { ...p[key], [c]: e.target.value } }))}
      className={inputCls}
    />
  )

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Florida Workroom Budget</h1>
        <p className="mt-1 text-sm text-gray-500">
          Budget for the 6 new Florida workrooms. Uses FY2025 jobs and details from existing stores, priced at FY26
          RFP rates with Jacksonville labor.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Files used: Historical Data (6769bf98…xlsx) · FY26 Flooring RFP Pricing.xlsx · South BID V2.0.xlsb · new areas bid.xlsx
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <k.icon size={14} className={k.color} />
              {k.label}
            </div>
            <div className={`mt-2 text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {SHOW_DATA_STATUS && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Data verification status</h2>
          <p className="text-xs text-gray-500 mb-4">
            Revenue is solid. Contribution is still a draft until the pay side is confirmed.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                  {['Input', 'Source / note', 'Status'].map((h) => (
                    <th key={h} className="px-3 py-2 text-right first:text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DATA_STATUS.map((s) => (
                  <tr key={s.label} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">{s.label}</td>
                    <td className="px-3 py-2 text-gray-600">{s.detail}</td>
                    <td className="px-3 py-2 text-right">
                      <StatusBadge status={s.status} label={s.status === 'verified' ? 'Verified' : s.status === 'old' ? 'Old — update' : 'Pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by workroom</h2>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="workroom" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tickFormatter={(v) => money(v)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => money(Number(v))} />
              <Legend />
              <Bar dataKey="Install" stackId="a" fill={STREAM_COLORS.Install} />
              <Bar dataKey="Removal" stackId="a" fill={STREAM_COLORS.Removal} />
              <Bar dataKey="Furniture" stackId="a" fill={STREAM_COLORS.Furniture} />
              <Bar dataKey="Ancillary" stackId="a" fill={STREAM_COLORS.Ancillary} />
              <Bar dataKey="Detail" stackId="a" fill={STREAM_COLORS.Detail} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue share by category</h2>
          {pieTotal > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                  innerRadius={60}
                  outerRadius={110}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CAT_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[340px] flex items-center justify-center text-gray-400 text-sm">
              No revenue data
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workroom × Category breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                {['Office / Category', 'Jobs', 'Details', 'Est. sqft', 'Detail', 'Revenue', 'Payout', 'Pad'].map((h) => (
                  <th key={h} className="px-3 py-2 text-right first:text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            {workroomRows.map((r: any) => (
              <tbody key={r.workroom}>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="px-3 py-2 font-semibold text-gray-900">
                    {r.workroom} <span className="font-normal text-gray-400">({r.stores} stores)</span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{count(r.jobs)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{count(r.details)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{nf(r.estSqft)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(r.detailRevenue)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(r.revenue)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(r.payout)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(r.pad)}</td>
                </tr>
                {r.cats.map((cr: any) => {
                  const key = `${r.workroom}|${cr.cat}`
                  const open = !!expandedCat[key]
                  return (
                    <Fragment key={cr.cat}>
                      <tr
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleCat(r.workroom, cr.cat)}
                      >
                        <td className="px-3 py-2 pl-6 text-gray-700">
                          <span className="inline-flex items-center gap-1">
                            {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            {cr.cat}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{count(cr.jobs)}</td>
                        <td className="px-3 py-2 text-right">{count(cr.details)}</td>
                        <td className="px-3 py-2 text-right">{nf(cr.estSqft)}</td>
                        <td className="px-3 py-2 text-right">{money(cr.detailRevenue)}</td>
                        <td className="px-3 py-2 text-right font-medium">{money(cr.revenue)}</td>
                        <td className="px-3 py-2 text-right">{money(cr.payout)}</td>
                        <td className="px-3 py-2 text-right">{money(cr.pad)}</td>
                      </tr>
                      {open && (
                        <tr className="border-b border-gray-100 bg-[#f7faf3]">
                          <td colSpan={8} className="px-3 py-2">
                            <div className="pl-8">
                              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                                SKUs ({Object.values(skuByCat[cr.cat] ?? {}).reduce((n, a) => n + a.length, 0)})
                              </div>
                                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                  {SKU_STREAM_ORDER.map((stream) => {
                                    const list = skuByCat[cr.cat]?.[stream]
                                    if (!list || list.length === 0) return null
                                    return (
                                      <div key={stream}>
                                        <div className="text-xs font-semibold text-gray-700 mb-1">
                                          {SKU_STREAM_LABEL[stream]}{' '}
                                          <span className="font-normal text-gray-400">({list.length})</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full text-xs">
                                            <thead>
                                              <tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                                                <th className="text-left font-medium py-1 pr-2">SKU</th>
                                                <th className="text-right font-medium py-1 px-2">Count</th>
                                                <th className="text-right font-medium py-1 px-2">Cost</th>
                                                <th className="text-right font-medium py-1 px-2">Payment</th>
                                                <th className="text-right font-medium py-1 px-2">Margin</th>
                                                <th className="text-right font-medium py-1 pl-2">Margin %</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {list.map((s) => (
                                                <tr key={s.sku} className="border-b border-gray-50">
                                                  <td className="py-1 pr-2 text-gray-600 whitespace-nowrap">
                                                    <span className="text-gray-400">{s.sku}</span>{' '}
                                                    <span className="text-gray-700">{s.desc}</span>
                                                  </td>
                                                  <td className="py-1 px-2 text-right text-gray-600 whitespace-nowrap">{skuCount(s.count)}</td>
                                                  <td className="py-1 px-2 text-right text-gray-600 whitespace-nowrap">{skuMoney(s.cost)}</td>
                                                  <td className="py-1 px-2 text-right text-gray-600 whitespace-nowrap">{skuMoney(s.payment)}</td>
                                                  <td className="py-1 px-2 text-right text-gray-600 whitespace-nowrap">{skuMoney(s.margin)}</td>
                                                  <td className="py-1 pl-2 text-right text-gray-500 whitespace-nowrap">{skuMarginPct(s.margin, s.cost)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category model</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                {['Category', 'Jobs', 'Details', 'Est. sqft', 'Install', 'Removal', 'Ancillary', 'Detail', 'Revenue', 'Payout', ...d.workrooms].map((h) => (
                  <th key={h} className="px-3 py-2 text-right first:text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => {
                const r = all.byCat[c]
                return (
                  <tr key={c} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">{c}</td>
                    <td className="px-3 py-2 text-right">{count(r.jobs)}</td>
                    <td className="px-3 py-2 text-right">{count(r.details)}</td>
                    <td className="px-3 py-2 text-right">{nf(r.estSqft)}</td>
                    <td className="px-3 py-2 text-right">{money(r.installIncome)}</td>
                    <td className="px-3 py-2 text-right">{money(r.removalIncome)}</td>
                    <td className="px-3 py-2 text-right">{money(r.ancillaryIncome)}</td>
                    <td className="px-3 py-2 text-right">{money(r.detailRevenue)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{money(r.revenue)}</td>
                    <td className="px-3 py-2 text-right">{money(r.payout)}</td>
                    {workroomRows.map((wr: any) => {
                      const catRow = wr.cats.find((x: any) => x.cat === c)
                      return (
                        <td key={wr.workroom} className="px-3 py-2 text-right">
                          {money(catRow?.revenue ?? 0)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">SKU rates — FY26 RFP (store-level)</h2>
          <StatusBadge status="verified" label="Verified" />
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Per-store rates from the FY26 RFP. Most stores use the base rate; a few (670, 2437, 3350 — Orlando) are a
          bit higher. Read-only — change them in the RFP file and re-import.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                {['Category', 'Install $/sqft', 'Removal $/sqft', 'Furniture $/room', 'Detail $/detail'].map((h) => (
                  <th key={h} className="px-3 py-2 text-right first:text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rateSummary.map((r) => (
                <tr key={r.cat} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{r.cat}</td>
                  <td className="px-3 py-2 text-right">{r.install}</td>
                  <td className="px-3 py-2 text-right">{r.removal}</td>
                  <td className="px-3 py-2 text-right">{r.furniture}</td>
                  <td className="px-3 py-2 text-right">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Production &amp; SKU mix assumptions</h2>
          <StatusBadge status="pending" label="Pending validation" />
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                {['Category', 'Avg job (sqft)', 'Removal %'].map((h) => (
                  <th key={h} className="px-3 py-2 text-right first:text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr key={c} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{c}</td>
                  <td className="px-3 py-2 text-right">{rateField('avgJob', c)}</td>
                  <td className="px-3 py-2 text-right">{rateField('removalPct', c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Installer payout assumptions</h2>
          <StatusBadge status="verified" label="Jacksonville proxy" />
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Pay per SKU from South BID V2.0 (Jacksonville), used as the stand-in for the new workrooms. Backsplash
          install is $0 (no rate in the bid). Detail pay is set per workroom in the section below.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                {['Category', 'Install pay $/sqft', 'Removal pay $/sqft', 'Furniture pay $/room', 'Ancillary pay $/sqft'].map((h) => (
                  <th key={h} className="px-3 py-2 text-right first:text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr key={c} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{c}</td>
                  <td className="px-3 py-2 text-right">{rateField('installLabor', c)}</td>
                  <td className="px-3 py-2 text-right">{rateField('removalLabor', c)}</td>
                  <td className="px-3 py-2 text-right">{rateField('furnitureLabor', c)}</td>
                  <td className="px-3 py-2 text-right">{rateField('ancillaryLabor', c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Detail payout by workroom</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Pay per detail ("Assessment") by workroom. Source: South BID V2.0 Current Labor. The 5 new workrooms are
          editable and default to $30.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {d.workrooms.map((w: string) => (
            <label key={w} className="flex flex-col gap-1 rounded-md border border-gray-200 p-3">
              <span className="text-xs font-semibold text-gray-600">{w}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="number"
                  value={detailPay[w]}
                  onChange={(e) => setDetailPay((p) => ({ ...p, [w]: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-[#89ac44] focus:outline-none focus:ring-1 focus:ring-[#89ac44]"
                />
                <span className="text-xs text-gray-400">/detail</span>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Existing workrooms (reference, not in this budget)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(EXISTING_DETAIL_PAY).map(([w, rate]) => (
              <div key={w} className="flex flex-col gap-1 rounded-md border border-gray-100 bg-gray-50 p-3">
                <span className="text-xs font-medium text-gray-500">{w}</span>
                <span className="text-sm font-semibold text-gray-900">${rate}<span className="text-xs font-normal text-gray-400">/detail</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Pad (material cost)</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Material cost as a % of revenue, set at 7%. Deducted from gross profit.
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 font-medium">Pad (% of revenue)</label>
          <input
            type="number"
            value={padPct}
            onChange={(e) => setPadPct(e.target.value)}
            className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-[#89ac44] focus:outline-none focus:ring-1 focus:ring-[#89ac44]"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>

    </div>
  )
}
