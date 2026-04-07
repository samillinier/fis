'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import Layout from '@/components/Layout'
import Q1GoalsUpload from '@/components/Q1GoalsUpload'
import StoreWeeklyForecastUpload from '@/components/StoreWeeklyForecastUpload'
import SalesLastWeekDistrictPivot from '@/components/SalesLastWeekDistrictPivot'
import { TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react'
import { getWorkroomForDistrict, getWorkroomsForDistrictAsString } from '@/data/districtToWorkroom'
import { getStoreName } from '@/data/storeNames'
import { storeLocations } from '@/data/storeLocations'

interface Goal {
  id: string
  district: string
  provider: string | null
  week_number: number
  category: string
  planned_count: number
  comparable_count?: number
}

interface WeeklyCount {
  id: string
  district: string
  week_number: number
  category: string
  actual_count: number
  week_start_date: string | null
  week_end_date: string | null
  data_source: string
}

interface StoreForecast {
  id: string
  district: string
  store: string
  district_q1_jobs: number
  pct_of_district: number
  store_q1_job_forecast: number
  week_number: number
  jobs_needed: number
  workroom: string | null
}

export default function LowesQ1TrackerPage() {
  const { user, isAdmin, isOwner } = useAuth()
  const canViewAdminUploads = isAdmin || isOwner
  const { showNotification } = useNotification()
  const [goals, setGoals] = useState<Goal[]>([])
  const [counts, setCounts] = useState<WeeklyCount[]>([])
  const [storeForecasts, setStoreForecasts] = useState<StoreForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all')
  const [selectedWeek, setSelectedWeek] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [forecastView, setForecastView] = useState<'store' | 'district'>('store')
  const [selectedForecastDistrict, setSelectedForecastDistrict] = useState<string>('all')
  const [selectedForecastStore, setSelectedForecastStore] = useState<string>('all')
  const [selectedForecastWorkroom, setSelectedForecastWorkroom] = useState<string>('all')
  const [showStoreForecastsSection, setShowStoreForecastsSection] = useState<boolean>(false)
  const [showDataTable, setShowDataTable] = useState<boolean>(false)

  useEffect(() => {
    // Load public tracker data even before auth resolves; we can re-load after sign-in.
    loadData()
  }, [user?.email])

  const loadData = async () => {
    setLoading(true)
    try {
      const authHeader = user?.email || ''
      const [goalsResponse, countsResponse, forecastsResponse] = await Promise.all([
        fetch('/api/lowes-q1-goals', {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        }),
        fetch('/api/lowes-weekly-counts', {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        }),
        fetch('/api/lowes-store-weekly-forecasts', {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        }),
      ])

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(goalsData.goals || [])
      }

      if (countsResponse.ok) {
        const countsData = await countsResponse.json()
        setCounts(countsData.counts || [])
      }

      if (forecastsResponse.ok) {
        const forecastsData = await forecastsResponse.json()
        setStoreForecasts(forecastsData.forecasts || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showNotification('Failed to load tracker data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Get unique districts, weeks, and categories
  const districts = useMemo(() => {
    const districtSet = new Set<string>()
    goals.forEach(g => districtSet.add(g.district))
    counts.forEach(c => districtSet.add(c.district))
    return Array.from(districtSet).sort((a, b) => {
      const numA = parseInt(a) || 0
      const numB = parseInt(b) || 0
      return numA - numB
    })
  }, [goals, counts])

  const weeks = useMemo(() => {
    const weekSet = new Set<number>()
    goals.forEach(g => weekSet.add(g.week_number))
    counts.forEach(c => weekSet.add(c.week_number))
    return Array.from(weekSet).sort((a, b) => a - b)
  }, [goals, counts])

  const categories = ['CARPET', 'HSF', 'TILE', 'TOTAL']

  // Get unique stores from forecasts for filtering
  const uniqueForecastStores = useMemo(() => {
    const storeSet = new Set<string>()
    storeForecasts.forEach(f => storeSet.add(f.store))
    return Array.from(storeSet).sort((a, b) => parseInt(a) - parseInt(b))
  }, [storeForecasts])

  // Get unique workrooms from forecasts for filtering
  // Use the workroom field from forecast data, or look it up from storeLocations
  const uniqueWorkrooms = useMemo(() => {
    const workroomSet = new Set<string>()
    storeForecasts.forEach(f => {
      // Use workroom from forecast data if available
      if (f.workroom) {
        workroomSet.add(f.workroom.toUpperCase())
      }
    })
    return Array.from(workroomSet).sort()
  }, [storeForecasts])

  // Color scheme for weeks (13 weeks for Q1)
  const getWeekColor = (week: number): string => {
    const colors = [
      '#3B82F6', // Blue - Week 1
      '#10B981', // Green - Week 2
      '#F59E0B', // Amber - Week 3
      '#EF4444', // Red - Week 4
      '#8B5CF6', // Purple - Week 5
      '#EC4899', // Pink - Week 6
      '#06B6D4', // Cyan - Week 7
      '#84CC16', // Lime - Week 8
      '#F97316', // Orange - Week 9
      '#6366F1', // Indigo - Week 10
      '#14B8A6', // Teal - Week 11
      '#F43F5E', // Rose - Week 12
      '#A855F7', // Violet - Week 13
    ]
    return colors[(week - 1) % colors.length] || '#6B7280'
  }

  const getWeekBgColor = (week: number): string => {
    const color = getWeekColor(week)
    // Return a lighter version for background
    return color + '15' // Add 15 for ~8% opacity
  }

  // Filter data based on selections
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (selectedDistrict !== 'all' && g.district !== selectedDistrict) return false
      if (selectedWeek !== 'all' && g.week_number !== parseInt(selectedWeek)) return false
      if (selectedCategory !== 'all' && g.category !== selectedCategory) return false
      return true
    })
  }, [goals, selectedDistrict, selectedWeek, selectedCategory])

  const filteredCounts = useMemo(() => {
    return counts.filter(c => {
      if (selectedDistrict !== 'all' && c.district !== selectedDistrict) return false
      if (selectedWeek !== 'all' && c.week_number !== parseInt(selectedWeek)) return false
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false
      return true
    })
  }, [counts, selectedDistrict, selectedWeek, selectedCategory])

  // Create combined view by district, week, and category
  const trackerData = useMemo(() => {
    const dataMap = new Map<string, {
      district: string
      week: number
      category: string
      planned: number
      comparable: number
      actual: number
      variance: number
      percentComplete: number
    }>()

    // Add goals
    filteredGoals.forEach(goal => {
      const key = `${goal.district}-${goal.week_number}-${goal.category}`
      dataMap.set(key, {
        district: goal.district,
        week: goal.week_number,
        category: goal.category,
        planned: goal.planned_count,
        comparable: goal.comparable_count || 0,
        actual: 0,
        variance: -goal.planned_count,
        percentComplete: 0
      })
    })

    // Add actual counts
    filteredCounts.forEach(count => {
      const key = `${count.district}-${count.week_number}-${count.category}`
      const existing = dataMap.get(key)
      if (existing) {
        existing.actual = count.actual_count
        existing.variance = count.actual_count - existing.planned
        existing.percentComplete = existing.planned > 0 
          ? (count.actual_count / existing.planned) * 100 
          : 0
        // comparable is already set from goals, keep it
      } else {
        // Count exists but no goal - still show it
        dataMap.set(key, {
          district: count.district,
          week: count.week_number,
          category: count.category,
          planned: 0,
          comparable: 0,
          actual: count.actual_count,
          variance: count.actual_count,
          percentComplete: 0
        })
      }
    })

    // Filter out TOTAL rows from Excel, then calculate our own totals per week
    // Sort by: Week -> Category -> District (so all categories are grouped together within each week)
    const filteredData = Array.from(dataMap.values())
      .filter(row => row.category !== 'TOTAL') // Remove TOTAL rows from Excel
      .sort((a, b) => {
        // Sort by week first
        if (a.week !== b.week) return a.week - b.week
        // Then by category: CARPET, HSF, TILE (so all CARPET together, all HSF together, etc.)
        const categoryOrder: Record<string, number> = { 'CARPET': 1, 'HSF': 2, 'TILE': 3 }
        const orderA = categoryOrder[a.category] || 99
        const orderB = categoryOrder[b.category] || 99
        if (orderA !== orderB) return orderA - orderB
        // Then by district (within the same category)
        const numA = parseInt(a.district) || 0
        const numB = parseInt(b.district) || 0
        return numA - numB
      })

    // Calculate totals for each category/week combination (sum across all districts)
    const categoryWeekTotals = new Map<string, {
      week: number
      category: string
      planned: number
      comparable: number
    }>()

    filteredData.forEach(row => {
      const key = `${row.week}-${row.category}`
      const existing = categoryWeekTotals.get(key)
      if (existing) {
        existing.planned += row.planned
        existing.comparable += row.comparable
      } else {
        categoryWeekTotals.set(key, {
          week: row.week,
          category: row.category,
          planned: row.planned,
          comparable: row.comparable
        })
      }
    })

    // Insert TOTAL rows after each category group within each week
    const result: typeof filteredData = []
    let currentWeek = 0
    let currentCategory = ''

    filteredData.forEach(row => {
      // If we're moving to a new category (within the same week or new week), add total for previous category
      if ((row.category !== currentCategory || row.week !== currentWeek) && currentCategory && currentWeek > 0) {
        const totalKey = `${currentWeek}-${currentCategory}`
        const total = categoryWeekTotals.get(totalKey)
        if (total) {
          result.push({
            district: 'TOTAL', // Use 'TOTAL' as district identifier for category totals
            week: total.week,
            category: total.category,
            planned: total.planned,
            comparable: total.comparable,
            actual: 0,
            variance: 0,
            percentComplete: 0
          })
        }
      }

      // Add the current row
      result.push(row)

      // Update tracking
      currentWeek = row.week
      currentCategory = row.category
    })

    // Add total for the last category/week
    if (currentCategory && currentWeek > 0) {
      const totalKey = `${currentWeek}-${currentCategory}`
      const total = categoryWeekTotals.get(totalKey)
      if (total) {
        result.push({
          district: 'TOTAL',
          week: total.week,
          category: total.category,
          planned: total.planned,
          comparable: total.comparable,
          actual: 0,
          variance: 0,
          percentComplete: 0
        })
      }
    }

    return result
  }, [filteredGoals, filteredCounts])

  // Calculate district totals (sum across all weeks and categories for each district)
  const districtTotals = useMemo(() => {
    const totals = new Map<string, {
      district: string
      planned: number
      comparable: number
    }>()

    trackerData.forEach(row => {
      // Skip TOTAL rows (they're category totals, not district totals)
      if (row.district === 'TOTAL') return
      
      const existing = totals.get(row.district)
      if (existing) {
        existing.planned += row.planned
        existing.comparable += row.comparable
      } else {
        totals.set(row.district, {
          district: row.district,
          planned: row.planned,
          comparable: row.comparable
        })
      }
    })

    return Array.from(totals.values()).sort((a, b) => {
      const numA = parseInt(a.district) || 0
      const numB = parseInt(b.district) || 0
      return numA - numB
    })
  }, [trackerData])

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#89ac44]"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Q1 2026 Job Count Tracker
          </h1>
          <p className="text-sm text-gray-600">
            Track job count goals by district and category, week-to-week
          </p>
        </div>

        <SalesLastWeekDistrictPivot
          storeForecasts={storeForecasts}
          weeklyCounts={counts}
          q1Goals={goals}
        />

        {/* Upload Section — admins only */}
        {canViewAdminUploads ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Q1GoalsUpload />
            <StoreWeeklyForecastUpload />
          </div>
        ) : null}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
              >
                <option value="all">All Districts</option>
                {districts.map(d => {
                  const workrooms = getWorkroomsForDistrictAsString(d)
                  return (
                    <option key={d} value={d}>
                      {workrooms || `District ${d}`}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
              >
                <option value="all">All Weeks</option>
                {weeks.map(w => (
                  <option key={w} value={w.toString()}>Week {w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* District Totals Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {districtTotals.map((district) => (
            <div key={district.district} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">
                {getWorkroomsForDistrictAsString(district.district) || `District ${district.district}`}
              </div>
              <div className="space-y-2 mt-2">
                <div>
                  <div className="text-xs text-gray-500">Planned</div>
                  <div className="text-lg font-bold text-gray-900">{district.planned.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Comparable</div>
                  <div className="text-lg font-bold text-gray-900">{district.comparable.toLocaleString()}</div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-lg font-bold text-gray-900">
                    {(district.planned + district.comparable).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Store Weekly Forecasts Section */}
        {storeForecasts.length > 0 && showStoreForecastsSection && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Store Weekly Forecasts (Labor PO Weighting)
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {forecastView === 'store' 
                      ? 'Store-level job forecasts sorted by store number'
                      : 'Stores grouped by district - showing all stores within each district'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700">View:</label>
                    <select
                      value={forecastView}
                      onChange={(e) => setForecastView(e.target.value as 'store' | 'district')}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
                    >
                      <option value="store">By Store</option>
                      <option value="district">By District</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStoreForecastsSection(false)}
                    className="shrink-0 px-5 py-2.5 text-base font-semibold rounded-lg border border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                  >
                    Hide
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filter by Workroom
                  </label>
                  <select
                    value={selectedForecastWorkroom}
                    onChange={(e) => setSelectedForecastWorkroom(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
                  >
                    <option value="all">All Workrooms</option>
                    {uniqueWorkrooms.map(workroom => (
                      <option key={workroom} value={workroom}>
                        {workroom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filter by District
                  </label>
                  <select
                    value={selectedForecastDistrict}
                    onChange={(e) => setSelectedForecastDistrict(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
                  >
                    <option value="all">All Districts</option>
                    {districts.map(d => {
                      const workrooms = getWorkroomsForDistrictAsString(d)
                      return (
                        <option key={d} value={d}>
                          District {d}{workrooms ? ` (${workrooms})` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filter by Store
                  </label>
                  <select
                    value={selectedForecastStore}
                    onChange={(e) => setSelectedForecastStore(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89ac44]"
                  >
                    <option value="all">All Stores</option>
                    {uniqueForecastStores.map(storeNum => {
                      const storeName = getStoreName(storeNum)
                      return (
                        <option key={storeNum} value={storeNum}>
                          {storeNum} - {storeName}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {forecastView === 'store' ? 'Store' : 'District'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {forecastView === 'store' ? 'District' : 'Store'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      District Q1 Jobs
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      % Share
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Store Q1 Forecast
                    </th>
                    {weeks.map(week => (
                      <th 
                        key={week} 
                        className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                        style={{ backgroundColor: getWeekBgColor(week) }}
                      >
                        WK{week}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const filtered = storeForecasts.filter(f => {
                      // Filter by workroom - check the actual workroom assignment for this store
                      if (selectedForecastWorkroom !== 'all') {
                        // First try to get workroom from forecast data
                        let storeWorkroom = f.workroom ? f.workroom.toUpperCase() : null
                        
                        // If not in forecast data, look it up from storeLocations
                        if (!storeWorkroom) {
                          const storeLocation = storeLocations.find(s => 
                            s.number === f.store || parseInt(s.number) === parseInt(f.store)
                          )
                          if (storeLocation && storeLocation.workroom) {
                            storeWorkroom = storeLocation.workroom.toUpperCase()
                          }
                        }
                        
                        if (storeWorkroom !== selectedForecastWorkroom.toUpperCase()) {
                          return false
                        }
                      }
                      if (selectedForecastDistrict !== 'all' && f.district !== selectedForecastDistrict) return false
                      if (selectedForecastStore !== 'all' && f.store !== selectedForecastStore) return false
                      return true
                    })

                    if (forecastView === 'store') {
                      // Store view: Group by district and store, sort by store number
                      const grouped = new Map<string, StoreForecast[]>()
                      filtered.forEach(forecast => {
                        const key = `${forecast.district}-${forecast.store}`
                        if (!grouped.has(key)) {
                          grouped.set(key, [])
                        }
                        grouped.get(key)!.push(forecast)
                      })

                      // Sort by store number
                      const sorted = Array.from(grouped.entries()).sort(([a], [b]) => {
                        const [, storeA] = a.split('-')
                        const [, storeB] = b.split('-')
                        return parseInt(storeA) - parseInt(storeB)
                      })

                      return sorted.map(([key, forecasts]) => {
                        const first = forecasts[0]
                        const storeName = getStoreName(first.store)
                        
                        // Get the actual workroom for this store
                        let storeWorkroom = first.workroom ? first.workroom.toUpperCase() : null
                        if (!storeWorkroom) {
                          const storeLocation = storeLocations.find(s => 
                            s.number === first.store || parseInt(s.number) === parseInt(first.store)
                          )
                          if (storeLocation && storeLocation.workroom) {
                            storeWorkroom = storeLocation.workroom.toUpperCase()
                          }
                        }
                        
                        // If filtering by workroom, show only that workroom. Otherwise show all workrooms for district
                        const districtDisplay = selectedForecastWorkroom !== 'all' && storeWorkroom
                          ? storeWorkroom
                          : getWorkroomsForDistrictAsString(first.district) || `District ${first.district}`
                        
                        // Create a map of week -> jobs_needed
                        const weekMap = new Map<number, number>()
                        forecasts.forEach(f => weekMap.set(f.week_number, f.jobs_needed))

                        return (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div>{storeName}</div>
                              <div className="text-xs text-gray-500 mt-0.5">Store {first.store}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              <div>{districtDisplay}</div>
                              <div className="text-xs text-gray-500 mt-0.5">District {first.district}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {first.district_q1_jobs.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                              {first.pct_of_district.toFixed(2)}%
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                              {first.store_q1_job_forecast.toLocaleString()}
                            </td>
                            {weeks.map(week => {
                              const jobsNeeded = weekMap.get(week) || 0
                              return (
                                <td 
                                  key={week}
                                  className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-900 font-medium"
                                  style={{ backgroundColor: getWeekBgColor(week) }}
                                >
                                  {jobsNeeded > 0 ? jobsNeeded : '-'}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                    } else {
                      // District view: Group by district, then show all stores with 13 weeks
                      const districtGroups = new Map<string, {
                        district: string
                        stores: Map<string, {
                          store: string
                          district_q1_jobs: number
                          pct_of_district: number
                          store_q1_job_forecast: number
                          weekMap: Map<number, number>
                        }>
                      }>()

                      filtered.forEach(forecast => {
                        const district = forecast.district
                        if (!districtGroups.has(district)) {
                          districtGroups.set(district, {
                            district,
                            stores: new Map()
                          })
                        }
                        const group = districtGroups.get(district)!
                        const storeKey = forecast.store
                        
                        if (!group.stores.has(storeKey)) {
                          group.stores.set(storeKey, {
                            store: forecast.store,
                            district_q1_jobs: forecast.district_q1_jobs,
                            pct_of_district: forecast.pct_of_district,
                            store_q1_job_forecast: forecast.store_q1_job_forecast,
                            weekMap: new Map()
                          })
                        }
                        const storeData = group.stores.get(storeKey)!
                        storeData.weekMap.set(forecast.week_number, forecast.jobs_needed)
                      })

                      // Sort districts by number
                      const sortedDistricts = Array.from(districtGroups.entries()).sort(([a], [b]) => {
                        return parseInt(a) - parseInt(b)
                      })

                      const rows: JSX.Element[] = []
                      sortedDistricts.forEach(([districtNum, group]) => {
                        // Sort stores within district by store number
                        const sortedStores = Array.from(group.stores.entries()).sort(([a], [b]) => {
                          return parseInt(a) - parseInt(b)
                        })

                        sortedStores.forEach(([storeNum, storeData], index) => {
                          const storeName = getStoreName(storeNum)
                          
                          // Get the actual workroom for this store
                          const storeForecast = filtered.find(f => f.store === storeNum && f.district === districtNum)
                          let storeWorkroom = storeForecast?.workroom ? storeForecast.workroom.toUpperCase() : null
                          if (!storeWorkroom) {
                            const storeLocation = storeLocations.find(s => 
                              s.number === storeNum || parseInt(s.number) === parseInt(storeNum)
                            )
                            if (storeLocation && storeLocation.workroom) {
                              storeWorkroom = storeLocation.workroom.toUpperCase()
                            }
                          }
                          
                          // If filtering by workroom, show only that workroom. Otherwise show all workrooms for district
                          const workrooms = selectedForecastWorkroom !== 'all' && storeWorkroom
                            ? storeWorkroom
                            : getWorkroomsForDistrictAsString(districtNum)

                          rows.push(
                            <tr 
                              key={`${districtNum}-${storeNum}`} 
                              className={`hover:bg-gray-50 ${index === 0 ? 'border-t-2 border-gray-300' : ''}`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {index === 0 ? (
                                  <>
                                    <div className="font-semibold text-base">District {districtNum}</div>
                                    {workrooms && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {workrooms}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-gray-400">└</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div>{storeName}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Store {storeNum}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                {storeData.district_q1_jobs.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                {storeData.pct_of_district.toFixed(2)}%
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                                {storeData.store_q1_job_forecast.toLocaleString()}
                              </td>
                              {weeks.map(week => {
                                const jobsNeeded = storeData.weekMap.get(week) || 0
                                return (
                                  <td 
                                    key={week}
                                    className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-900 font-medium"
                                    style={{ backgroundColor: getWeekBgColor(week) }}
                                  >
                                    {jobsNeeded > 0 ? jobsNeeded : '-'}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })
                      })

                      return rows
                    }
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {storeForecasts.length > 0 && !showStoreForecastsSection && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <button
              type="button"
              onClick={() => setShowStoreForecastsSection(true)}
              className="w-full px-5 py-3 text-base font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Show Store Weekly Forecasts (Labor PO Weighting)
            </button>
          </div>
        )}

        {/* Data Table */}
        {showDataTable && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Goals by District, Week, and Category
              </h2>
              <button
                type="button"
                onClick={() => setShowDataTable(false)}
                className="shrink-0 px-5 py-2.5 text-base font-semibold rounded-lg border border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                Hide
              </button>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Workroom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Planned
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Comparable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trackerData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      {canViewAdminUploads
                        ? 'No data available. Upload goals file to get started.'
                        : 'No data available yet.'}
                    </td>
                  </tr>
                ) : (
                  trackerData.map((row, idx) => (
                    <tr 
                      key={`${row.district}-${row.week}-${row.category}-${idx}`} 
                      className={`${row.district === 'TOTAL' ? 'bg-gray-100 border-t-2 border-b-2 border-gray-400 font-semibold' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.district === 'TOTAL' ? (
                          <div className="font-bold text-gray-900">
                            Total - Week {row.week} {row.category}
                          </div>
                        ) : (
                          <div>{`District ${row.district}`}</div>
                        )}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${row.district === 'TOTAL' ? 'bg-gray-100' : 'text-gray-700'}`}>
                        {row.district === 'TOTAL' ? '' : getWorkroomsForDistrictAsString(row.district) || '-'}
                      </td>
                      <td 
                        className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${row.district === 'TOTAL' ? 'bg-gray-100' : ''}`}
                        style={row.district === 'TOTAL' ? {} : {
                          backgroundColor: getWeekBgColor(row.week),
                          color: getWeekColor(row.week)
                        }}
                      >
                        {row.district === 'TOTAL' ? '' : `Week ${row.week}`}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${row.district === 'TOTAL' ? 'font-bold text-gray-900' : row.category === 'TOTAL' ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {row.district === 'TOTAL' ? '' : row.category}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${row.category === 'TOTAL' ? 'font-bold text-gray-900' : 'text-gray-900'}`}>
                        {row.planned.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${row.category === 'TOTAL' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                        {row.comparable > 0 ? row.comparable.toLocaleString() : '-'}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${row.category === 'TOTAL' ? 'font-bold text-gray-900' : 'text-gray-900'}`}>
                        {(row.planned + row.comparable).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Show Data Table Button (when hidden) */}
        {!showDataTable && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <button
              type="button"
              onClick={() => setShowDataTable(true)}
              className="w-full px-5 py-3 text-base font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Show Goals by District, Week, and Category
            </button>
          </div>
        )}

      </div>
    </Layout>
  )
}
