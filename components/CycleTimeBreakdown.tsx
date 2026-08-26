'use client'

import { useMemo, useState } from 'react'
import CountUpNumber from '@/components/CountUpNumber'
import WorkroomMap from '@/components/WorkroomMap'
import type { CycleTimeStoreRecord } from '@/lib/cycleTimeData'
import { averageNullable } from '@/lib/cycleTimeData'
import { Info, X } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface CycleTimeBreakdownProps {
  records: CycleTimeStoreRecord[]
  selectedWorkroom?: string
}

type DialogKey = 'details' | 'jobs' | 'workOrder' | 'wpi' | null

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function formatDays(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(decimals)
}

function formatInt(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatCurrency(value: number) {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (value < 0) return `-$${formatted}`
  return `$${formatted}`
}

function scoreDetailsCycle(days: number | null): number {
  if (days == null || days <= 0) return 50
  if (days <= 5) return 100
  if (days <= 10) return 60
  if (days <= 15) return 40
  if (days <= 20) return 30
  return 20
}

function scoreJobsCycle(days: number | null): number {
  if (days == null || days <= 0) return 50
  if (days <= 5) return 100
  if (days <= 10) return 80
  if (days <= 15) return 60
  if (days <= 20) return 40
  return 20
}

function scoreWorkOrderCycle(days: number | null): number {
  if (days == null || days <= 0) return 50
  if (days <= 15) return 100
  if (days <= 25) return 80
  if (days <= 35) return 60
  if (days <= 45) return 40
  return 20
}

function riskFromScore(score: number): string {
  if (score >= 85) return 'Low'
  if (score >= 70) return 'Moderate'
  if (score >= 50) return 'High'
  return 'Critical'
}

function getRiskBadge(risk: string) {
  if (risk === 'Low') return 'badge-positive'
  if (risk === 'Moderate') return 'badge-neutral'
  return 'badge-warning'
}

function getWpsBadge(score: number) {
  if (score >= 70) return 'badge-positive'
  if (score >= 40) return 'badge-neutral'
  return 'badge-warning'
}

interface WorkroomAnalysis {
  name: string
  stores: number
  detailsCompleted: number
  jobsCompleted: number
  woCompleted: number
  detailsTotal: number | null
  jobsTotal: number | null
  woTotal: number | null
  laborPO: number
  vendorDebit: number
  detailsScore: number
  jobsScore: number
  woScore: number
  weightedPerformanceScore: number
  financialRisk: string
  fixNowBullets: string[]
  metricScores: {
    detailsCycleTime: { score: number; value: number | null }
    cycleJobs: { score: number; value: number | null }
    workOrderCycleTime: { score: number; value: number | null }
  }
}

export default function CycleTimeBreakdown({
  records,
  selectedWorkroom = 'all',
}: CycleTimeBreakdownProps) {
  const [dialog, setDialog] = useState<DialogKey>(null)
  const [selectedWorkroomDetail, setSelectedWorkroomDetail] = useState<WorkroomAnalysis | null>(null)
  const [selectedStore, setSelectedStore] = useState<CycleTimeStoreRecord | null>(null)

  const filtered = useMemo(() => {
    if (selectedWorkroom === 'all') return records
    return records.filter((r) => r.workroom === selectedWorkroom)
  }, [records, selectedWorkroom])

  const hasFinancials = useMemo(
    () => filtered.some((r) => (r.laborPO || 0) !== 0 || (r.vendorDebit || 0) !== 0),
    [filtered]
  )

  const comprehensiveAnalysis = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        stores: number
        detailsCompleted: number
        jobsCompleted: number
        woCompleted: number
        laborPO: number
        vendorDebit: number
        detailsTotals: number[]
        jobsTotals: number[]
        woTotals: number[]
      }
    >()

    filtered.forEach((r) => {
      const existing = map.get(r.workroom) || {
        name: r.workroom,
        stores: 0,
        detailsCompleted: 0,
        jobsCompleted: 0,
        woCompleted: 0,
        laborPO: 0,
        vendorDebit: 0,
        detailsTotals: [],
        jobsTotals: [],
        woTotals: [],
      }
      existing.stores += 1
      existing.detailsCompleted += r.detailsCompleted
      existing.jobsCompleted += r.jobsCompleted
      existing.woCompleted += r.woCompleted
      existing.laborPO += r.laborPO || 0
      existing.vendorDebit += r.vendorDebit || 0
      if (r.detailsTotal != null) existing.detailsTotals.push(r.detailsTotal)
      if (r.jobsTotal != null) existing.jobsTotals.push(r.jobsTotal)
      if (r.woTotal != null) existing.woTotals.push(r.woTotal)
      map.set(r.workroom, existing)
    })

    return Array.from(map.values())
      .map((w) => {
        const detailsTotal = averageNullable(w.detailsTotals)
        const jobsTotal = averageNullable(w.jobsTotals)
        const woTotal = averageNullable(w.woTotals)
        const detailsScore = scoreDetailsCycle(detailsTotal)
        const jobsScore = scoreJobsCycle(jobsTotal)
        const woScore = scoreWorkOrderCycle(woTotal)
        // Renormalized Visual Breakdown cycle weights: 5% / 13% / 14%
        const weightedPerformanceScore =
          detailsScore * (5 / 32) + jobsScore * (13 / 32) + woScore * (14 / 32)

        const fixNowBullets: string[] = []
        if (detailsScore < 70) fixNowBullets.push('Details Cycle Time above target (>5 days)')
        if (jobsScore < 70) fixNowBullets.push('Job Cycle Time above target')
        if (woScore < 70) fixNowBullets.push('Work Order Cycle Time above target')

        return {
          name: w.name,
          stores: w.stores,
          detailsCompleted: w.detailsCompleted,
          jobsCompleted: w.jobsCompleted,
          woCompleted: w.woCompleted,
          detailsTotal,
          jobsTotal,
          woTotal,
          laborPO: w.laborPO,
          vendorDebit: w.vendorDebit,
          detailsScore,
          jobsScore,
          woScore,
          weightedPerformanceScore,
          financialRisk: riskFromScore(weightedPerformanceScore),
          fixNowBullets,
          metricScores: {
            detailsCycleTime: { score: detailsScore, value: detailsTotal },
            cycleJobs: { score: jobsScore, value: jobsTotal },
            workOrderCycleTime: { score: woScore, value: woTotal },
          },
        } satisfies WorkroomAnalysis
      })
      .sort((a, b) => b.weightedPerformanceScore - a.weightedPerformanceScore)
  }, [filtered])

  const kpis = useMemo(() => {
    const detailsCompleted = filtered.reduce((s, r) => s + r.detailsCompleted, 0)
    const jobsCompleted = filtered.reduce((s, r) => s + r.jobsCompleted, 0)
    const woCompleted = filtered.reduce((s, r) => s + r.woCompleted, 0)
    const laborPO = filtered.reduce((s, r) => s + (r.laborPO || 0), 0)
    const vendorDebit = filtered.reduce((s, r) => s + (r.vendorDebit || 0), 0)
    return {
      detailsCompleted,
      jobsCompleted,
      woCompleted,
      laborPO,
      vendorDebit,
      detailsTotal: averageNullable(filtered.map((r) => r.detailsTotal)),
      jobsTotal: averageNullable(filtered.map((r) => r.jobsTotal)),
      woTotal: averageNullable(filtered.map((r) => r.woTotal)),
      detailsStages: [
        { label: 'Ready to Schedule → Scheduled', value: averageNullable(filtered.map((r) => r.detailsRtsSch)), description: 'Time from Ready to Schedule notification to scheduled date' },
        { label: 'Scheduled → Installation Started', value: averageNullable(filtered.map((r) => r.detailsSchStart)), description: 'Time from scheduled date to when installation begins' },
        { label: 'Installation Started → Documents Submitted', value: averageNullable(filtered.map((r) => r.detailsStartDocs)), description: 'Time from installation start to completion documentation submitted' },
        { label: 'Total Provider Cycle Time', value: averageNullable(filtered.map((r) => r.detailsTotal)), description: 'Total Details cycle time' },
      ],
      jobsStages: [
        { label: 'RTS - Sched (Jobs)', value: averageNullable(filtered.map((r) => r.jobsRtsSch)), description: 'Ready to Schedule → Scheduled' },
        { label: 'Sched - Start (Jobs)', value: averageNullable(filtered.map((r) => r.jobsSchStart)), description: 'Scheduled → Installation Started' },
        { label: 'Start - Complete (Jobs)', value: averageNullable(filtered.map((r) => r.jobsStartComp)), description: 'Installation Started → Completed' },
        { label: 'Total Jobs Cycle time', value: averageNullable(filtered.map((r) => r.jobsTotal)), description: 'Total Jobs cycle time' },
      ],
      woStages: [
        { label: 'Ready to Schedule → Scheduled', value: averageNullable(filtered.map((r) => r.woRtsSch)), description: 'Time from Ready-To-Schedule date to Scheduled Start date' },
        { label: 'Scheduled → Work Started', value: averageNullable(filtered.map((r) => r.woSchStart)), description: 'Time from Scheduled Start date to when work actually begins' },
        { label: 'Work Started → Completed', value: averageNullable(filtered.map((r) => r.woStartComp)), description: 'Time from work start to Work Order Completion' },
        { label: 'Total Provider Cycle Time', value: averageNullable(filtered.map((r) => r.woTotal)), description: 'Total Work Order cycle time' },
      ],
    }
  }, [filtered])

  const topLoadWorkrooms = useMemo(() => {
    const top = comprehensiveAnalysis.slice(0, 4)
    const totalWPI = top.reduce((sum, item) => sum + item.weightedPerformanceScore, 0)
    return top.map((w) => ({
      name: w.name,
      wpiScore: w.weightedPerformanceScore,
      records: w.detailsCompleted + w.jobsCompleted,
      stores: w.stores,
      wpiPercent: totalWPI > 0 ? (w.weightedPerformanceScore / totalWPI) * 100 : 0,
    }))
  }, [comprehensiveAnalysis])

  const storeRows = useMemo(
    () => [...filtered].sort((a, b) => (a.detailsTotal ?? 999) - (b.detailsTotal ?? 999)),
    [filtered]
  )

  const wpiChartData = useMemo(
    () =>
      comprehensiveAnalysis.map((w) => ({
        name: w.name,
        score: Number(w.weightedPerformanceScore.toFixed(1)),
      })),
    [comprehensiveAnalysis]
  )

  if (filtered.length === 0) {
    return (
      <section className="compact-section">
        <div className="compact-chart-container" style={{ minHeight: '300px', padding: '1rem' }}>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
            Upload a cycle time report to see heatmap visualization.
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-0">
      {/* HEATMAP — same card layout as Visual Breakdown */}
      <section className="compact-section" style={{ marginBottom: '1.5rem' }}>
        <div className="compact-chart-container" style={{ minHeight: '300px', padding: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
              width: '100%',
              gridAutoRows: 'minmax(auto, auto)',
              alignItems: 'stretch',
            }}
          >
            {comprehensiveAnalysis.map((workroom) => {
              let backgroundColor = '#ef4444'
              let heatmapLabel = 'Critical'
              let textColor = '#ffffff'
              let borderColor = '#dc2626'
              let shadowColor = 'rgba(0, 0, 0, 0.15)'

              if (workroom.weightedPerformanceScore >= 85) {
                backgroundColor = '#22c55e'
                heatmapLabel = 'Top Performing'
                textColor = '#ffffff'
                borderColor = '#16a34a'
                shadowColor = 'rgba(34, 197, 94, 0.35)'
              } else if (workroom.weightedPerformanceScore >= 70) {
                backgroundColor = '#facc15'
                heatmapLabel = 'Moderate'
                textColor = '#1f2937'
                borderColor = '#eab308'
                shadowColor = 'rgba(234, 179, 8, 0.35)'
              }

              if (workroom.financialRisk === 'Critical' || workroom.fixNowBullets.length > 2) {
                backgroundColor = '#ef4444'
                heatmapLabel = 'Critical Issues'
                textColor = '#ffffff'
                borderColor = '#b91c1c'
                shadowColor = 'rgba(248, 113, 113, 0.35)'
              }

              const patternColor = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)'
              const backgroundPattern = `repeating-linear-gradient(45deg, transparent, transparent 10px, ${patternColor} 10px, ${patternColor} 12px)`
              const isYellowCard = workroom.weightedPerformanceScore >= 70 && workroom.weightedPerformanceScore < 85
              const emojiStyle = isYellowCard
                ? { fontSize: '0.65rem', color: '#f59e0b', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }
                : { fontSize: '0.7rem', color: '#f59e0b' }

              return (
                <div
                  key={workroom.name}
                  style={{
                    background: backgroundColor,
                    color: textColor,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    boxShadow: `0 6px 16px ${shadowColor}`,
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                  onClick={() => setSelectedWorkroomDetail(workroom)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                    e.currentTarget.style.boxShadow = `0 10px 22px ${shadowColor}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = `0 6px 16px ${shadowColor}`
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      backgroundImage: backgroundPattern,
                      padding: '0.6rem',
                      margin: '-1rem -1rem 0.4rem -1rem',
                      borderRadius: '0.75rem 0.75rem 0 0',
                      borderBottom: `2px solid ${textColor}30`,
                      minHeight: '60px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: '1.2', flex: 1, minWidth: 0 }}>
                        {workroom.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', marginLeft: 'auto', paddingLeft: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.1rem' }}>{workroom.financialRisk}</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>Risk</div>
                        </div>
                        {workroom.fixNowBullets.length > 0 ? (
                          <div style={{ fontSize: '0.7rem', opacity: 0.9, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                            {workroom.fixNowBullets.length} issue{workroom.fixNowBullets.length > 1 ? 's' : ''} to fix
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.7rem', opacity: 0, height: '1.2rem' }}>&nbsp;</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', opacity: 0.95, marginTop: '0.2rem', paddingTop: '0.3rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>WPI Score:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDialog('wpi')
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.1rem', display: 'flex', color: textColor, opacity: 0.8 }}
                          aria-label="Learn more about WPI Score"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '1.5rem' }}>
                        <CountUpNumber value={workroom.weightedPerformanceScore} duration={1500} decimals={1} />
                      </span>
                    </div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.85, marginBottom: '0.35rem' }}>{heatmapLabel}</div>
                    <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: `1px solid ${textColor}20` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Details Cycle Time:</span>
                        <span style={{ fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          {workroom.metricScores.detailsCycleTime.score < 70 && <span style={emojiStyle}>⚠️</span>}
                          {workroom.metricScores.detailsCycleTime.value != null
                            ? `${workroom.metricScores.detailsCycleTime.value.toFixed(1)}d`
                            : 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Job Cycle Time:</span>
                        <span style={{ fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          {workroom.metricScores.cycleJobs.score < 70 && <span style={emojiStyle}>⚠️</span>}
                          {workroom.metricScores.cycleJobs.value != null
                            ? `${workroom.metricScores.cycleJobs.value.toFixed(1)}d`
                            : 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Work Order Cycle Time:</span>
                        <span style={{ fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          {workroom.metricScores.workOrderCycleTime.score < 70 && <span style={emojiStyle}>⚠️</span>}
                          {workroom.metricScores.workOrderCycleTime.value != null
                            ? `${workroom.metricScores.workOrderCycleTime.value.toFixed(1)}d`
                            : 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Details Completed:</span>
                        <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{formatInt(workroom.detailsCompleted)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Jobs Completed:</span>
                        <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{formatInt(workroom.jobsCompleted)}</span>
                      </div>
                      {hasFinancials && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Labor PO:</span>
                            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{formatCurrency(workroom.laborPO)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Vendor Debits:</span>
                            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{formatCurrency(workroom.vendorDebit)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Operational Metrics — same white box as Visual Breakdown */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4" style={{ width: '100%' }}>
          <h3 className="compact-section-title mb-4">Operational Metrics</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1.25rem',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jobs Completed</div>
              <div className="text-xl font-bold text-gray-900">
                <CountUpNumber value={kpis.jobsCompleted} duration={1500} decimals={0} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Details Completed</div>
              <div className="text-xl font-bold text-gray-900">
                <CountUpNumber value={kpis.detailsCompleted} duration={1500} decimals={0} />
              </div>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onClick={() => setDialog('details')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDialog('details')
                }
              }}
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Details Cycle Time</div>
              <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                {kpis.detailsTotal != null ? (
                  <>
                    <CountUpNumber value={kpis.detailsTotal} duration={1500} decimals={1} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>days</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onClick={() => setDialog('jobs')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDialog('jobs')
                }
              }}
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job Cycle Time</div>
              <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                {kpis.jobsTotal != null ? (
                  <>
                    <CountUpNumber value={kpis.jobsTotal} duration={1500} decimals={1} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>days</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onClick={() => setDialog('workOrder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDialog('workOrder')
                }
              }}
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Order Cycle Time</div>
              <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                {kpis.woTotal != null ? (
                  <>
                    <CountUpNumber value={kpis.woTotal} duration={1500} decimals={1} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>days</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">WO Completed</div>
              <div className="text-xl font-bold text-gray-900">
                <CountUpNumber value={kpis.woCompleted} duration={1500} decimals={0} />
              </div>
            </div>

            {hasFinancials && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Labor PO</div>
                  <div className="text-xl font-bold text-gray-900">
                    <CountUpNumber
                      value={kpis.laborPO}
                      duration={1500}
                      decimals={0}
                      formatter={(v) => formatCurrency(v)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vendor Debits</div>
                  <div className="text-xl font-bold text-gray-900" style={{ color: kpis.vendorDebit !== 0 ? '#dc2626' : undefined }}>
                    <CountUpNumber
                      value={kpis.vendorDebit}
                      duration={1500}
                      decimals={0}
                      formatter={(v) => formatCurrency(v)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pie + Top Performing — left column narrower so right table can show more columns */}
      <div className="analytics-grid-container analytics-grid-container--left-compact">
        <section className="compact-section">
          <div className="compact-section-header">
            <h3 className="compact-section-title">Workrooms Most Responsible for Moving Your Business</h3>
            <p className="text-xs text-gray-500 mt-1">Top Performing Workrooms by WPI Score (Heatmap) - Top 4 Workrooms</p>
          </div>

          <div className="compact-chart-container">
            <h4 className="text-xs font-semibold mb-3 text-gray-700 uppercase tracking-wider">WPI Score Distribution</h4>
            {topLoadWorkrooms.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={topLoadWorkrooms}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, wpiPercent, wpiScore }) => `${name}: ${wpiScore.toFixed(1)} (${wpiPercent.toFixed(1)}%)`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="wpiScore"
                  >
                    {topLoadWorkrooms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `WPI: ${value.toFixed(1)}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.75rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
                No data available
              </div>
            )}
          </div>

          <div className="compact-table-container">
            <div className="overflow-x-auto" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Workroom</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WPI Score</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Records</th>
                  </tr>
                </thead>
                <tbody>
                  {topLoadWorkrooms.map((workroom) => {
                    let badgeClass = 'badge-neutral'
                    if (workroom.wpiScore >= 85) badgeClass = 'badge-positive'
                    else if (workroom.wpiScore < 70) badgeClass = 'badge-negative'
                    return (
                      <tr key={workroom.name}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem' }}>{workroom.name}</td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                          <span className={badgeClass} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            {workroom.wpiScore.toFixed(1)}
                          </span>
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                          {formatInt(workroom.records)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="compact-section">
          <div className="compact-section-header">
            <h3 className="compact-section-title">Top Performing Workrooms</h3>
            <p className="text-xs text-gray-500 mt-1">Ranked by WPI Score (Workroom Performance Index)</p>
          </div>

          <div className="compact-table-container" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="overflow-x-auto" style={{ flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
              <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem', width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Rank</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Workroom</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Stores</th>
                    {hasFinancials && (
                      <>
                        <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor PO</th>
                        <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Vendor Debits</th>
                      </>
                    )}
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Details CT</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Job CT</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WO CT</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WPI Score</th>
                  </tr>
                </thead>
                <tbody>
                  {comprehensiveAnalysis.slice(0, 15).map((workroom, index) => {
                    let wpiBadgeClass = 'badge-neutral'
                    if (workroom.weightedPerformanceScore >= 85) wpiBadgeClass = 'badge-positive'
                    else if (workroom.weightedPerformanceScore < 70) wpiBadgeClass = 'badge-warning'

                    return (
                      <tr key={workroom.name} style={{ cursor: 'pointer' }} onClick={() => setSelectedWorkroomDetail(workroom)}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#6b7280', fontSize: '0.7rem' }}>#{index + 1}</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem' }}>{workroom.name}</td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>{formatInt(workroom.stores)}</td>
                        {hasFinancials && (
                          <>
                            <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{formatCurrency(workroom.laborPO)}</td>
                            <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap', color: workroom.vendorDebit !== 0 ? '#dc2626' : undefined }}>{formatCurrency(workroom.vendorDebit)}</td>
                          </>
                        )}
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>{formatDays(workroom.detailsTotal)}</td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>{formatDays(workroom.jobsTotal)}</td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>{formatDays(workroom.woTotal)}</td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem' }}>
                          <span className={`badge-pill ${wpiBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', fontWeight: 600, display: 'inline-block' }}>
                            {workroom.weightedPerformanceScore.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Comprehensive table */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Comprehensive Workroom Analysis Dashboard</h3>
          <p className="text-xs text-gray-500 mt-1">
            Details Cycle Time • Job Cycle Time • Work Order Cycle Time
            {hasFinancials ? ' • Labor PO • Vendor Debits' : ''}
            {' '}• Completed Volume • Risk • Weighted Performance Score (Click any row for detailed analysis)
          </p>
        </div>

        <div className="compact-table-container">
          <div className="overflow-x-auto" style={{ maxHeight: '800px', overflowY: 'auto' }}>
            <table className="professional-table professional-table-zebra" style={{ fontSize: '0.7rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', position: 'sticky', left: 0, background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', color: '#ffffff', zIndex: 10, textAlign: 'center' }}>Workroom</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Details Cycle Time</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Job Cycle Time</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Work Order Cycle Time</th>
                  {hasFinancials && (
                    <>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Labor PO</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Vendor Debits</th>
                    </>
                  )}
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Details Completed</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Jobs Completed</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Stores</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Risk</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Weighted Score</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveAnalysis.map((workroom) => (
                  <tr
                    key={workroom.name}
                    onClick={() => setSelectedWorkroomDetail(workroom)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = ''
                    }}
                  >
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5 }}>
                      {workroom.name}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                      {workroom.detailsTotal != null ? (
                        <span style={{ fontWeight: 600 }}>{workroom.detailsTotal.toFixed(1)} days</span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                      {workroom.jobsTotal != null ? (
                        <span style={{ fontWeight: 600 }}>{workroom.jobsTotal.toFixed(1)} days</span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                      {workroom.woTotal != null ? (
                        <span style={{ fontWeight: 600 }}>{workroom.woTotal.toFixed(1)} days</span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    {hasFinancials && (
                      <>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatCurrency(workroom.laborPO)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap', color: workroom.vendorDebit !== 0 ? '#dc2626' : undefined }}>
                          {formatCurrency(workroom.vendorDebit)}
                        </td>
                      </>
                    )}
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center', fontWeight: 600 }}>
                      {formatInt(workroom.detailsCompleted)}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center', fontWeight: 600 }}>
                      {formatInt(workroom.jobsCompleted)}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center', color: '#6b7280' }}>
                      {formatInt(workroom.stores)}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                      <span className={`badge-pill ${getRiskBadge(workroom.financialRisk)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                        {workroom.financialRisk}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                      <span className={`badge-pill ${getWpsBadge(workroom.weightedPerformanceScore)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                        {workroom.weightedPerformanceScore.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WPI bar chart */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Workroom Performance Index (WPI) by Workroom</h3>
          <p className="text-xs text-gray-500 mt-1">
            Using heatmap scoring: 15.6% Details Cycle Time • 40.6% Job Cycle Time • 43.8% Work Order Cycle Time
          </p>
        </div>

        <div className="analytics-grid-container">
          <div className="compact-chart-container" style={{ minHeight: '500px', padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={460}>
              <BarChart data={wpiChartData} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.75rem' }} />
                <Legend />
                <Bar dataKey="score" name="WPI Score" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="compact-table-container">
            <div className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Workroom</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WPI</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Details</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Jobs</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WO</th>
                  </tr>
                </thead>
                <tbody>
                  {comprehensiveAnalysis.map((w) => (
                    <tr key={w.name} style={{ cursor: 'pointer' }} onClick={() => setSelectedWorkroomDetail(w)}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{w.name}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>
                        <span className={`badge-pill ${getWpsBadge(w.weightedPerformanceScore)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                          {w.weightedPerformanceScore.toFixed(1)}
                        </span>
                      </td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>{formatDays(w.detailsTotal)}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>{formatDays(w.jobsTotal)}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>{formatDays(w.woTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Store detail */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Top Performing Stores</h3>
          <p className="text-xs text-gray-500 mt-1">Store-level cycle times — click any row for stage breakdown</p>
        </div>
        <div className="compact-table-container">
          <div className="overflow-x-auto" style={{ maxHeight: '480px', overflowY: 'auto' }}>
            <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Store</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Workroom</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Details CT</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Job CT</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WO CT</th>
                    {hasFinancials && (
                      <>
                        <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor PO</th>
                        <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Vendor Debits</th>
                      </>
                    )}
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Details Done</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Jobs Done</th>
                  </tr>
                </thead>
                <tbody>
                  {storeRows.map((store) => (
                    <tr key={store.location} style={{ cursor: 'pointer' }} onClick={() => setSelectedStore(store)}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>
                        <div>{store.location}</div>
                        <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 400 }}>{store.storeName}</div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{store.workroom}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{formatDays(store.detailsTotal)}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{formatDays(store.jobsTotal)}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{formatDays(store.woTotal)}</td>
                      {hasFinancials && (
                        <>
                          <td align="right" style={{ padding: '0.5rem 0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(store.laborPO || 0)}</td>
                          <td align="right" style={{ padding: '0.5rem 0.75rem', fontWeight: 600, whiteSpace: 'nowrap', color: (store.vendorDebit || 0) !== 0 ? '#dc2626' : undefined }}>{formatCurrency(store.vendorDebit || 0)}</td>
                        </>
                      )}
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>{store.detailsCompleted}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>{store.jobsCompleted}</td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </div>
      </section>

      {dialog === 'details' && (
        <MetricDialog
          title="Details Cycle Time"
          subtitle="Provider cycle time breakdown"
          totalLabel="Total Provider Cycle Time"
          totalValue={kpis.detailsTotal}
          completed={kpis.detailsCompleted}
          stages={kpis.detailsStages}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'jobs' && (
        <MetricDialog
          title="Job Cycle Time"
          subtitle="Jobs cycle time breakdown"
          totalLabel="Total Jobs Cycle time"
          totalValue={kpis.jobsTotal}
          completed={kpis.jobsCompleted}
          stages={kpis.jobsStages}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'workOrder' && (
        <MetricDialog
          title="Work Order Cycle Time"
          subtitle="Provider cycle time breakdown"
          totalLabel="Total Provider Cycle Time"
          totalValue={kpis.woTotal}
          completed={kpis.woCompleted}
          stages={kpis.woStages}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'wpi' && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}
          onClick={() => setDialog(null)}
        >
          <div style={{ maxWidth: 560, width: '100%', background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>WPI SCORE</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>How Cycle Time WPI is calculated</div>
              </div>
              <button type="button" onClick={() => setDialog(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
              <p style={{ marginBottom: '0.75rem' }}>
                This page scores workrooms using the same cycle-time thresholds as Visual Breakdown, renormalized across the three cycle metrics available in this file:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.4rem' }}>
                <li>Details Cycle Time — 15.6% (caution &gt; 5 days)</li>
                <li>Job Cycle Time — 40.6%</li>
                <li>Work Order Cycle Time — 43.8%</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Geographic Map - same component / styling as Visual Breakdown */}
      <section className="compact-section" style={{ marginTop: '2rem' }}>
        <WorkroomMap
          workrooms={comprehensiveAnalysis.map((w) => {
            const sales = w.laborPO
            const totalCost = Math.abs(w.vendorDebit)
            const margin = sales - totalCost
            return {
              name: w.name,
              sales,
              marginRate: sales > 0 ? (margin / sales) * 100 : 0,
              records: w.jobsCompleted,
              totalCost,
              margin,
              weightedPerformanceScore: w.weightedPerformanceScore,
              detailsCycleTime: w.detailsTotal,
              jobsCycleTime: w.jobsTotal,
              workOrderCycleTime: w.woTotal,
            }
          })}
        />
      </section>

      {selectedWorkroomDetail && (
        <WorkroomDialog workroom={selectedWorkroomDetail} onClose={() => setSelectedWorkroomDetail(null)} />
      )}
      {selectedStore && <StoreDialog store={selectedStore} onClose={() => setSelectedStore(null)} />}
    </div>
  )
}

function MetricDialog({
  title,
  subtitle,
  totalLabel,
  totalValue,
  completed,
  stages,
  onClose,
}: {
  title: string
  subtitle: string
  totalLabel: string
  totalValue: number | null
  completed: number
  stages: Array<{ label: string; value: number | null; description?: string }>
  onClose: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: '760px', width: '100%', background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)', border: '1px solid #e5e7eb', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>{title.toUpperCase()}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{subtitle}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '12px', padding: '0.9rem 1rem', boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>{totalLabel}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>{formatDays(totalValue)}</div>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>days</span>
              </div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '12px', padding: '0.9rem 1rem', boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>Completed</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>{formatInt(completed)}</div>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1rem 1.1rem', background: '#f8fafc', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>Cycle Time Stages</div>
              <div style={{ fontSize: '0.7rem', color: '#475569', padding: '0.25rem 0.55rem', borderRadius: '999px', background: '#e2e8f0', fontWeight: 600 }}>
                {stages.filter((i) => i.value != null).length} / {stages.length} populated
              </div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
              {stages.map((item) => (
                <li
                  key={item.label}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '9999px', background: '#2563eb', boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)', flexShrink: 0, marginTop: '0.25rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{item.label}</span>
                      {item.description && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.description}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{formatDays(item.value)}</span>
                    {item.value != null && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>days</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkroomDialog({ workroom, onClose }: { workroom: WorkroomAnalysis; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}
      onClick={onClose}
    >
      <div style={{ maxWidth: 720, width: '100%', background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>WORKROOM ANALYSIS</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{workroom.name}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <StatCard label="WPI Score" value={workroom.weightedPerformanceScore.toFixed(1)} />
            <StatCard label="Risk" value={workroom.financialRisk} />
            <StatCard label="Details CT" value={`${formatDays(workroom.detailsTotal)}d`} />
            <StatCard label="Job CT" value={`${formatDays(workroom.jobsTotal)}d`} />
            <StatCard label="WO CT" value={`${formatDays(workroom.woTotal)}d`} />
            <StatCard label="Stores" value={String(workroom.stores)} />
            {(workroom.laborPO !== 0 || workroom.vendorDebit !== 0) && (
              <>
                <StatCard label="Labor PO" value={formatCurrency(workroom.laborPO)} />
                <StatCard label="Vendor Debits" value={formatCurrency(workroom.vendorDebit)} />
              </>
            )}
          </div>
          {workroom.fixNowBullets.length > 0 && (
            <div style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 12, padding: '0.9rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.4rem' }}>Issues to fix</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#7f1d1d', fontSize: '0.85rem' }}>
                {workroom.fixNowBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 12, padding: '0.75rem 0.9rem' }}>
      <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{value}</div>
    </div>
  )
}

function StoreDialog({ store, onClose }: { store: CycleTimeStoreRecord; onClose: () => void }) {
  const sections = [
    {
      title: 'Details',
      total: store.detailsTotal,
      completed: store.detailsCompleted,
      stages: [
        { label: 'RTS → Sch', value: store.detailsRtsSch },
        { label: 'Sch → Start', value: store.detailsSchStart },
        { label: 'Start → Docs Sub', value: store.detailsStartDocs },
      ],
    },
    {
      title: 'Jobs',
      total: store.jobsTotal,
      completed: store.jobsCompleted,
      stages: [
        { label: 'RTS → Sch', value: store.jobsRtsSch },
        { label: 'Sch → Start', value: store.jobsSchStart },
        { label: 'Start → Comp', value: store.jobsStartComp },
      ],
    },
    {
      title: 'Work Order',
      total: store.woTotal,
      completed: store.woCompleted,
      stages: [
        { label: 'RTS → Sch', value: store.woRtsSch },
        { label: 'Sch → Start', value: store.woSchStart },
        { label: 'Start → Comp', value: store.woStartComp },
      ],
    },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}
      onClick={onClose}
    >
      <div style={{ maxWidth: 860, width: '100%', background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>STORE {store.location}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{store.storeName}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{store.workroom} · District {store.district ?? '—'}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {sections.map((section) => (
            <div key={section.title} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>{section.title}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {formatDays(section.total)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#6b7280' }}>days</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>{section.completed} completed</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.4rem' }}>
                {section.stages.map((s) => (
                  <li key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.45rem 0.6rem' }}>
                    <span>{s.label}</span>
                    <strong>{formatDays(s.value)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
