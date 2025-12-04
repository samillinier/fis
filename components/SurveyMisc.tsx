'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/context/DataContext'
import { getStoreName } from '@/data/storeNames'
import CountUpNumber from '@/components/CountUpNumber'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const isValidWorkroomName = (name: string): boolean => {
  const normalizedName = (name || '').toLowerCase().trim()
  return (
    normalizedName !== 'location #' &&
    normalizedName !== 'location' &&
    normalizedName !== '' &&
    !normalizedName.includes('location #')
  )
}

interface WorkroomSurveyRow {
  workroom: string
  laborCategory: string
  storeNumber: string
  storeName: string
  surveyCount: number
  ltrAvg: number
  craftAvg: number
  profAvg: number
}

export default function SurveyMisc() {
  const { data } = useData()
  const [selectedWorkroom, setSelectedWorkroom] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'ltr' | 'craft' | 'prof'>('all')
  const [selectedRow, setSelectedRow] = useState<WorkroomSurveyRow | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const {
    rows,
    chartData,
    aggregatedChartData,
    uniqueWorkrooms,
    uniqueCategories,
  }: {
    rows: WorkroomSurveyRow[]
    chartData: WorkroomSurveyRow[]
    aggregatedChartData: Array<{
      workroom: string
      surveyCount: number
      ltrAvg: number
      craftAvg: number
      profAvg: number
    }>
    uniqueWorkrooms: string[]
    uniqueCategories: string[]
  } = useMemo(() => {
    const map = new Map<
      string,
      WorkroomSurveyRow & {
        ltrSum: number
        craftSum: number
        profSum: number
        count: number
      }
    >()
    const validWorkrooms = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))

    validWorkrooms.forEach((w) => {
      const hasAnyScore =
        w.ltrScore != null ||
        w.craftScore != null ||
        w.profScore != null

      if (!hasAnyScore) return

      const workroomName = w.name || 'Unknown'
      const laborCategory = w.laborCategory || (w as any).laborCategory || (w as any).category || 'N/A'
      const storeNumber = w.store ? String(w.store) : 'Unknown'
      const storeName = getStoreName(w.store as any)
      const key = `${storeNumber}|||${workroomName}|||${laborCategory}`
      const existing =
        map.get(key) || {
          workroom: workroomName,
          laborCategory,
          storeNumber,
          storeName,
          surveyCount: 0,
          ltrAvg: 0,
          craftAvg: 0,
          profAvg: 0,
          ltrSum: 0,
          craftSum: 0,
          profSum: 0,
          count: 0,
        }

      existing.surveyCount += 1
      existing.count += 1
      if (w.ltrScore != null) existing.ltrSum += w.ltrScore
      if (w.craftScore != null) existing.craftSum += w.craftScore
      if (w.profScore != null) existing.profSum += w.profScore

      map.set(key, existing)
    })

    const rows: WorkroomSurveyRow[] = Array.from(map.values())
      .map((r) => ({
        workroom: r.workroom,
        laborCategory: r.laborCategory,
        storeNumber: r.storeNumber,
        storeName: r.storeName,
        surveyCount: r.surveyCount,
        ltrAvg: r.count > 0 ? r.ltrSum / r.count : 0,
        craftAvg: r.count > 0 ? r.craftSum / r.count : 0,
        profAvg: r.count > 0 ? r.profSum / r.count : 0,
      }))
      .sort((a, b) => {
        // Sort primarily by numeric store number when possible, then by workroom
        const aNum = parseInt(a.storeNumber, 10)
        const bNum = parseInt(b.storeNumber, 10)
        if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) {
          return aNum - bNum
        }
        if (a.workroom !== b.workroom) {
          return a.workroom.localeCompare(b.workroom)
        }
        return a.laborCategory.localeCompare(b.laborCategory)
      })

    const uniqueWorkrooms = Array.from(
      new Set(rows.map((r) => r.workroom))
    ).sort()

    const uniqueCategories = Array.from(
      new Set(rows.map((r) => r.laborCategory))
    ).sort()

    // By default, chart shows top 15 by survey count
    const chartData = [...rows]
      .sort((a, b) => b.surveyCount - a.surveyCount)
      .slice(0, 15)

    // Create aggregated chart data grouped by workroom only (combining all stores and categories)
    const aggregatedMap = new Map<string, {
      workroom: string
      totalSurveys: number
      ltrSum: number
      craftSum: number
      profSum: number
      ltrCount: number
      craftCount: number
      profCount: number
    }>()

    rows.forEach((row) => {
      const existing = aggregatedMap.get(row.workroom)
      if (existing) {
        existing.totalSurveys += row.surveyCount
        existing.ltrSum += row.ltrAvg * row.surveyCount
        existing.craftSum += row.craftAvg * row.surveyCount
        existing.profSum += row.profAvg * row.surveyCount
        existing.ltrCount += row.surveyCount
        existing.craftCount += row.surveyCount
        existing.profCount += row.surveyCount
      } else {
        aggregatedMap.set(row.workroom, {
          workroom: row.workroom,
          totalSurveys: row.surveyCount,
          ltrSum: row.ltrAvg * row.surveyCount,
          craftSum: row.craftAvg * row.surveyCount,
          profSum: row.profAvg * row.surveyCount,
          ltrCount: row.surveyCount,
          craftCount: row.surveyCount,
          profCount: row.surveyCount,
        })
      }
    })

    const aggregatedChartData = Array.from(aggregatedMap.values())
      .map((item) => ({
        workroom: item.workroom,
        surveyCount: item.totalSurveys,
        ltrAvg: item.ltrCount > 0 ? item.ltrSum / item.ltrCount : 0,
        craftAvg: item.craftCount > 0 ? item.craftSum / item.craftCount : 0,
        profAvg: item.profCount > 0 ? item.profSum / item.profCount : 0,
      }))
      .sort((a, b) => b.surveyCount - a.surveyCount)
      .slice(0, 15)

    return { rows, chartData, aggregatedChartData, uniqueWorkrooms, uniqueCategories }
  }, [data.workrooms])

  const filteredRows = rows.filter((row) => {
    const matchesWorkroom = selectedWorkroom === 'all' || row.workroom === selectedWorkroom
    const matchesCategory = selectedCategory === 'all' || row.laborCategory === selectedCategory
    return matchesWorkroom && matchesCategory
  })

  // Use aggregated chart data for the bar chart (grouped by workroom only)
  const filteredChartData = aggregatedChartData.filter((row) => {
    const matchesWorkroom = selectedWorkroom === 'all' || row.workroom === selectedWorkroom
    return matchesWorkroom
  }).slice(0, 15)

  const hasData = rows.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Survey Misc</h2>
          <p className="text-gray-600">
            Workroom-level LTR, Craft, and Prof averages with Labor Category filters
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">No survey data available</p>
          <p className="text-gray-400 text-sm">
            Upload a file with survey scores (LTR, Craft, Prof) to see workroom-level survey analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Global dashboard cards (based on entire imported file, not filters) */}
          {rows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {(() => {
                const totalSurveys = rows.reduce((sum, r) => sum + r.surveyCount, 0)
                const ltrWeighted =
                  rows.reduce((sum, r) => sum + r.ltrAvg * r.surveyCount, 0) / (totalSurveys || 1)
                const craftWeighted =
                  rows.reduce((sum, r) => sum + r.craftAvg * r.surveyCount, 0) / (totalSurveys || 1)
                const profWeighted =
                  rows.reduce((sum, r) => sum + r.profAvg * r.surveyCount, 0) / (totalSurveys || 1)

                const uniqueWorkroomKeys = new Set(rows.map((r) => r.workroom))

                const cards = [
                  {
                    label: 'Total Surveys (All Workrooms)',
                    value: totalSurveys,
                    sub: 'Based on all imported survey records',
                  },
                  {
                    label: 'Avg LTR Score (All Workrooms)',
                    value: isNaN(ltrWeighted) ? null : ltrWeighted,
                    sub: 'Weighted by survey count',
                  },
                  {
                    label: 'Avg Craft Score (All Workrooms)',
                    value: isNaN(craftWeighted) ? null : craftWeighted,
                    sub: 'Across the entire file',
                  },
                  {
                    label: 'Avg Prof Score (All Workrooms)',
                    value: isNaN(profWeighted) ? null : profWeighted,
                    sub: `${uniqueWorkroomKeys.size} workrooms represented`,
                  },
                ]

                return cards.map((card) => (
                  <div
                    key={card.label}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3"
                  >
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {card.label}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {typeof card.value === 'number' ? (
                        <CountUpNumber
                          value={card.value}
                          duration={1.2}
                          decimals={card.label.startsWith('Total') ? 0 : 1}
                        />
                      ) : (
                        '—'
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{card.sub}</div>
                  </div>
                ))
              })()}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Workroom
              </label>
              <select
                value={selectedWorkroom}
                onChange={(e) => setSelectedWorkroom(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Workrooms</option>
                {uniqueWorkrooms.map((workroom) => (
                  <option key={workroom} value={workroom}>
                    {workroom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Labor Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Metric View
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'all' | 'ltr' | 'craft' | 'prof')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All (LTR, Craft, Prof)</option>
                <option value="ltr">LTR only</option>
                <option value="craft">Craft only</option>
                <option value="prof">Prof only</option>
              </select>
            </div>
          </div>

          {/* Chart */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                LTR by Workroom (with Craft &amp; Prof Averages)
              </h3>
              <p className="text-xs text-gray-500">
                Showing {filteredChartData.length} workroom{filteredChartData.length !== 1 ? 's' : ''} (aggregated data)
              </p>
            </div>
            {filteredChartData.length === 0 ? (
              <div
                style={{
                  height: '260px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                No survey scores for the selected filters.
              </div>
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredChartData}
                    margin={{ top: 10, right: 20, bottom: 40, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="workroom"
                      angle={-35}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      label={{
                        value: 'Average Score',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11 },
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => value.toFixed(1)}
                      labelFormatter={(label) => {
                        const dataPoint = filteredChartData.find(d => d.workroom === label)
                        return `Workroom: ${label}${dataPoint ? ` (${dataPoint.surveyCount} survey${dataPoint.surveyCount !== 1 ? 's' : ''})` : ''}`
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {/* Colorful bars for clearer separation */}
                    {(selectedMetric === 'all' || selectedMetric === 'ltr') && (
                      <Bar dataKey="ltrAvg" name="LTR Avg" fill="#3b82f6" /> // blue
                    )}
                    {(selectedMetric === 'all' || selectedMetric === 'craft') && (
                      <Bar dataKey="craftAvg" name="Craft Avg" fill="#10b981" /> // green
                    )}
                    {(selectedMetric === 'all' || selectedMetric === 'prof') && (
                      <Bar dataKey="profAvg" name="Prof Avg" fill="#ef4444" /> // red
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Table */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="professional-table-wrapper">
              <div className="professional-table-header">
                <div>
                  <div className="professional-table-title">
                    Workroom Survey Metrics
                  </div>
                  <div className="professional-table-subtitle">
                    Workroom, labor category, survey count, and average scores
                  </div>
                </div>
                {/* Removed combinations badge to simplify header */}
              </div>

              <div className="professional-table-container">
                <table className="professional-table professional-table-zebra">
                  <thead>
                    <tr>
                      <th>Workroom</th>
                      <th>Store #</th>
                      <th>Store Name</th>
                      <th>Labor Category</th>
                      <th style={{ textAlign: 'right' }}>Surveys</th>
                      <th style={{ textAlign: 'right' }}>LTR Avg</th>
                      <th style={{ textAlign: 'right' }}>Craft Avg</th>
                      <th style={{ textAlign: 'right' }}>Prof Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const getScoreBadge = (score: number | null | undefined) => {
                        if (score === null || score === undefined) {
                          return 'badge-neutral'
                        }
                        // Green for scores above 9.0 (0–10 scale)
                        if (score > 9) return 'badge-positive'
                        // Yellow for anything 9.0 or below (still passing but needs attention)
                        return 'badge-warning'
                      }

                      const formatScore = (score: number | null | undefined): string => {
                        if (score === null || score === undefined) return '—'
                        return score.toFixed(1)
                      }

                      return (
                        <tr 
                          key={`${row.storeNumber}-${row.workroom}-${row.laborCategory}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedRow(row)
                            setIsDialogOpen(true)
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = ''
                          }}
                        >
                          <td>{row.workroom}</td>
                          <td>{row.storeNumber || '—'}</td>
                          <td>{row.storeName || '—'}</td>
                          <td>{row.laborCategory}</td>
                          <td style={{ textAlign: 'right' }}>{row.surveyCount}</td>
                          <td style={{ textAlign: 'right' }}>
                            {row.ltrAvg !== 0 ? (
                              <span
                                className={`badge-pill ${getScoreBadge(row.ltrAvg)}`}
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                              >
                                {formatScore(row.ltrAvg)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {row.craftAvg !== 0 ? (
                              <span
                                className={`badge-pill ${getScoreBadge(row.craftAvg)}`}
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                              >
                                {formatScore(row.craftAvg)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {row.profAvg !== 0 ? (
                              <span
                                className={`badge-pill ${getScoreBadge(row.profAvg)}`}
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                              >
                                {formatScore(row.profAvg)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
                          No survey metrics for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Survey Details Dialog */}
      {isDialogOpen && selectedRow && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setIsDialogOpen(false)
            setSelectedRow(null)
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                Survey Details - {selectedRow.workroom}
              </h2>
              <button
                onClick={() => {
                  setIsDialogOpen(false)
                  setSelectedRow(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Store #:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{selectedRow.storeNumber || '—'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Store Name:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{selectedRow.storeName || '—'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Labor Category:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{selectedRow.laborCategory}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Total Surveys:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{selectedRow.surveyCount}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                Average Scores
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>LTR Avg</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                    {selectedRow.ltrAvg !== 0 ? (
                      <CountUpNumber value={selectedRow.ltrAvg} duration={1000} decimals={1} />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Craft Avg</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                    {selectedRow.craftAvg !== 0 ? (
                      <CountUpNumber value={selectedRow.craftAvg} duration={1000} decimals={1} />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Prof Avg</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                    {selectedRow.profAvg !== 0 ? (
                      <CountUpNumber value={selectedRow.profAvg} duration={1000} decimals={1} />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Survey Records */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                Individual Survey Records ({(() => {
                  const matchingRecords = data.workrooms.filter((w) => {
                    const matchesWorkroom = w.name === selectedRow.workroom
                    const matchesStore = String(w.store) === selectedRow.storeNumber
                    const matchesCategory = (w.laborCategory || (w as any).category || 'N/A') === selectedRow.laborCategory
                    const hasSurveyData = w.ltrScore != null || w.craftScore != null || w.profScore != null || w.surveyDate || w.surveyComment
                    return matchesWorkroom && matchesStore && matchesCategory && hasSurveyData
                  })
                  return matchingRecords.length
                })()})
              </h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {(() => {
                  const matchingRecords = data.workrooms.filter((w) => {
                    const matchesWorkroom = w.name === selectedRow.workroom
                    const matchesStore = String(w.store) === selectedRow.storeNumber
                    const matchesCategory = (w.laborCategory || (w as any).category || 'N/A') === selectedRow.laborCategory
                    const hasSurveyData = w.ltrScore != null || w.craftScore != null || w.profScore != null || w.surveyDate || w.surveyComment
                    return matchesWorkroom && matchesStore && matchesCategory && hasSurveyData
                  })

                  const formatDate = (date: string | number | Date | null | undefined): string => {
                    if (!date) return 'N/A'
                    try {
                      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
                      if (isNaN(dateObj.getTime())) return 'N/A'
                      return dateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    } catch {
                      return String(date)
                    }
                  }

                  const getScoreBadge = (score: number | null | undefined) => {
                    if (score === null || score === undefined) return 'badge-neutral'
                    if (score > 9) return 'badge-positive'
                    return 'badge-warning'
                  }

                  if (matchingRecords.length === 0) {
                    return (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af' }}>
                        No individual survey records found.
                      </div>
                    )
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {matchingRecords.map((record, index) => (
                        <div
                          key={record.id || index}
                          style={{
                            padding: '1rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            {record.surveyDate && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Survey Date</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{formatDate(record.surveyDate)}</div>
                              </div>
                            )}
                            {record.ltrScore != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>LTR Score</div>
                                <span className={`badge-pill ${getScoreBadge(record.ltrScore)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                                  <CountUpNumber value={record.ltrScore} duration={800} decimals={1} />
                                </span>
                              </div>
                            )}
                            {record.craftScore != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Craft Score</div>
                                <span className={`badge-pill ${getScoreBadge(record.craftScore)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                                  <CountUpNumber value={record.craftScore} duration={800} decimals={1} />
                                </span>
                              </div>
                            )}
                            {record.profScore != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Professional Score</div>
                                <span className={`badge-pill ${getScoreBadge(record.profScore)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                                  <CountUpNumber value={record.profScore} duration={800} decimals={1} />
                                </span>
                              </div>
                            )}
                            {record.reliableHomeImprovementScore != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Home Improvement Score</div>
                                <span className={`badge-pill ${getScoreBadge(record.reliableHomeImprovementScore)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                                  <CountUpNumber value={record.reliableHomeImprovementScore} duration={800} decimals={1} />
                                </span>
                              </div>
                            )}
                            {record.projectValueScore != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Project Value Score</div>
                                <span className={`badge-pill ${getScoreBadge(record.projectValueScore)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                                  <CountUpNumber value={record.projectValueScore} duration={800} decimals={1} />
                                </span>
                              </div>
                            )}
                            {record.installerKnowledgeScore != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Installer Knowledge Score</div>
                                <span className={`badge-pill ${getScoreBadge(record.installerKnowledgeScore)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                                  <CountUpNumber value={record.installerKnowledgeScore} duration={800} decimals={1} />
                                </span>
                              </div>
                            )}
                            {record.timeTakenToComplete != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Time Taken to Complete</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                                  <CountUpNumber value={record.timeTakenToComplete} duration={800} decimals={0} suffix=" days" />
                                </div>
                              </div>
                            )}
                          </div>
                          {record.surveyComment && (
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 600 }}>Survey Comment</div>
                              <div
                                style={{
                                  fontSize: '0.875rem',
                                  color: '#111827',
                                  lineHeight: '1.6',
                                  textAlign: 'left',
                                  wordWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  padding: '0.75rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #e5e7eb',
                                }}
                              >
                                {record.surveyComment}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


