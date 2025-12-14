'use client'

import { useMemo, useState, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/components/AuthContext'
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
  Cell,
  LabelList,
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

const cleanStoreName = (storeName: string | null | undefined): string => {
  if (!storeName) return '—'
  return storeName.replace(/^LOWE'S OF\s+/i, '').trim() || '—'
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
  weightedAvg: number // Weighted average: (L*0.60 + M*0.20 + N*0.10 + P*0.02 + Q*0.03)
  company?: string
  installerName?: string
  poNumber?: string | number
}

export default function SurveyMisc() {
  const { data } = useData()
  const { user } = useAuth()
  const [userWorkroom, setUserWorkroom] = useState<string | null>(null)
  const [tableWorkroomFilter, setTableWorkroomFilter] = useState<string>('all')
  
  // Load user's workroom from profile
  useEffect(() => {
    if (user?.email) {
      const loadUserWorkroom = async () => {
        try {
          const authHeader = user.email
          const response = await fetch('/api/user-profile', {
            headers: {
              Authorization: `Bearer ${authHeader}`,
            },
          })

          if (response.ok) {
            const profileData = await response.json()
            setUserWorkroom(profileData.workroom || null)
          } else {
            // Try localStorage as fallback
            const stored = localStorage.getItem('fis-user-profile')
            if (stored) {
              const parsed = JSON.parse(stored)
              setUserWorkroom(parsed.workroom || null)
            }
          }
        } catch (error) {
          console.error('Error loading user workroom:', error)
          // Try localStorage as fallback
          const stored = localStorage.getItem('fis-user-profile')
          if (stored) {
            const parsed = JSON.parse(stored)
            setUserWorkroom(parsed.workroom || null)
          }
        }
      }
      loadUserWorkroom()
    }
  }, [user?.email])
  
  // Debug: Log survey data availability
  useEffect(() => {
    const surveyWorkrooms = data.workrooms.filter((w) => 
      w.ltrScore != null || w.craftScore != null || w.profScore != null
    )
    console.log('📊 [SurveyMisc] Total workrooms:', data.workrooms.length)
    console.log('📊 [SurveyMisc] Survey workrooms (with ltr/craft/prof):', surveyWorkrooms.length)
    if (surveyWorkrooms.length > 0) {
      console.log('📊 [SurveyMisc] Sample survey workroom:', {
        name: surveyWorkrooms[0].name,
        ltrScore: surveyWorkrooms[0].ltrScore,
        craftScore: surveyWorkrooms[0].craftScore,
        profScore: surveyWorkrooms[0].profScore,
        company: surveyWorkrooms[0].company,
        installerName: surveyWorkrooms[0].installerName
      })
    } else {
      console.log('⚠️ [SurveyMisc] No survey workrooms found! Checking all workrooms...')
      data.workrooms.slice(0, 3).forEach((w, i) => {
        console.log(`📊 [SurveyMisc] Workroom ${i + 1}:`, {
          name: w.name,
          hasLtrScore: w.ltrScore != null,
          hasCraftScore: w.craftScore != null,
          hasProfScore: w.profScore != null,
          hasSales: w.sales != null,
          keys: Object.keys(w).filter(k => k.includes('Score') || k.includes('score') || k.includes('ltr') || k.includes('craft') || k.includes('prof'))
        })
      })
    }
  }, [data.workrooms])
  
  const [selectedWorkroom, setSelectedWorkroom] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'ltr' | 'craft' | 'prof'>('all')
  const [sortBy, setSortBy] = useState<'none' | 'top' | 'bottom'>('none')
  const [sortMetric, setSortMetric] = useState<'ltr' | 'craft' | 'prof'>('ltr')
  const [sortCount, setSortCount] = useState<number>(10)
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
        columnMSum: number
        columnNSum: number
        columnPSum: number
        columnQSum: number
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
      const company = w.company || (w as any).company || ''
      const installerName = w.installerName || (w as any).installerName || ''
      const poNumber = w.poNumber || (w as any).poNumber || ''
      // Group by installer name and company instead of store/workroom/category
      const key = `${installerName}|||${company}`
        const existing =
        map.get(key) || {
          workroom: workroomName, // Keep first workroom found
          laborCategory, // Keep first labor category found
          storeNumber, // Keep first store number found
          storeName, // Keep first store name found
          surveyCount: 0,
          ltrAvg: 0,
          craftAvg: 0,
          profAvg: 0,
          weightedAvg: 0,
          company: company.trim() || '',
          installerName: installerName.trim() || '',
          poNumber: poNumber ? String(poNumber).trim() : '',
          ltrSum: 0,
          craftSum: 0,
          profSum: 0,
          columnMSum: 0,
          columnNSum: 0,
          columnPSum: 0,
          columnQSum: 0,
          count: 0,
        }

      existing.surveyCount += 1
      existing.count += 1
      if (w.ltrScore != null) existing.ltrSum += w.ltrScore
      if (w.craftScore != null) existing.craftSum += w.craftScore
      if (w.profScore != null) existing.profSum += w.profScore
      if (w.columnM != null) existing.columnMSum += w.columnM
      if (w.columnN != null) existing.columnNSum += w.columnN
      if (w.columnP != null) existing.columnPSum += w.columnP
      if (w.columnQ != null) existing.columnQSum += w.columnQ

      map.set(key, existing)
    })

    const rows: WorkroomSurveyRow[] = Array.from(map.values())
      .map((r) => {
        // Calculate weighted average: (L*0.60 + M*0.20 + N*0.10 + P*0.02 + Q*0.03)
        const ltrAvg = r.count > 0 ? r.ltrSum / r.count : 0
        const columnMAvg = r.count > 0 ? r.columnMSum / r.count : 0
        const columnNAvg = r.count > 0 ? r.columnNSum / r.count : 0
        const columnPAvg = r.count > 0 ? r.columnPSum / r.count : 0
        const columnQAvg = r.count > 0 ? r.columnQSum / r.count : 0
        const weightedAvg = (ltrAvg * 0.60) + (columnMAvg * 0.20) + (columnNAvg * 0.10) + (columnPAvg * 0.02) + (columnQAvg * 0.03)
        
        return {
          workroom: r.workroom,
          laborCategory: r.laborCategory,
          storeNumber: r.storeNumber,
          storeName: r.storeName,
          surveyCount: r.surveyCount,
          ltrAvg,
          craftAvg: r.count > 0 ? r.craftSum / r.count : 0,
          profAvg: r.count > 0 ? r.profSum / r.count : 0,
          weightedAvg,
          company: r.company,
          installerName: r.installerName,
          poNumber: r.poNumber,
        }
      })
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

  const filteredRows = useMemo(() => {
    let filtered = rows.filter((row) => {
      // Use tableWorkroomFilter for table, with special handling for "my-workroom"
      let matchesWorkroom = true
      if (tableWorkroomFilter === 'my-workroom') {
        matchesWorkroom = userWorkroom ? row.workroom === userWorkroom : false
      } else if (tableWorkroomFilter !== 'all') {
        matchesWorkroom = row.workroom === tableWorkroomFilter
      }
      
      const matchesCategory = selectedCategory === 'all' || row.laborCategory === selectedCategory
      return matchesWorkroom && matchesCategory
    })

    // Apply top/bottom sorting if enabled
    if (sortBy !== 'none') {
      // Get the appropriate score based on sortMetric
      const getScore = (row: WorkroomSurveyRow): number => {
        if (sortMetric === 'ltr') {
          return row.ltrAvg
        } else if (sortMetric === 'craft') {
          return row.craftAvg
        } else {
          return row.profAvg
        }
      }

      // Sort by the selected metric
      filtered = [...filtered].sort((a, b) => {
        const scoreA = getScore(a)
        const scoreB = getScore(b)
        return sortBy === 'top' ? scoreB - scoreA : scoreA - scoreB
      })

      // Limit to top/bottom N
      filtered = filtered.slice(0, sortCount)
    }

    return filtered
  }, [rows, tableWorkroomFilter, userWorkroom, selectedCategory, sortBy, sortMetric, sortCount, data.workrooms])

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
          {/* Dashboard - Direct from Excel File Data */}
          {(() => {
            // Use raw column L values directly from Excel file (stored during upload)
            // This ensures we're using the exact values from the Excel file, not processed data
            const columnLValues = data.rawColumnLValues || []
            
            // Fallback: if raw values not available, extract from survey records
            const surveyRecords = data.workrooms.filter((w) => 
              (w.ltrScore != null || w.craftScore != null || w.profScore != null || 
               w.surveyDate != null || w.surveyComment != null) &&
              !((w.sales != null || w.laborPO != null || w.vendorDebit != null) &&
                !(w.ltrScore != null || w.craftScore != null || w.profScore != null))
            )
            
            // Use raw values if available, otherwise fallback to extracted values
            const finalColumnLValues = columnLValues.length > 0 
              ? columnLValues 
              : surveyRecords
                  .map((w) => w.ltrScore)
                  .filter((score): score is number => 
                    score != null && typeof score === 'number' && !isNaN(score)
                  )

            // Calculate statistics directly from Excel file column L values
            // Use actual total rows from Excel file (stored during upload)
            const totalRows = data.excelFileTotalRows || surveyRecords.length
            const rowsWithLTR = finalColumnLValues.length
            const avgLTR = finalColumnLValues.length > 0
              ? finalColumnLValues.reduce((sum, val) => sum + val, 0) / finalColumnLValues.length
              : null
            const minLTR = finalColumnLValues.length > 0 ? Math.min(...finalColumnLValues) : null
            const maxLTR = finalColumnLValues.length > 0 ? Math.max(...finalColumnLValues) : null

            // Count workrooms
            const uniqueWorkrooms = new Set(surveyRecords.map((w) => w.name).filter(Boolean))

            // Get Craft scores DIRECTLY from Excel file (raw data stored during upload)
            const craftScores = data.rawCraftValues || []
            const avgCraft = craftScores.length > 0
              ? craftScores.reduce((sum, val) => sum + val, 0) / craftScores.length
              : null

            // Get Labor Categories DIRECTLY from Excel file (raw data stored during upload)
            const laborCategories = data.rawLaborCategories || []
            const categoryCounts = new Map<string, number>()
            laborCategories.forEach((category) => {
              categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
            })
            const topCategory = Array.from(categoryCounts.entries())
              .sort((a, b) => b[1] - a[1])[0]

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-sm px-4 py-4">
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                    Total Surveys
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-1">
                    <CountUpNumber value={totalRows} duration={1.2} decimals={0} />
                  </div>
                  <div className="text-xs text-blue-600">
                    {rowsWithLTR} entries include LTR scores
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg shadow-sm px-4 py-4">
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                    Average LTR Score
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-1">
                    {avgLTR != null ? (
                      <CountUpNumber value={avgLTR} duration={1.2} decimals={2} />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-xs text-green-600">
                    Based on {rowsWithLTR} LTR values
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg shadow-sm px-4 py-4">
                  <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                    Average Craft Score
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mb-1">
                    {avgCraft != null ? (
                      <CountUpNumber value={avgCraft} duration={1.2} decimals={2} />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-xs text-purple-600">
                    Based on {craftScores.length} craft values
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg shadow-sm px-4 py-4">
                  <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                    Top Labor Category
                  </div>
                  <div className="text-2xl font-bold text-orange-900 mb-1">
                    {topCategory ? (
                      <>
                        {topCategory[0]}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-xs text-orange-600">
                    {topCategory ? `${topCategory[1]} surveys` : 'No data'}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    {/* Color-coded bars: Grade-based colors (green/yellow/red) for all metrics */}
                    {/* Labels are shown directly on bars instead of using legend */}
                    {(selectedMetric === 'all' || selectedMetric === 'ltr') && (
                      <Bar dataKey="ltrAvg" name="LTR Avg" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {filteredChartData.map((entry, index) => {
                          // Grade-based colors without border
                          let fillColor = '#10b981' // green - excellent (> 9)
                          if (entry.ltrAvg > 9) fillColor = '#10b981' // green - excellent
                          else if (entry.ltrAvg >= 7) fillColor = '#fbbf24' // yellow - moderate
                          else fillColor = '#ef4444' // red - needs improvement
                          return <Cell key={`cell-ltr-${index}`} fill={fillColor} />
                        })}
                        <LabelList dataKey="ltrAvg" content={({ value, x, y, width, height }: any) => {
                          if (!value || value === 0) return null
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 5}
                              fill="#1f2937"
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                            >
                              LTR
                            </text>
                          )
                        }} />
                      </Bar>
                    )}
                    {(selectedMetric === 'all' || selectedMetric === 'craft') && (
                      <Bar dataKey="craftAvg" name="Craft Avg" fill="#10b981" radius={[4, 4, 0, 0]}>
                        {filteredChartData.map((entry, index) => {
                          // Grade-based colors without border
                          let fillColor = '#10b981' // green - excellent (> 9)
                          if (entry.craftAvg > 9) fillColor = '#10b981' // green - excellent
                          else if (entry.craftAvg >= 7) fillColor = '#fbbf24' // yellow - moderate
                          else fillColor = '#ef4444' // red - needs improvement
                          return <Cell key={`cell-craft-${index}`} fill={fillColor} />
                        })}
                        <LabelList dataKey="craftAvg" content={({ value, x, y, width, height }: any) => {
                          if (!value || value === 0) return null
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 5}
                              fill="#1f2937"
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                            >
                              Craft
                            </text>
                          )
                        }} />
                      </Bar>
                    )}
                    {(selectedMetric === 'all' || selectedMetric === 'prof') && (
                      <Bar dataKey="profAvg" name="Prof Avg" fill="#ef4444" radius={[4, 4, 0, 0]}>
                        {filteredChartData.map((entry, index) => {
                          // Grade-based colors without border
                          let fillColor = '#10b981' // green - excellent (> 9)
                          if (entry.profAvg > 9) fillColor = '#10b981' // green - excellent
                          else if (entry.profAvg >= 7) fillColor = '#fbbf24' // yellow - moderate
                          else fillColor = '#ef4444' // red - needs improvement
                          return <Cell key={`cell-prof-${index}`} fill={fillColor} />
                        })}
                        <LabelList dataKey="profAvg" content={({ value, x, y, width, height }: any) => {
                          if (!value || value === 0) return null
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 5}
                              fill="#1f2937"
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                            >
                              Prof
                            </text>
                          )
                        }} />
                      </Bar>
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

              {/* Sorting Controls */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Workroom
                    </label>
                    <select
                      value={tableWorkroomFilter}
                      onChange={(e) => setTableWorkroomFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">All Workrooms</option>
                      {userWorkroom && (
                        <option value="my-workroom">My Workroom ({userWorkroom})</option>
                      )}
                      {uniqueWorkrooms.map((workroom) => (
                        <option key={workroom} value={workroom}>
                          {workroom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'none' | 'top' | 'bottom')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="none">No Sorting</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Metric
                    </label>
                    <select
                      value={sortMetric}
                      onChange={(e) => setSortMetric(e.target.value as 'ltr' | 'craft' | 'prof')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="ltr">LTR</option>
                      <option value="craft">Craft</option>
                      <option value="prof">Prof</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Count
                    </label>
                    <select
                      value={sortCount}
                      onChange={(e) => setSortCount(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value={5}>Top/Bottom 5</option>
                      <option value={10}>Top/Bottom 10</option>
                      <option value={20}>Top/Bottom 20</option>
                      <option value={50}>Top/Bottom 50</option>
                      <option value={100}>Top/Bottom 100</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="professional-table-container">
                <table className="professional-table professional-table-zebra">
                  <thead>
                    <tr>
                      <th>Workroom</th>
                      <th>Company name</th>
                      <th>Installer Name</th>
                      <th style={{ textAlign: 'right' }}>Surveys</th>
                      <th style={{ textAlign: 'right' }}>Weighted Avg</th>
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
                          key={`${row.installerName}-${row.company}`}
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
                          <td>{row.company || '—'}</td>
                          <td>{row.installerName || '—'}</td>
                          <td style={{ textAlign: 'right' }}>{row.surveyCount}</td>
                          <td style={{ textAlign: 'right' }}>
                            {row.weightedAvg != null && !isNaN(row.weightedAvg) ? (
                              <span
                                className={`badge-pill ${getScoreBadge(row.weightedAvg)}`}
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                              >
                                {formatScore(row.weightedAvg)}
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
                        <td colSpan={9} style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
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
              maxWidth: '900px',
              width: '90%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
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

            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Store Name:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{cleanStoreName(selectedRow.storeName)}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Labor Category:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{selectedRow.laborCategory}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Company name:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{selectedRow.company || '—'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Installer Name:</span>
                  <span style={{ marginLeft: '0.5rem', color: '#111827' }}>{selectedRow.installerName || '—'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem', flexShrink: 0 }}>
                Individual Survey Records ({(() => {
                  const matchingRecords = data.workrooms.filter((w) => {
                    const matchesInstaller = (w.installerName || (w as any).installerName || '').trim() === (selectedRow.installerName || '').trim()
                    const matchesCompany = (w.company || (w as any).company || '').trim() === (selectedRow.company || '').trim()
                    const hasSurveyData = w.ltrScore != null || w.craftScore != null || w.profScore != null || w.surveyDate || w.surveyComment
                    return matchesInstaller && matchesCompany && hasSurveyData
                  })
                  
                  // Remove duplicates
                  const seen = new Set<string>()
                  const uniqueRecords = matchingRecords.filter((w) => {
                    const dateKey = w.surveyDate ? String(w.surveyDate) : ''
                    const ltrKey = w.ltrScore != null ? String(w.ltrScore) : ''
                    const craftKey = w.craftScore != null ? String(w.craftScore) : ''
                    const profKey = w.profScore != null ? String(w.profScore) : ''
                    const commentKey = w.surveyComment ? String(w.surveyComment).substring(0, 50) : ''
                    const uniqueKey = `${dateKey}|${ltrKey}|${craftKey}|${profKey}|${commentKey}`
                    if (seen.has(uniqueKey)) return false
                    seen.add(uniqueKey)
                    return true
                  })
                  
                  return uniqueRecords.length
                })()})
              </h3>
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                {(() => {
                  // Filter matching records by installer name and company
                  const matchingRecords = data.workrooms.filter((w) => {
                    const matchesInstaller = (w.installerName || (w as any).installerName || '').trim() === (selectedRow.installerName || '').trim()
                    const matchesCompany = (w.company || (w as any).company || '').trim() === (selectedRow.company || '').trim()
                    const hasSurveyData = w.ltrScore != null || w.craftScore != null || w.profScore != null || w.surveyDate || w.surveyComment
                    return matchesInstaller && matchesCompany && hasSurveyData
                  })

                  // Remove duplicates by creating a unique key for each record
                  const seen = new Set<string>()
                  const uniqueRecords = matchingRecords.filter((w) => {
                    // Create unique key from date, scores, and comment
                    const dateKey = w.surveyDate ? String(w.surveyDate) : ''
                    const ltrKey = w.ltrScore != null ? String(w.ltrScore) : ''
                    const craftKey = w.craftScore != null ? String(w.craftScore) : ''
                    const profKey = w.profScore != null ? String(w.profScore) : ''
                    const commentKey = w.surveyComment ? String(w.surveyComment).substring(0, 50) : ''
                    const uniqueKey = `${dateKey}|${ltrKey}|${craftKey}|${profKey}|${commentKey}`
                    
                    if (seen.has(uniqueKey)) {
                      return false // Duplicate
                    }
                    seen.add(uniqueKey)
                    return true
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

                  if (uniqueRecords.length === 0) {
                    return (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af' }}>
                        No individual survey records found.
                      </div>
                    )
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {uniqueRecords.map((record, index) => (
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


