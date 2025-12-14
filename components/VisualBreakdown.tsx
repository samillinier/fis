'use client'

import { useState, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import CountUpNumber from '@/components/CountUpNumber'
import { getStoreName } from '@/data/storeNames'

// Helper function to extract city name from full store name
const extractCityName = (fullStoreName: string): string => {
  if (!fullStoreName) return ''
  
  // Remove "LOWE'S OF" or "LOWES OF" prefix
  let cityName = fullStoreName.replace(/^LOWE'?S OF\s+/i, '')
  
  // Remove state code at the end (e.g., ", FL", ", AL", ", GA")
  cityName = cityName.replace(/,\s*[A-Z]{2}$/, '')
  
  // Remove directional prefixes (N., S., E., W., N.E., N.W., S.E., S.W.)
  cityName = cityName.replace(/^(N\.|S\.|E\.|W\.|N\.E\.|N\.W\.|S\.E\.|S\.W\.)\s*/i, '')
  
  // Split by space
  const parts = cityName.trim().split(/\s+/)
  
  // Handle special cases
  if (parts.length > 1) {
    // If second word is "CITY", keep both (e.g., "PANAMA CITY" -> "Panama City")
    if (parts[1].toUpperCase() === 'CITY') {
      return parts.slice(0, 2).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    }
    // For other multi-word locations, just take the first word (e.g., "TAMPA PALMS" -> "Tampa")
    return parts[0].charAt(0) + parts[0].slice(1).toLowerCase()
  }
  
  // Single word city
  return parts[0] ? parts[0].charAt(0) + parts[0].slice(1).toLowerCase() : ''
}
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

interface VisualBreakdownProps {
  selectedWorkroom: string
}

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#E0E0E0'] // For other charts
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] // Colorful colors for pie chart

// Helper function to check if a workroom name is valid (not "Location #" or similar)
const isValidWorkroomName = (name: string): boolean => {
  const normalizedName = name.toLowerCase().trim()
  return (
    normalizedName !== 'location #' &&
    normalizedName !== 'location' &&
    normalizedName !== '' &&
    !normalizedName.includes('location #')
  )
}

// Helper function to normalize workroom names
const normalizeWorkroomName = (name: string): string => {
  if (name === 'Panama Cit') {
    return 'Panama City'
  }
  return name
}

export default function VisualBreakdown({ selectedWorkroom }: VisualBreakdownProps) {
  const { data } = useData()
  const [selectedRiskWorkroom, setSelectedRiskWorkroom] = useState<any | null>(null)
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false)
  const [isDetailsCycleDialogOpen, setIsDetailsCycleDialogOpen] = useState(false)
  const [isJobCycleDialogOpen, setIsJobCycleDialogOpen] = useState(false)
  const [isWorkOrderCycleDialogOpen, setIsWorkOrderCycleDialogOpen] = useState(false)
  const [isRescheduleRateDialogOpen, setIsRescheduleRateDialogOpen] = useState(false)
  const [isGetItRightDialogOpen, setIsGetItRightDialogOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<any | null>(null)
  const [isStoreDetailsDialogOpen, setIsStoreDetailsDialogOpen] = useState(false)

  const jobCycleSections = [
    {
      title: 'Details Cycle',
      rows: [
        'RTS - Sched (Details)',
        'Sched - Start (Details)',
        'Start - Docs Sub (Details)',
        'Total Detail Cycle time',
      ],
    },
    {
      title: 'Jobs Cycle',
      rows: [
        'RTS - Sched (Jobs)',
        'Sched - Start (Jobs)',
        'Start - Complete (Jobs)',
        'Total Jobs Cycle time',
      ],
    },
  ]

  const handleJobCycleInfo = () => {
    setIsJobCycleDialogOpen(true)
  }

  const handleWorkOrderCycleInfo = () => {
    setIsWorkOrderCycleDialogOpen(true)
  }

  const handleRescheduleRateInfo = () => {
    setIsRescheduleRateDialogOpen(true)
  }

  const handleDetailsCycleInfo = () => {
    setIsDetailsCycleDialogOpen(true)
  }

  const handleGetItRightInfo = () => {
    setIsGetItRightDialogOpen(true)
  }

  // Normalize workroom names in the data
  const normalizedData = data.workrooms.map((w) => ({
    ...w,
    name: normalizeWorkroomName(w.name || '')
  }))

  let filteredData = normalizedData.filter((w) => isValidWorkroomName(w.name || ''))
  if (selectedWorkroom !== 'all') {
    filteredData = filteredData.filter((w) => w.name === selectedWorkroom)
  }

  const detailsCycleMetrics = useMemo(() => {
    // Only use records with visual data (exclude survey-only records)
    const visualDataOnly = filteredData.filter((w) => {
      const hasVisualData = (w.sales && w.sales > 0) || (w.laborPO && w.laborPO > 0) || (w.vendorDebit && w.vendorDebit !== 0)
      return hasVisualData
    })
    
    const averageForKey = (key: string): number | null => {
      const nums = visualDataOnly
        .map((w) => Number(w[key]))
        .filter((n) => !isNaN(n))
      if (nums.length === 0) return null
      const sum = nums.reduce((acc, n) => acc + n, 0)
      return sum / nums.length
    }

    const stages = [
      { label: 'Ready to Schedule → Scheduled', value: averageForKey('detailsRtsSched'), description: 'Time from Ready to Schedule notification to scheduled date' },
      { label: 'Scheduled → Installation Started', value: averageForKey('detailsSchedStart'), description: 'Time from scheduled date to when installation begins' },
      { label: 'Installation Started → Documents Submitted', value: averageForKey('detailsStartDocsSub'), description: 'Time from installation start to completion documentation submitted' },
    ]

    // Total Provider Cycle Time comes directly from column S (detailsCycleTime)
    const totalProviderCycleTime = averageForKey('detailsCycleTime')
    
    // Completed comes from column T
    const completed = averageForKey('completed')

    return {
      stages,
      totalProviderCycleTime,
      completed,
    }
  }, [filteredData])

  const jobCycleMetrics = useMemo(() => {
    // Only use records with visual data (exclude survey-only records)
    const visualDataOnly = filteredData.filter((w) => {
      const hasVisualData = (w.sales && w.sales > 0) || (w.laborPO && w.laborPO > 0) || (w.vendorDebit && w.vendorDebit !== 0)
      return hasVisualData
    })
    
    const averageForKey = (key: string): number | null => {
      const nums = visualDataOnly
        .map((w) => Number(w[key]))
        .filter((n) => !isNaN(n))
      if (nums.length === 0) return null
      const sum = nums.reduce((acc, n) => acc + n, 0)
      return sum / nums.length
    }

    const details = [
      { label: 'Ready to Schedule → Scheduled', value: averageForKey('rtsSchedDetails'), description: 'Time from Ready to Schedule notification to scheduled date' },
      { label: 'Scheduled → Installation Started', value: averageForKey('schedStartDetails'), description: 'Time from scheduled date to when installation begins' },
      { label: 'Installation Started → Documents Submitted', value: averageForKey('startDocsSubDetails'), description: 'Time from installation start to completion documentation submitted' },
    ]
    const jobs = [
      { label: 'RTS - Sched (Jobs)', value: averageForKey('rtsSchedJobs') },
      { label: 'Sched - Start (Jobs)', value: averageForKey('schedStartJobs') },
      { label: 'Start - Complete (Jobs)', value: averageForKey('startCompleteJobs') },
    ]

    // Total Detail Cycle comes directly from column X (totalDetailCycleTime)
    const detailsTotal = averageForKey('totalDetailCycleTime')

    const jobsTotal =
      averageForKey('jobsWorkCycleTime') ??
      (() => {
        const vals = jobs.map((d) => d.value).filter((v): v is number => v != null)
        if (vals.length === jobs.length) return vals.reduce((a, b) => a + b, 0)
        return null
      })()

    return {
      details: [...details, { label: 'Total Detail Cycle time', value: detailsTotal }],
      jobs: [...jobs, { label: 'Total Jobs Cycle time', value: jobsTotal }],
    }
  }, [filteredData])

  const workOrderCycleMetrics = useMemo(() => {
    // Only use records with visual data (exclude survey-only records)
    const visualDataOnly = filteredData.filter((w) => {
      const hasVisualData = (w.sales && w.sales > 0) || (w.laborPO && w.laborPO > 0) || (w.vendorDebit && w.vendorDebit !== 0)
      return hasVisualData
    })
    
    const averageForKey = (key: string): number | null => {
      const nums = visualDataOnly
        .map((w) => Number(w[key]))
        .filter((n) => !isNaN(n))
      if (nums.length === 0) return null
      const sum = nums.reduce((acc, n) => acc + n, 0)
      return sum / nums.length
    }

    const stages = [
      { label: 'Ready to Schedule → Scheduled', value: averageForKey('workOrderStage1'), description: 'Time from Ready-To-Schedule date to Scheduled Start date' },
      { label: 'Scheduled → Work Started', value: averageForKey('workOrderStage2'), description: 'Time from Scheduled Start date to when work actually begins' },
      { label: 'Work Started → Completed', value: averageForKey('workOrderStage3'), description: 'Time from work start to Work Order Completion' },
    ]

    // Total Provider Cycle Time comes directly from column AC (totalWorkOrderCycleTime)
    const total = averageForKey('totalWorkOrderCycleTime')

    return {
      stages: [...stages, { label: 'Total Provider Cycle Time', value: total }],
    }
  }, [filteredData])

  const rescheduleRateMetrics = useMemo(() => {
    // Only use records with visual data (exclude survey-only records)
    const visualDataOnly = filteredData.filter((w) => {
      const hasVisualData = (w.sales && w.sales > 0) || (w.laborPO && w.laborPO > 0) || (w.vendorDebit && w.vendorDebit !== 0)
      return hasVisualData
    })
    
    const averageForKey = (key: string): number | null => {
      const nums = visualDataOnly
        .map((w) => Number(w[key]))
        .filter((n) => !isNaN(n))
      if (nums.length === 0) return null
      const sum = nums.reduce((acc, n) => acc + n, 0)
      return sum / nums.length
    }

    const rates = [
      { label: 'Reschedule Rate', value: averageForKey('rescheduleRate'), description: 'Overall reschedule rate percentage' },
      { label: 'Reschedule Rate LY', value: averageForKey('rescheduleRateLY'), description: 'Reschedule rate from last year for comparison' },
      { label: 'Detail Rate', value: averageForKey('detailRate'), description: 'Reschedule rate for detail work orders' },
      { label: 'Job Rate', value: averageForKey('jobRate'), description: 'Reschedule rate for job work orders' },
      { label: 'Work Order Rate', value: averageForKey('workOrderRate'), description: 'Reschedule rate for work order cycle' },
    ]

    return {
      rates,
    }
  }, [filteredData])

  const getItRightMetrics = useMemo(() => {
    // Only use records with visual data (exclude survey-only records)
    const visualDataOnly = filteredData.filter((w) => {
      const hasVisualData = (w.sales && w.sales > 0) || (w.laborPO && w.laborPO > 0) || (w.vendorDebit && w.vendorDebit !== 0)
      return hasVisualData
    })
    
    const averageForKey = (key: string): number | null => {
      const nums = visualDataOnly
        .map((w) => Number(w[key]))
        .filter((n) => !isNaN(n))
      if (nums.length === 0) return null
      const sum = nums.reduce((acc, n) => acc + n, 0)
      return sum / nums.length
    }

    const rates = [
      { label: 'Get it Right', value: averageForKey('getItRight'), description: 'Percentage of work orders completed correctly on first attempt' },
      { label: 'Get it Right LY', value: averageForKey('getItRightLY'), description: 'Get it Right percentage from last year for comparison' },
    ]

    return {
      rates,
    }
  }, [filteredData])

  const formatMetricValue = (value: number | null, decimals = 1) =>
    value == null ? '—' : value.toFixed(decimals)

  const workroomMap = new Map<string, number>()
  filteredData.forEach((w) => {
    workroomMap.set(w.name, (workroomMap.get(w.name) || 0) + 1)
  })
  const workroomData = Array.from(workroomMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const storeMap = new Map<string | number, number>()
  filteredData.forEach((w) => {
    const storeKey = String(w.store)
    storeMap.set(storeKey, (storeMap.get(storeKey) || 0) + 1)
  })
  const storeData = Array.from(storeMap.entries())
    .map(([name, count]) => ({ name: String(name), count }))
    .sort((a, b) => Number(a.name) - Number(b.name))
    .slice(0, 20)

  const totalRecords = filteredData.length || 0

  const workroomStatsMap = new Map<string, { records: number; stores: Set<string> }>()
  filteredData.forEach((w) => {
    const existing = workroomStatsMap.get(w.name) || { records: 0, stores: new Set<string>() }
    existing.records += 1
    existing.stores.add(String(w.store))
    workroomStatsMap.set(w.name, existing)
  })

  const workroomInsights = Array.from(workroomStatsMap.entries())
    .map(([name, v]) => {
      const share = totalRecords > 0 ? v.records / totalRecords : 0
      return {
        name,
        records: v.records,
        storeCount: v.stores.size,
        share,
      }
    })
    .sort((a, b) => b.records - a.records)
    .slice(0, 10)

  const formatInt = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  const formatShare = (share: number) => `${Math.round(share * 100)}%`

  // Category breakdown by metric types
  const categoryBreakdown = [
    {
      name: 'Sales',
      value: filteredData.reduce((sum, w) => sum + (w.sales || 0), 0),
      color: '#000000',
    },
    {
      name: 'Total Sales',
      value: filteredData.reduce((sum, w) => sum + (w.laborPO || 0), 0),
      color: '#666666',
    },
    {
      name: 'Vendor Debit',
      value: filteredData.reduce((sum, w) => sum + (w.vendorDebit || 0), 0),
      color: '#999999',
    },
  ].filter((cat) => cat.value > 0)

  // Store breakdown with detailed stats
  const storeBreakdownMap = new Map<
    string | number,
    { store: string | number; workroom: string; records: number; sales: number; totalCost: number }
  >()
  filteredData.forEach((w) => {
    const key = String(w.store)
    const existing = storeBreakdownMap.get(key) || {
      store: w.store,
      workroom: w.name,
      records: 0,
      sales: 0,
      totalCost: 0,
    }
    storeBreakdownMap.set(key, {
      store: existing.store,
      workroom: existing.workroom,
      records: existing.records + 1,
      sales: existing.sales + (w.sales || 0),
      totalCost: existing.totalCost + (w.laborPO || 0) + (w.vendorDebit || 0),
    })
  })

  const storeBreakdown = Array.from(storeBreakdownMap.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 15)

  const formatCurrency = (value: number) =>
    value === 0 ? '$0' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  // Top Performing Workrooms - ranked by WPI Score
  const performingWorkroomsMap = new Map<
    string,
    { name: string; sales: number; laborPO: number; vendorDebit: number; stores: Set<string>; records: number; cycleTime?: number; jobsWorkCycleTime?: number; jobsWorkCycleTimeCount: number; rescheduleRate: number; rescheduleRateCount: number; detailsCycleTime?: number; detailsCycleTimeCount: number; completed?: number }
  >()

  filteredData.forEach((w) => {
    const existing = performingWorkroomsMap.get(w.name) || {
      name: w.name,
      sales: 0,
      laborPO: 0,
      vendorDebit: 0,
      stores: new Set<string>(),
      records: 0,
      cycleTime: undefined,
      jobsWorkCycleTime: 0,
      jobsWorkCycleTimeCount: 0,
      rescheduleRate: 0,
      rescheduleRateCount: 0,
      detailsCycleTime: 0,
      detailsCycleTimeCount: 0,
      completed: 0,
    }
    let jobsWorkCycleTime = existing.jobsWorkCycleTime || 0
    let jobsWorkCycleTimeCount = existing.jobsWorkCycleTimeCount || 0
    if (w.jobsWorkCycleTime != null && w.jobsWorkCycleTime !== undefined && w.jobsWorkCycleTime > 0) {
      jobsWorkCycleTime += w.jobsWorkCycleTime
      jobsWorkCycleTimeCount += 1
    }
    let rescheduleRate = existing.rescheduleRate || 0
    let rescheduleRateCount = existing.rescheduleRateCount || 0
    if (w.rescheduleRate != null && w.rescheduleRate !== undefined && !isNaN(Number(w.rescheduleRate))) {
      rescheduleRate += Number(w.rescheduleRate)
      rescheduleRateCount += 1
    }
    let detailsCycleTime = existing.detailsCycleTime || 0
    let detailsCycleTimeCount = existing.detailsCycleTimeCount || 0
    if (w.detailsCycleTime != null && w.detailsCycleTime !== undefined && w.detailsCycleTime > 0) {
      detailsCycleTime += w.detailsCycleTime
      detailsCycleTimeCount += 1
    }
    existing.stores.add(String(w.store))
    performingWorkroomsMap.set(w.name, {
      name: w.name,
      sales: existing.sales + (w.sales || 0),
      laborPO: existing.laborPO + (w.laborPO || 0),
      vendorDebit: existing.vendorDebit + (w.vendorDebit || 0),
      stores: existing.stores,
      records: existing.records + 1,
      cycleTime: w.cycleTime || existing.cycleTime,
      jobsWorkCycleTime,
      jobsWorkCycleTimeCount,
      rescheduleRate,
      rescheduleRateCount,
      detailsCycleTime,
      detailsCycleTimeCount,
      completed: (existing.completed || 0) + (w.completed || 0),
    })
  })

  const topPerformingWorkrooms = Array.from(performingWorkroomsMap.values())
    .map((w) => {
      const totalCost = w.laborPO + w.vendorDebit
      // LTR% = Labor PO / Sales (as percentage)
      const ltrPercent = w.sales > 0 ? (w.laborPO / w.sales) * 100 : 0
      
      // WPI Score calculation (Workroom Performance Index)
      // When sales data is available: Based on efficiency and margin
      // When sales data is missing: Based on cost efficiency, record management, and operational metrics
      let wpiScore = 0
      if (totalCost > 0) {
        if (w.sales > 0) {
          // With sales data: efficiency and margin-based calculation
          const efficiency = w.sales / totalCost
          const marginRate = (w.sales - totalCost) / totalCost
          if (w.cycleTime != null && w.cycleTime > 0) {
            const cycleTimeFactor = Math.max(0, 1 - w.cycleTime / 30)
            wpiScore = Math.min(100, efficiency * 10 * (0.7 + 0.3 * cycleTimeFactor) * (1 + marginRate))
          } else {
            wpiScore = Math.min(100, efficiency * 10 * (1 + marginRate))
          }
        } else {
          // Without sales data: cost efficiency and operational metrics-based calculation
          const avgCostPerRecord = w.records > 0 ? totalCost / w.records : totalCost
          const laborRatio = w.laborPO / totalCost // 0-1, higher indicates better labor management
          
          // Cost efficiency: Lower cost per record = higher score
          // Normalize based on typical cost range (assume $10,000 per record is average = 50 points)
          const costEfficiency = Math.max(0, Math.min(100, 150 - (avgCostPerRecord / 100)))
          
          // Labor management bonus: Higher labor ratio (vs vendor debit) = better
          const laborBonus = laborRatio * 30 // Max 30 points
          
          // Cycle time factor if available
          let cycleTimeBonus = 0
          if (w.cycleTime != null && w.cycleTime > 0) {
            // Lower cycle time = better (assume 30 days is baseline = 0 bonus)
            cycleTimeBonus = Math.max(0, (30 - w.cycleTime) / 2) // Max 15 points for 0 days
          }
          
          // Store coverage bonus: More stores = better operational footprint
          const storeBonus = Math.min(w.stores.size * 3, 20) // Max 20 points
          
          // Record volume bonus: More records = better throughput
          const recordBonus = Math.min(w.records / 10, 15) // Max 15 points
          
          wpiScore = Math.min(100, costEfficiency * 0.4 + laborBonus + cycleTimeBonus + storeBonus + recordBonus)
        }
      }

      return {
        name: w.name,
        sales: w.sales,
        laborPO: w.laborPO,
        vendorDebit: w.vendorDebit,
        totalCost,
        ltrPercent,
        wpiScore,
        stores: w.stores.size,
        records: w.records,
      }
    })
    .sort((a, b) => b.wpiScore - a.wpiScore)
    .slice(0, 15)

  // Workrooms Most Responsible for Moving Your Business - Top Load (Labor PO $ Average)
  const topLoadWorkrooms = Array.from(performingWorkroomsMap.values())
    .map((w) => {
      const avgLaborPO = w.records > 0 ? w.laborPO / w.records : 0
      return {
        name: w.name,
        totalLaborPO: w.laborPO,
        avgLaborPO,
        records: w.records,
        stores: w.stores.size,
      }
    })
    .sort((a, b) => b.avgLaborPO - a.avgLaborPO)
    .slice(0, 4)

  // Workroom Performance Index (WPI) by Workroom
  // Weighted: 50% LTR, 30% Labor PO $, 20% Vendor Debit discipline
  const wpiByWorkroom = Array.from(performingWorkroomsMap.values())
    .map((w) => {
      const totalCost = w.laborPO + w.vendorDebit
      // LTR% = Labor PO / Sales (as percentage)
      const ltrPercent = w.sales > 0 ? (w.laborPO / w.sales) * 100 : 0
      
      // Normalize each component to 0-100 scale for weighting
      // 1. LTR Score (50% weight): Lower LTR% is better, so we invert it
      // Assuming typical range: 0-50% LTR, where <20% = excellent (100), >40% = poor (0)
      let ltrScore = 0
      if (ltrPercent > 0) {
        if (ltrPercent <= 20) {
          ltrScore = 100 - (ltrPercent / 20) * 30 // 100-70 for 0-20%
        } else if (ltrPercent <= 40) {
          ltrScore = 70 - ((ltrPercent - 20) / 20) * 70 // 70-0 for 20-40%
        }
      } else {
        // If no sales data, use neutral score
        ltrScore = 50
      }
      
      // 2. Labor PO $ Score (30% weight): Higher Labor PO $ is better
      // Normalize based on max Labor PO $ across all workrooms
      const maxLaborPO = Math.max(...Array.from(performingWorkroomsMap.values()).map(wr => wr.laborPO), 1)
      const laborPOScore = maxLaborPO > 0 ? (w.laborPO / maxLaborPO) * 100 : 0
      
      // 3. Vendor Debit Discipline Score (20% weight): Lower vendor debit ratio is better
      // Vendor debit discipline = ratio of vendor debit to total cost
      // Lower ratio = better discipline
      let vendorDebitDisciplineScore = 100
      const vendorDebitRatio = totalCost > 0 ? Math.abs(w.vendorDebit) / totalCost : 0
      if (totalCost > 0) {
        // Lower ratio = better discipline (0% = 100 points, 50%+ = 0 points)
        vendorDebitDisciplineScore = Math.max(0, 100 - (vendorDebitRatio * 200))
      }
      
      // Calculate weighted WPI score
      const weightedWPI = (ltrScore * 0.50) + (laborPOScore * 0.30) + (vendorDebitDisciplineScore * 0.20)
      
      // Calculate averages
      const avgLaborPO = w.records > 0 ? w.laborPO / w.records : 0
      const avgVendorDebit = w.records > 0 ? w.vendorDebit / w.records : 0
      const avgTicketSale = w.records > 0 ? w.laborPO / w.records : 0

      return {
        name: w.name,
        ltrPercent,
        laborPO: w.laborPO,
        vendorDebit: w.vendorDebit,
        avgLaborPO,
        avgVendorDebit,
        avgTicketSale,
        totalCost,
        vendorDebitRatio,
        weightedWPI,
        stores: w.stores.size,
        records: w.records,
      }
    })
    .sort((a, b) => b.weightedWPI - a.weightedWPI)
    .filter((w) => {
      // Filter out invalid workroom names like "Location #"
      const name = w.name.toLowerCase().trim()
      return name !== 'location #' && 
             name !== 'location' && 
             name !== '' && 
             !name.includes('location #') &&
             w.name.trim() !== ''
    })

  // Average Labour PO $ by Workroom
  const avgLaborPOByWorkroom = Array.from(performingWorkroomsMap.values())
    .map((w) => {
      const avgLaborPO = w.records > 0 ? w.laborPO / w.records : 0
      return {
        name: w.name,
        avgLaborPO,
        totalLaborPO: w.laborPO,
        records: w.records,
        stores: w.stores.size,
      }
    })
    .sort((a, b) => b.avgLaborPO - a.avgLaborPO)
    .filter((w) => {
      // Filter out invalid workroom names like "Location #"
      const name = w.name.toLowerCase().trim()
      return name !== 'location #' && 
             name !== 'location' && 
             name !== '' && 
             !name.includes('location #') &&
             w.name.trim() !== ''
    })

  // Calculate LTR score from survey data for each workroom
  const surveyLTRMap = new Map<string, { sum: number; count: number }>()
  filteredData.forEach((w) => {
    if (w.ltrScore != null && w.ltrScore !== undefined && !isNaN(w.ltrScore)) {
      const existing = surveyLTRMap.get(w.name) || { sum: 0, count: 0 }
      surveyLTRMap.set(w.name, {
        sum: existing.sum + w.ltrScore,
        count: existing.count + 1,
      })
    }
  })

  // Top Performing Stores - Aggregate by store (combining visual and survey data)
  const storesMap = new Map<string, {
    store: string | number
    sales: number
    laborPO: number
    vendorDebit: number
    records: number
    ltrScores: number[]
    workrooms: Set<string>
  }>()

  filteredData.forEach((w) => {
    const storeKey = String(w.store || '').trim()
    if (!storeKey || storeKey === '' || storeKey.toLowerCase() === 'location #') return

    const existing = storesMap.get(storeKey) || {
      store: storeKey,
      sales: 0,
      laborPO: 0,
      vendorDebit: 0,
      records: 0,
      ltrScores: [],
      workrooms: new Set<string>(),
    }

    // Visual data
    if (w.sales && w.sales > 0) existing.sales += w.sales
    if (w.laborPO && w.laborPO > 0) existing.laborPO += w.laborPO
    if (w.vendorDebit) existing.vendorDebit += w.vendorDebit
    if (w.completed) existing.records += w.completed

    // Survey data
    if (w.ltrScore != null && w.ltrScore !== undefined && !isNaN(w.ltrScore)) {
      existing.ltrScores.push(w.ltrScore)
    }

    if (w.name) existing.workrooms.add(w.name)

    storesMap.set(storeKey, existing)
  })

  // Helper to clean store name (remove "Lowe's" and similar)
  const cleanStoreName = (storeNumber: string | number): string => {
    const storeNum = String(storeNumber)
    try {
      const fullName = getStoreName(storeNum)
      if (!fullName) return storeNum
      // Remove "LOWE'S OF", "LOWES OF", "LOWE'S", etc.
      let cleaned = fullName.replace(/^LOWE'?S\s+(OF\s+)?/i, '')
      // Remove trailing state codes
      cleaned = cleaned.replace(/,\s*[A-Z]{2}$/, '')
      return cleaned.trim() || storeNum
    } catch {
      return storeNum
    }
  }

  const allPerformingStores = Array.from(storesMap.values())
    .map((store) => {
      const totalCost = store.laborPO + Math.abs(store.vendorDebit)
      const avgLTR = store.ltrScores.length > 0
        ? store.ltrScores.reduce((sum, score) => sum + score, 0) / store.ltrScores.length
        : null

      // Calculate performance score (similar to WPI)
      // LTR Score (50% weight)
      let ltrScore = 0
      if (avgLTR != null && avgLTR > 0) {
        if (avgLTR > 9.0) ltrScore = 100
        else if (avgLTR >= 8.0) ltrScore = 80
        else if (avgLTR >= 7.0) ltrScore = 60
        else if (avgLTR >= 6.0) ltrScore = 40
        else ltrScore = 20
      } else {
        ltrScore = 50 // Neutral if no survey data
      }

      // Labor PO Score (30% weight)
      const maxLaborPO = Math.max(...Array.from(storesMap.values()).map(s => s.laborPO), 1)
      const laborPOScore = maxLaborPO > 0 ? (store.laborPO / maxLaborPO) * 100 : 0

      // Vendor Debit Discipline Score (20% weight)
      let vendorDebitDisciplineScore = 100
      const vendorDebitRatio = totalCost > 0 ? Math.abs(store.vendorDebit) / totalCost : 0
      if (totalCost > 0) {
        vendorDebitDisciplineScore = Math.max(0, 100 - (vendorDebitRatio * 200))
      }

      const performanceScore = (ltrScore * 0.50) + (laborPOScore * 0.30) + (vendorDebitDisciplineScore * 0.20)

      // Categorize store
      let status = 'Moderate'
      let statusColor = '#fbbf24'
      if (performanceScore >= 70) {
        status = 'Winning'
        statusColor = '#10b981'
      } else if (performanceScore < 40) {
        status = 'Critical'
        statusColor = '#ef4444'
      }

      const storeName = cleanStoreName(store.store)

      return {
        store: store.store,
        storeName,
        performanceScore,
        status,
        statusColor,
        avgLTR,
        totalSales: store.laborPO,
        sales: store.sales,
        totalVendorDebit: store.vendorDebit,
        records: store.records,
        workroomsCount: store.workrooms.size,
        workrooms: Array.from(store.workrooms),
      }
    })
    .filter((s) => s.records > 0 || s.avgLTR != null) // Only show stores with data
    .sort((a, b) => b.performanceScore - a.performanceScore)

  const topPerformingStores = allPerformingStores.slice(0, 10) // Top 10 only
  const bottomPerformingStores = allPerformingStores
    .slice()
    .sort((a, b) => a.performanceScore - b.performanceScore)
    .slice(0, 10) // Bottom 10 only

  // Comprehensive Workroom Analysis Dashboard
  // Maps out: Store mix, LTR performance, Labor PO volume, Vendor debit exposure, 
  // Weighted performance score, Operational risks, Financial risk rating, "Fix this now" bullets
  const comprehensiveAnalysis = Array.from(performingWorkroomsMap.values())
    .map((w) => {
      const totalCost = w.laborPO + w.vendorDebit
      const ltrPercent = w.sales > 0 ? (w.laborPO / w.sales) * 100 : 0
      const vendorDebitRatio = totalCost > 0 ? Math.abs(w.vendorDebit) / totalCost : 0
      const avgCostPerRecord = w.records > 0 ? totalCost / w.records : 0
      const avgLaborPOPerStore = w.stores.size > 0 ? w.laborPO / w.stores.size : 0
      const avgJobsWorkCycleTime = w.jobsWorkCycleTimeCount > 0 ? (w.jobsWorkCycleTime || 0) / w.jobsWorkCycleTimeCount : null
      const avgRescheduleRate = w.rescheduleRateCount > 0 ? (w.rescheduleRate || 0) / w.rescheduleRateCount : null
      const avgDetailsCycleTime = w.detailsCycleTimeCount > 0 ? (w.detailsCycleTime || 0) / w.detailsCycleTimeCount : null
      const avgTicketSale = w.records > 0 ? w.laborPO / w.records : 0
      
      // Calculate average LTR score from survey data
      const surveyLTR = surveyLTRMap.get(w.name)
      const avgLTRFromSurvey = surveyLTR && surveyLTR.count > 0 
        ? surveyLTR.sum / surveyLTR.count 
        : null
      
      // Store Mix Rating (based on number of stores and distribution)
      let storeMixRating = 'Low'
      if (w.stores.size >= 10) storeMixRating = 'Excellent'
      else if (w.stores.size >= 5) storeMixRating = 'Good'
      else if (w.stores.size >= 3) storeMixRating = 'Moderate'
      
      // LTR Performance Rating - Use survey LTR score if available
      let ltrPerformance = 'N/A'
      let ltrPerformanceValue = 0
      
      // Use survey LTR score instead of calculated percentage
      if (avgLTRFromSurvey != null && avgLTRFromSurvey > 0) {
        ltrPerformanceValue = avgLTRFromSurvey
        if (avgLTRFromSurvey > 9.0) ltrPerformance = 'Excellent'
        else if (avgLTRFromSurvey >= 8.0) ltrPerformance = 'Good'
        else if (avgLTRFromSurvey >= 7.0) ltrPerformance = 'Moderate'
        else if (avgLTRFromSurvey >= 6.0) ltrPerformance = 'Poor'
        else ltrPerformance = 'Critical'
      } else if (ltrPercent > 0) {
        // Fallback to calculated LTR% if no survey data
        ltrPerformanceValue = ltrPercent
        if (ltrPercent < 15) ltrPerformance = 'Excellent'
        else if (ltrPercent < 25) ltrPerformance = 'Good'
        else if (ltrPercent < 35) ltrPerformance = 'Moderate'
        else if (ltrPercent < 45) ltrPerformance = 'Poor'
        else ltrPerformance = 'Critical'
      }
      
      // Labor PO Volume Rating
      const totalLaborPO = Array.from(performingWorkroomsMap.values()).reduce((sum, wr) => sum + wr.laborPO, 0)
      const laborPOContribution = totalLaborPO > 0 ? (w.laborPO / totalLaborPO) * 100 : 0
      let laborPOVolume = 'Low'
      if (laborPOContribution >= 15) laborPOVolume = 'Very High'
      else if (laborPOContribution >= 10) laborPOVolume = 'High'
      else if (laborPOContribution >= 5) laborPOVolume = 'Moderate'
      else if (laborPOContribution >= 2) laborPOVolume = 'Low'
      else laborPOVolume = 'Very Low'
      
      // Vendor Debit Exposure Rating
      let vendorDebitExposure = 'Low'
      if (vendorDebitRatio >= 0.4) vendorDebitExposure = 'Critical'
      else if (vendorDebitRatio >= 0.3) vendorDebitExposure = 'High'
      else if (vendorDebitRatio >= 0.2) vendorDebitExposure = 'Moderate'
      else if (vendorDebitRatio > 0) vendorDebitExposure = 'Low'
      else vendorDebitExposure = 'None'
      
      // Calculate weighted Performance Score using new Core Metrics
      // LTR Score (50% weight)
      let ltrScore = 0
      if (avgLTRFromSurvey != null && avgLTRFromSurvey > 0) {
        // Use survey LTR score (0-10 scale) converted to 0-100
        ltrScore = avgLTRFromSurvey * 10
      } else if (ltrPercent > 0) {
        // Fallback to calculated LTR% (lower is better)
        if (ltrPercent <= 20) {
          ltrScore = 100 - (ltrPercent / 20) * 30 // 70-100
        } else if (ltrPercent <= 40) {
          ltrScore = 70 - ((ltrPercent - 20) / 20) * 70 // 0-70
        } else {
          ltrScore = 0
        }
      } else {
        ltrScore = 50 // Neutral if no data
      }
      
      // Details Cycle Time Score (5% weight)
      // Lower cycle time is better - score based on days
      // Caution triggers at > 5 days
      let detailsCycleTimeScore = 50 // Default neutral
      if (avgDetailsCycleTime != null && avgDetailsCycleTime > 0) {
        if (avgDetailsCycleTime <= 5) {
          detailsCycleTimeScore = 100 // Excellent
        } else if (avgDetailsCycleTime <= 10) {
          detailsCycleTimeScore = 60 // Moderate - triggers notification (< 70)
        } else if (avgDetailsCycleTime <= 15) {
          detailsCycleTimeScore = 40 // Poor
        } else if (avgDetailsCycleTime <= 20) {
          detailsCycleTimeScore = 30 // Critical
        } else {
          detailsCycleTimeScore = 20 // Critical
        }
      }
      
      // Cycle Jobs Score (13% weight)
      // Lower cycle time is better
      let cycleJobsScore = 50 // Default neutral
      if (avgJobsWorkCycleTime != null && avgJobsWorkCycleTime > 0) {
        if (avgJobsWorkCycleTime <= 5) {
          cycleJobsScore = 100 // Excellent
        } else if (avgJobsWorkCycleTime <= 10) {
          cycleJobsScore = 80 // Good
        } else if (avgJobsWorkCycleTime <= 15) {
          cycleJobsScore = 60 // Moderate
        } else if (avgJobsWorkCycleTime <= 20) {
          cycleJobsScore = 40 // Poor
        } else {
          cycleJobsScore = 20 // Critical
        }
      }
      
      // Work Order Cycle Time Score (14% weight)
      // Lower cycle time is better
      let workOrderCycleTimeScore = 50 // Default neutral
      if (w.cycleTime != null && w.cycleTime > 0) {
        if (w.cycleTime <= 15) {
          workOrderCycleTimeScore = 100 // Excellent
        } else if (w.cycleTime <= 25) {
          workOrderCycleTimeScore = 80 // Good
        } else if (w.cycleTime <= 35) {
          workOrderCycleTimeScore = 60 // Moderate
        } else if (w.cycleTime <= 45) {
          workOrderCycleTimeScore = 40 // Poor
        } else {
          workOrderCycleTimeScore = 20 // Critical
        }
      }
      
      // Reschedule Rate Score (8% weight)
      // Lower reschedule rate is better
      let rescheduleRateScore = 50 // Default neutral
      if (avgRescheduleRate != null && avgRescheduleRate > 0) {
        if (avgRescheduleRate <= 10) {
          rescheduleRateScore = 100 // Excellent
        } else if (avgRescheduleRate <= 20) {
          rescheduleRateScore = 80 // Good
        } else if (avgRescheduleRate <= 30) {
          rescheduleRateScore = 60 // Moderate
        } else if (avgRescheduleRate <= 40) {
          rescheduleRateScore = 40 // Poor
        } else {
          rescheduleRateScore = 20 // Critical
        }
      }
      
      // Vendor Debits Score (10% weight)
      // Lower vendor debit ratio is better
      let vendorDebitsScore = 100 // Default excellent
      if (totalCost > 0) {
        const vendorDebitRatio = Math.abs(w.vendorDebit) / totalCost
        if (vendorDebitRatio <= 0.1) {
          vendorDebitsScore = 100 // Excellent (0-10%)
        } else if (vendorDebitRatio <= 0.2) {
          vendorDebitsScore = 80 // Good (10-20%)
        } else if (vendorDebitRatio <= 0.3) {
          vendorDebitsScore = 60 // Moderate (20-30%)
        } else if (vendorDebitRatio <= 0.4) {
          vendorDebitsScore = 40 // Poor (30-40%)
        } else {
          vendorDebitsScore = 20 // Critical (>40%)
        }
      }
      
      // Calculate weighted Performance Score with new weights
      const weightedPerformanceScore = 
        (ltrScore * 0.50) +           // LTR: 50%
        (detailsCycleTimeScore * 0.05) + // Details Cycle Time: 5%
        (cycleJobsScore * 0.13) +     // Cycle Jobs: 13%
        (workOrderCycleTimeScore * 0.14) + // Work Order Cycle Time: 14%
        (rescheduleRateScore * 0.08) + // Reschedule Rate: 8%
        (vendorDebitsScore * 0.10)    // Vendor Debits: 10%
      
      // Store individual metric scores and values for display
      const metricScores = {
        ltr: { score: ltrScore, value: avgLTRFromSurvey != null ? avgLTRFromSurvey : (ltrPercent > 0 ? ltrPercent : null), label: 'LTR' },
        detailsCycleTime: { score: detailsCycleTimeScore, value: avgDetailsCycleTime, label: 'Details Cycle Time' },
        cycleJobs: { score: cycleJobsScore, value: avgJobsWorkCycleTime, label: 'Job Cycle Time' },
        workOrderCycleTime: { score: workOrderCycleTimeScore, value: w.cycleTime, label: 'Work Order Cycle Time' },
        rescheduleRate: { score: rescheduleRateScore, value: avgRescheduleRate, label: 'Reschedule Rate' },
        vendorDebits: { score: vendorDebitsScore, value: vendorDebitRatio * 100, label: 'Vendor Debits' }
      }
      
      // Financial Risk Rating - Based on weighted performance score
      // Determine risk based on weighted performance score thresholds
      let financialRisk = 'Low'
      if (weightedPerformanceScore >= 85) {
        financialRisk = 'Low'
      } else if (weightedPerformanceScore >= 70) {
        financialRisk = 'Moderate'
      } else if (weightedPerformanceScore >= 50) {
        financialRisk = 'High'
      } else {
        financialRisk = 'Critical'
      }
      
      // Operational Risks
      const operationalRisks: string[] = []
      // Check if LTR score is low (< 70) and add "Underperforming LTR" to operational risks
      // This should show for all workrooms with low LTR scores (either from survey data or calculated)
      if (ltrScore < 70 || (avgLTRFromSurvey != null && avgLTRFromSurvey < 7.0) || (ltrPercent > 0 && ltrPercent > 35)) {
        operationalRisks.push('Underperforming LTR')
      }
      // Check if any cycle time score is low (< 70) and add "High Cycle Time" to operational risks (only once)
      if (workOrderCycleTimeScore < 70 || cycleJobsScore < 70 || detailsCycleTimeScore < 70) {
        operationalRisks.push('High Cycle Time- Work Order, Jobs, and Details')
      }
      // Check if Reschedule Rate score is low (< 70) and add "Reschedule Rate" to operational risks
      if (rescheduleRateScore < 70) {
        operationalRisks.push('Reschedule Rate')
      }
      // Check if Vendor Debits score is low (< 70) and add "Vendor Debits" to operational risks
      if (vendorDebitsScore < 70) {
        operationalRisks.push('Vendor Debits')
      }
      if (avgCostPerRecord > 10000) {
        operationalRisks.push('High cost per record')
      }
      
      // Additional risk factors for context
      const riskFactors: string[] = []
      if (vendorDebitRatio > 0.4) {
        riskFactors.push('High vendor debit exposure')
      }
      if (ltrPercent > 40 && ltrPercent > 0) {
        riskFactors.push('High LTR%')
      }
      if (totalCost > 0 && w.sales > 0 && (w.sales - totalCost) / totalCost < 0.1) {
        riskFactors.push('Low margin rate')
      }
      
      // "Fix this now" bullets - Actionable items
      const fixNowBullets: string[] = []
      if (vendorDebitRatio > 0.3) {
        fixNowBullets.push(`Reduce vendor debit exposure (currently ${(vendorDebitRatio * 100).toFixed(1)}%)`)
      }
      // If LTR score is low (< 70), add detailed action items in a single box
      if (ltrScore < 70) {
        fixNowBullets.push('1. All communication with customers or IST runs through FIS workroom staff.\n2. Schedule to win by leveraging installer performance, not convenience.\n3. Maintain transparent communication with customers and document everything: SOW confirmation, materials, availability.\n4. Use a pre-installation checklist every time you schedule.\n5. Ensure installers understand their performance metrics and any corrective actions in play.')
      }
      // If Work Order Cycle Time score is low (< 70), add detailed action items in a single box
      if (workOrderCycleTimeScore < 70) {
        fixNowBullets.push('1. Create WO\'s internally unless materials are still pending.\n2. Schedule WO\'s before installs, prioritizing the original installer. If they can\'t meet the timeline or the customer wants a different crew, move it to the next available installer and charge it back.\n3. Assign installs based on performance so you\'re not creating tomorrow\'s WO\'s today.')
      }
      // If Job Cycle Time score is low (< 70), add detailed action items in a single box
      if (cycleJobsScore < 70) {
        fixNowBullets.push('1. Review the week\'s scheduled capacity, including Saturday, and know exactly where the gaps are.\n2. Hunt for WFP and RTS Follow-Up jobs that can now move forward based on installer availability.\n3. Call IST and confirm materials are staged for every RTS install so nothing blows up on game day.')
      }
      // If Details Cycle Time score is low (< 70), add action item
      if (detailsCycleTimeScore < 70) {
        fixNowBullets.push('Contact ROD to review with Measuring Services')
      }
      // If Reschedule Rate score is low (< 70), add detailed action items in a single box
      if (rescheduleRateScore < 70) {
        fixNowBullets.push('1. Confirm installer availability before you promise a date.\n2. Keep the original install date by pivoting to an alternate installer when needed.\n3. Avoid weather delays by having the installer cut carpet at a warehouse or store unless the customer can offer dry cutting space.')
      }
      // If Vendor Debits score is low (< 70), add detailed action items in a single box
      if (vendorDebitsScore < 70) {
        fixNowBullets.push('1. Schedule installs on the installers with the strongest LTR performance.\n2. Make sure installers verify the full SOW and confirm the job is within industry standards before starting.')
      }
      if (ltrPercent > 35 && ltrPercent > 0) {
        fixNowBullets.push(`Improve LTR% performance (currently ${ltrPercent.toFixed(1)}%)`)
      }
      if (avgCostPerRecord > 10000) {
        fixNowBullets.push(`Optimize cost per record (currently ${formatCurrency(avgCostPerRecord)})`)
      }
      if (weightedPerformanceScore < 50) {
        fixNowBullets.push(`Improve overall performance score (currently ${weightedPerformanceScore.toFixed(1)})`)
      }
      
      return {
        name: normalizeWorkroomName(w.name),
        storeMix: {
          count: w.stores.size,
          rating: storeMixRating,
          stores: Array.from(w.stores),
        },
        ltrPerformance: {
          value: ltrPerformanceValue,
          rating: ltrPerformance,
          isSurveyData: avgLTRFromSurvey != null,
        },
        laborPOVolume: {
          value: w.laborPO,
          contribution: laborPOContribution,
          rating: laborPOVolume,
          perStore: avgLaborPOPerStore,
        },
        vendorDebitExposure: {
          value: w.vendorDebit,
          ratio: vendorDebitRatio,
          rating: vendorDebitExposure,
        },
        weightedPerformanceScore,
        operationalRisks,
        financialRisk,
        fixNowBullets,
        records: w.records,
        cycleTime: w.cycleTime,
        jobsWorkCycleTime: avgJobsWorkCycleTime,
        rescheduleRate: avgRescheduleRate,
        sales: w.sales,
        completed: w.completed,
        avgTicketSale,
        totalCost,
        avgCostPerRecord,
        avgLTRFromSurvey, // Average LTR score from survey data
        metricScores, // Individual metric scores and values for display
        avgDetailsCycleTime, // Average Details Cycle Time for reference
      }
    })
    .sort((a, b) => b.weightedPerformanceScore - a.weightedPerformanceScore)
    .filter((w) => {
      // Filter out invalid workroom names like "Location #"
      const name = w.name.toLowerCase().trim()
      return name !== 'location #' && 
             name !== 'location' && 
             name !== '' && 
             !name.includes('location #') &&
             w.name.trim() !== ''
    })

  return (
    <div className="space-y-0">
      {/* HEATMAP VISUALIZATION - MOVED TO TOP */}
      <section className="compact-section" style={{ marginBottom: '1.5rem' }}>
        <div className="compact-chart-container" style={{ minHeight: '300px', padding: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
            gap: '1rem',
            width: '100%',
            gridAutoRows: 'minmax(auto, auto)',
            alignItems: 'stretch'
          }}>
            {comprehensiveAnalysis.map((workroom) => {
              // Heatmap colors (flat, no glass)
              let backgroundColor = '#ef4444' // Red - costing money
              let heatmapLabel = 'Costing Money'
              let textColor = '#ffffff'
              let borderColor = '#dc2626'
              let shadowColor = 'rgba(0, 0, 0, 0.15)'
              
              if (workroom.weightedPerformanceScore >= 85) {
                backgroundColor = '#22c55e' // Green
                heatmapLabel = 'Carrying Company'
                textColor = '#ffffff'
                borderColor = '#16a34a'
                shadowColor = 'rgba(34, 197, 94, 0.35)'
              } else if (workroom.weightedPerformanceScore >= 70) {
                backgroundColor = '#facc15' // Yellow
                heatmapLabel = 'Inconsistent'
                textColor = '#1f2937'
                borderColor = '#eab308'
                shadowColor = 'rgba(234, 179, 8, 0.35)'
              }
              // Below 70 = Red (default, already set above)

              // Additional red flags for critical issues
              if (workroom.financialRisk === 'Critical' || 
                  workroom.vendorDebitExposure.ratio > 0.4 ||
                  (workroom.ltrPerformance.value > 50 && workroom.ltrPerformance.value > 0) ||
                  workroom.operationalRisks.length > 3) {
                backgroundColor = '#ef4444'
                heatmapLabel = 'Critical Issues'
                textColor = '#ffffff'
                borderColor = '#b91c1c'
                shadowColor = 'rgba(248, 113, 113, 0.35)'
              }

              // Create a subtle diagonal stripe pattern for workroom name section
              const patternColor = textColor === '#ffffff' 
                ? 'rgba(255, 255, 255, 0.12)' 
                : 'rgba(0, 0, 0, 0.06)'
              const backgroundPattern = `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                ${patternColor} 10px,
                ${patternColor} 12px
              )`

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
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                    e.currentTarget.style.boxShadow = `0 10px 22px ${shadowColor}`
                    e.currentTarget.style.borderColor = borderColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = `0 6px 16px ${shadowColor}`
                    e.currentTarget.style.borderColor = borderColor
                  }}
                >
                  <div style={{ 
                    position: 'relative', 
                    zIndex: 1,
                    backgroundImage: backgroundPattern,
                    padding: '0.6rem',
                    margin: '-1rem -1rem 0.4rem -1rem',
                    borderRadius: '0.75rem 0.75rem 0 0',
                    borderBottom: `2px solid ${textColor}30`,
                    minHeight: '60px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div style={{ 
                        fontWeight: 800, 
                        fontSize: '1.5rem', 
                        lineHeight: '1.2',
                        flex: '1',
                        minWidth: 0
                      }}>
                        {workroom.name}
                      </div>
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start',
                        fontSize: '0.7rem',
                        lineHeight: '1.2',
                        gap: '0.3rem',
                        flexShrink: 0,
                        marginLeft: 'auto',
                        paddingLeft: '1rem'
                      }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontWeight: 700, 
                            fontSize: '0.75rem',
                            marginBottom: '0.1rem'
                          }}>
                            {workroom.financialRisk}
                          </div>
                          <div style={{ 
                            fontSize: '0.65rem',
                            opacity: 0.8,
                            fontWeight: 500
                          }}>
                            Risk
                          </div>
                        </div>
                        {workroom.fixNowBullets.length > 0 ? (
                          <div 
                            style={{ 
                              fontSize: '0.7rem', 
                              opacity: 0.9,
                              cursor: 'pointer',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '0.25rem',
                              transition: 'background-color 0.2s',
                              textDecoration: 'underline',
                              textAlign: 'right',
                              whiteSpace: 'nowrap',
                              marginTop: '0.2rem'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRiskWorkroom(workroom)
                              setIsRiskDialogOpen(true)
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                              e.currentTarget.style.opacity = '1'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.opacity = '0.9'
                            }}
                          >
                            {workroom.fixNowBullets.length} issue{workroom.fixNowBullets.length > 1 ? 's' : ''} to fix
                          </div>
                        ) : (
                          <div style={{ 
                            fontSize: '0.7rem', 
                            opacity: 0,
                            height: '1.2rem'
                          }}>
                            &nbsp;
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    opacity: 0.95, 
                    marginTop: '0.2rem', 
                    paddingTop: '0.3rem',
                    position: 'relative',
                    zIndex: 1,
                    backdropFilter: 'blur(4px)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>WPI Score:</span>
                      <span style={{ fontWeight: 700, fontSize: '1.5rem' }}>
                        <CountUpNumber 
                          value={workroom.weightedPerformanceScore} 
                          duration={1500} 
                          decimals={1} 
                        />
                      </span>
                    </div>
                    {/* Core Metrics Display */}
                    <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: `1px solid ${textColor}20` }}>
                      {/* Check if card is yellow (score 70-84) for emoji styling */}
                      {(() => {
                        const isYellowCard = workroom.weightedPerformanceScore >= 70 && workroom.weightedPerformanceScore < 85
                        const emojiStyle = isYellowCard 
                          ? { fontSize: '0.65rem', color: '#f59e0b', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }
                          : { fontSize: '0.7rem', color: '#f59e0b' }
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>LTR:</span>
                              <span style={{ fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {workroom.metricScores.ltr.score < 70 && <span style={emojiStyle}>⚠️</span>}
                                {workroom.metricScores.ltr.value != null 
                                  ? `${workroom.metricScores.ltr.value.toFixed(1)}${workroom.avgLTRFromSurvey != null ? '' : '%'}`
                                  : 'N/A'}
                              </span>
                            </div>
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
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Reschedule Rate:</span>
                              <span style={{ fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {workroom.metricScores.rescheduleRate.score < 70 && <span style={emojiStyle}>⚠️</span>}
                                {workroom.metricScores.rescheduleRate.value != null 
                                  ? `${workroom.metricScores.rescheduleRate.value.toFixed(1)}%`
                                  : 'N/A'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Vendor Debits:</span>
                              <span style={{ fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {workroom.metricScores.vendorDebits.score < 70 && <span style={emojiStyle}>⚠️</span>}
                                {workroom.metricScores.vendorDebits.value != null 
                                  ? `${workroom.metricScores.vendorDebits.value.toFixed(1)}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {comprehensiveAnalysis.length === 0 && (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
              Upload a T1/T2 scorecard to see heatmap visualization.
            </div>
          )}
        </div>
      </section>

      {/* Additional Metrics Box */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4" style={{ width: '100%' }}>
          <h3 className="compact-section-title mb-4">Operational Metrics</h3>
          {(() => {
            // Calculate all metrics once
            // Jobs Completed: Sum of values from column T (Completed column)
            // Only include records with visual data (not survey-only records)
            const visualDataRecords = filteredData.filter((w) => {
              const hasVisualData = (w.sales && w.sales > 0) || (w.laborPO && w.laborPO > 0) || (w.vendorDebit && w.vendorDebit !== 0)
              return hasVisualData
            })
            
            // Deduplicate records based on workroom + store + completed value
            // This prevents counting the same record multiple times if uploaded twice
            const seen = new Set<string>()
            const uniqueVisualRecords = visualDataRecords.filter((w) => {
              const key = `${w.name}|${w.store}|${w.completed ?? 'null'}|${w.laborPO ?? 0}|${w.vendorDebit ?? 0}`
              if (seen.has(key)) {
                return false // Duplicate
              }
              seen.add(key)
              return true
            })
            
            const jobsCompleted = uniqueVisualRecords.reduce((sum, w) => {
              const completedValue = w.completed != null && w.completed !== undefined ? Number(w.completed) : 0
              return sum + completedValue
            }, 0)
            
            // Debug: Log to help identify duplicates
            if (process.env.NODE_ENV === 'development') {
              console.log('Jobs Completed Calculation:', {
                totalFilteredRecords: filteredData.length,
                visualDataRecordsCount: visualDataRecords.length,
                uniqueVisualRecordsCount: uniqueVisualRecords.length,
                duplicatesRemoved: visualDataRecords.length - uniqueVisualRecords.length,
                jobsCompletedTotal: jobsCompleted,
                completedValues: uniqueVisualRecords
                  .filter((w) => w.completed != null)
                  .map((w) => ({ name: w.name, store: w.store, completed: w.completed }))
                  .slice(0, 20) // Show first 20 for debugging
              })
            }
            
            // Average Cycle Time: Average of values from column AC (ONLY from visual data, NOT survey)
            const cycleTimeData = visualDataRecords.filter((w) => w.cycleTime != null && w.cycleTime !== undefined && w.cycleTime > 0)
            const avgCycleTime = cycleTimeData.length > 0
              ? cycleTimeData.reduce((sum, w) => sum + (w.cycleTime || 0), 0) / cycleTimeData.length
              : 0
            
            // Average Jobs Work Cycle Time: Average of values from column X (ONLY from visual data, NOT survey)
            const jobsWorkCycleTimeData = visualDataRecords.filter((w) => {
              const value = w.jobsWorkCycleTime ?? jobCycleMetrics.jobs.at(-1)?.value
              return value != null && value !== undefined && !isNaN(Number(value)) && Number(value) > 0
            })
            const avgJobsWorkCycleTime = jobsWorkCycleTimeData.length > 0
              ? jobsWorkCycleTimeData.reduce((sum, w) => {
                  const value = w.jobsWorkCycleTime ?? jobCycleMetrics.jobs.at(-1)?.value ?? 0
                  return sum + Number(value)
                }, 0) / jobsWorkCycleTimeData.length
              : 0
            
            // Average Reschedule Rate: Average of values from column AD (ONLY from visual data, NOT survey)
            const rescheduleRateData = visualDataRecords.filter((w) => {
              const value = w.rescheduleRate
              return value != null && value !== undefined && !isNaN(Number(value))
            })
            const avgRescheduleRate = rescheduleRateData.length > 0
              ? rescheduleRateData.reduce((sum, w) => sum + Number(w.rescheduleRate || 0), 0) / rescheduleRateData.length
              : 0
            
            // Average Get it Right: Average of values from column AQ (ONLY from visual data, NOT survey)
            const getItRightData = visualDataRecords.filter((w) => {
              const value = w.getItRight
              return value != null && value !== undefined && !isNaN(Number(value))
            })
            const avgGetItRight = getItRightData.length > 0
              ? getItRightData.reduce((sum, w) => sum + Number(w.getItRight || 0), 0) / getItRightData.length
              : 0
            
            // Average Details Cycle Time: Average of values from column S (ONLY from visual data, NOT survey)
            const detailsCycleTimeData = visualDataRecords.filter((w) => {
              return w.detailsCycleTime != null && w.detailsCycleTime !== undefined && !isNaN(Number(w.detailsCycleTime)) && Number(w.detailsCycleTime) > 0
            })
            const avgDetailsCycleTime = detailsCycleTimeData.length > 0
              ? detailsCycleTimeData.reduce((sum, w) => sum + Number(w.detailsCycleTime || 0), 0) / detailsCycleTimeData.length
              : 0
            
            // Average Total Detail Cycle Time: Average of values from column X (ONLY from visual data, NOT survey)
            const totalDetailCycleTimeData = visualDataRecords.filter((w) => {
              return w.totalDetailCycleTime != null && w.totalDetailCycleTime !== undefined && !isNaN(Number(w.totalDetailCycleTime)) && Number(w.totalDetailCycleTime) > 0
            })
            const avgTotalDetailCycleTime = totalDetailCycleTimeData.length > 0
              ? totalDetailCycleTimeData.reduce((sum, w) => sum + Number(w.totalDetailCycleTime || 0), 0) / totalDetailCycleTimeData.length
              : 0
            
            // Average LTR: Average from survey data column L (index 11)
            // ltrScore comes from column L in the survey file
            const surveyLTRData = filteredData.filter((w) => {
              return w.ltrScore != null && w.ltrScore !== undefined && !isNaN(Number(w.ltrScore))
            })
            const avgLTR = surveyLTRData.length > 0
              ? surveyLTRData.reduce((sum, w) => sum + Number(w.ltrScore || 0), 0) / surveyLTRData.length
              : 0

            return (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1.25rem',
                width: '100%'
              }}>
                {/* Jobs Completed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jobs Completed</div>
                  <div className="text-xl font-bold text-gray-900">
                    <CountUpNumber value={jobsCompleted} duration={1500} decimals={0} />
                  </div>
                </div>

                {/* LTR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">LTR</div>
                  <div className="text-xl font-bold text-gray-900">
                    {avgLTR > 0 ? (
                      <CountUpNumber value={avgLTR} duration={1500} decimals={1} />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* Details Cycle Time */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onClick={handleDetailsCycleInfo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleDetailsCycleInfo()
                    }
                  }}
                  aria-label="View Details Cycle Time details"
                >
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Details Cycle Time</div>
                  <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    {detailsCycleTimeData.length > 0 ? (
                      <>
                      <CountUpNumber 
                        value={avgDetailsCycleTime} 
                        duration={1500} 
                        decimals={1} 
                      />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>days</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* Job Cycle Time */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onClick={handleJobCycleInfo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleJobCycleInfo()
                    }
                  }}
                  aria-label="View Job Cycle Time details"
                >
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job Cycle Time</div>
                  <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    {avgTotalDetailCycleTime > 0 ? (
                      <>
                      <CountUpNumber 
                          value={avgTotalDetailCycleTime} 
                        duration={1500} 
                        decimals={1} 
                      />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>days</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* Work Order Cycle Time */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onClick={handleWorkOrderCycleInfo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleWorkOrderCycleInfo()
                    }
                  }}
                  aria-label="View Provider Cycle Time details"
                >
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Order Cycle Time</div>
                  <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    {workOrderCycleMetrics.stages.at(-1)?.value != null && workOrderCycleMetrics.stages.at(-1)!.value! > 0 ? (
                      <>
                        <CountUpNumber 
                          value={workOrderCycleMetrics.stages.at(-1)!.value!} 
                          duration={1500} 
                          decimals={1} 
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>days</span>
                      </>
                    ) : avgCycleTime > 0 ? (
                      <>
                      <CountUpNumber 
                        value={avgCycleTime} 
                        duration={1500} 
                        decimals={1} 
                      />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>days</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* Reschedule Rate */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onClick={handleRescheduleRateInfo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleRescheduleRateInfo()
                    }
                  }}
                  aria-label="View Reschedule Rate details"
                >
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reschedule Rate</div>
                  <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    {avgRescheduleRate > 0 ? (
                      <>
                      <CountUpNumber 
                        value={avgRescheduleRate} 
                        duration={1500} 
                        decimals={1} 
                      />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>%</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* Get it Right */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onClick={handleGetItRightInfo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleGetItRightInfo()
                    }
                  }}
                  aria-label="View Get it Right details"
                >
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Get it Right</div>
                  <div className="text-xl font-bold text-gray-900" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    {getItRightData.length > 0 ? (
                      <>
                      <CountUpNumber 
                        value={avgGetItRight} 
                        duration={1500} 
                        decimals={1} 
                      />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>%</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* Workrooms Most Responsible for Moving Your Business and Top Performing Workrooms Side by Side */}
      <div className="analytics-grid-container">
        {/* Workrooms Most Responsible for Moving Your Business */}
        <section className="compact-section">
          <div className="compact-section-header">
            <h3 className="compact-section-title">Workrooms Most Responsible for Moving Your Business</h3>
            <p className="text-xs text-gray-500 mt-1">Top Load (Total Sales Average) - Top 4 Workrooms</p>
          </div>

          <div className="compact-chart-container">
            <h4 className="text-xs font-semibold mb-3 text-gray-700 uppercase tracking-wider">Total Sales Distribution</h4>
            {topLoadWorkrooms.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={topLoadWorkrooms}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, avgLaborPO }) =>
                      `${name}: ${formatCurrency(avgLaborPO)} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="avgLaborPO"
                  >
                    {topLoadWorkrooms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                    }}
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
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Avg Total Sales</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Records</th>
                  </tr>
                </thead>
                <tbody>
                  {topLoadWorkrooms.map((workroom) => {
                    return (
                      <tr key={workroom.name}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem' }}>{workroom.name}</td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem' }}>
                          {formatCurrency(workroom.avgLaborPO)}
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                          {formatInt(workroom.records)}
                        </td>
                      </tr>
                    )
                  })}
                  {topLoadWorkrooms.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                        Upload a T1/T2 scorecard to see top load workrooms.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* TOP PERFORMING WORKROOMS */}
        <section className="compact-section">
        <div className="compact-section-header">
          <h3 className="compact-section-title">Top Performing Workrooms</h3>
          <p className="text-xs text-gray-500 mt-1">Ranked by WPI Score (Workroom Performance Index)</p>
        </div>

        <div className="compact-table-container" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="overflow-x-auto" style={{ flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
            <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem', width: '100%', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Rank</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Workroom</th>
                  <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Stores</th>
                  <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>LTR%</th>
                  <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Total Sales</th>
                  <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Vendor Debits</th>
                  <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WPI Score</th>
                </tr>
              </thead>
              <tbody>
                {topPerformingWorkrooms.map((workroom, index) => {
                  let wpiBadgeClass = 'badge-neutral'
                  if (workroom.wpiScore > 70) wpiBadgeClass = 'badge-positive'
                  else if (workroom.wpiScore < 40) wpiBadgeClass = 'badge-warning'

                  let ltrBadgeClass = 'badge-neutral'
                  // Lower LTR% is better (less labor cost relative to sales)
                  if (workroom.ltrPercent < 20) ltrBadgeClass = 'badge-positive'
                  else if (workroom.ltrPercent > 40) ltrBadgeClass = 'badge-warning'

                  return (
                    <tr key={workroom.name}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#6b7280', fontSize: '0.7rem' }}>
                        #{index + 1}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem' }}>{workroom.name}</td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatInt(workroom.stores)}
                      </td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>
                        <span className={`badge-pill ${ltrBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', display: 'inline-block' }}>
                          {workroom.ltrPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(workroom.laborPO)}
                      </td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(workroom.vendorDebit)}
                      </td>
                      <td align="right" style={{ padding: '0.5rem 0.75rem' }}>
                        <span className={`badge-pill ${wpiBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', fontWeight: 600, display: 'inline-block' }}>
                          {workroom.wpiScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {topPerformingWorkrooms.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                      Upload a T1/T2 scorecard to see top performing workrooms.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>

      {/* Comprehensive Workroom Analysis Dashboard */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Comprehensive Workroom Analysis Dashboard</h3>
          <p className="text-xs text-gray-500 mt-1">
            LTR Performance • Work Order Cycle Time • Job Cycle Time • Total Sales Volume • Avg Ticket Sale • Vendor Debit Exposure • Reschedule Rate • Risk • Weighted Performance Score (Click any row for detailed analysis)
          </p>
        </div>

        <div className="compact-table-container">
          <div className="overflow-x-auto" style={{ maxHeight: '800px', overflowY: 'auto' }}>
            <table className="professional-table professional-table-zebra" style={{ fontSize: '0.7rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', position: 'sticky', left: 0, background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', color: '#ffffff', zIndex: 10, textAlign: 'center' }}>Workroom</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>LTR Performance</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Work Order Cycle Time</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Job Cycle Time</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Total Sales Volume</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Avg Ticket Sale</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Vendor Debit Exposure</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Reschedule Rate</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Risk</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>Weighted Score</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveAnalysis.map((workroom) => {
                  // Badge classes for ratings
                  const getStoreMixBadge = (rating: string) => {
                    if (rating === 'Excellent') return 'badge-positive'
                    if (rating === 'Good') return 'badge-positive'
                    if (rating === 'Moderate') return 'badge-neutral'
                    return 'badge-warning'
                  }
                  
                  const getLTRBadge = (rating: string) => {
                    if (rating === 'Excellent') return 'badge-positive'
                    if (rating === 'Good') return 'badge-positive'
                    if (rating === 'Moderate') return 'badge-neutral'
                    if (rating === 'Poor') return 'badge-warning'
                    if (rating === 'Critical') return 'badge-warning'
                    return 'badge-neutral'
                  }
                  
                  const getFinancialRiskBadge = (risk: string) => {
                    if (risk === 'Low') return 'badge-positive'
                    if (risk === 'Moderate') return 'badge-neutral'
                    if (risk === 'High') return 'badge-warning'
                    if (risk === 'Critical') return 'badge-warning'
                    return 'badge-neutral'
                  }
                  
                  const getVendorDebitBadge = (value: number) => {
                    if (value < 0) return 'badge-warning' // Red for negative (bad)
                    if (value > 0) return 'badge-warning' // Red for positive (bad)
                    return 'badge-neutral' // Neutral for zero
                  }
                  
                  const getWPSBadge = (score: number) => {
                    if (score >= 70) return 'badge-positive'
                    if (score >= 40) return 'badge-neutral'
                    return 'badge-warning'
                  }

                  return (
                    <tr 
                      key={workroom.name}
                      onClick={() => {
                        setSelectedRiskWorkroom(workroom)
                        setIsRiskDialogOpen(true)
                      }}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        const firstCell = e.currentTarget.querySelector('td:first-child') as HTMLElement
                        if (firstCell) {
                          firstCell.style.backgroundColor = '#f9fafb'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                        const firstCell = e.currentTarget.querySelector('td:first-child') as HTMLElement
                        if (firstCell) {
                          firstCell.style.backgroundColor = ''
                        }
                      }}
                    >
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5 }}>
                        {workroom.name}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        {workroom.ltrPerformance.value > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span className={`badge-pill ${getLTRBadge(workroom.ltrPerformance.rating)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                              {workroom.ltrPerformance.value.toFixed(1)}{workroom.ltrPerformance.isSurveyData ? '' : '%'}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{workroom.ltrPerformance.rating}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                        {workroom.cycleTime != null && workroom.cycleTime > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{workroom.cycleTime.toFixed(1)} days</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                        {workroom.jobsWorkCycleTime != null && workroom.jobsWorkCycleTime > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{workroom.jobsWorkCycleTime.toFixed(1)} days</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(workroom.laborPOVolume.value)}</span>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                            {workroom.laborPOVolume.rating} ({workroom.laborPOVolume.contribution.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                        {workroom.avgTicketSale != null && workroom.avgTicketSale > 0 ? (
                          <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>
                            ${workroom.avgTicketSale.toFixed(0)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', color: workroom.vendorDebitExposure.value < 0 ? '#ef4444' : (workroom.vendorDebitExposure.value > 0 ? '#ef4444' : '#111827') }}>{formatCurrency(workroom.vendorDebitExposure.value)}</span>
                          <span 
                            className="badge-pill" 
                            style={{ 
                              fontSize: '0.65rem', 
                              padding: '0.1rem 0.35rem',
                              backgroundColor: workroom.vendorDebitExposure.value !== 0 ? '#fee2e2' : '#e5e7eb',
                              color: workroom.vendorDebitExposure.value !== 0 ? '#dc2626' : '#4b5563'
                            }}
                          >
                            {(workroom.vendorDebitExposure.ratio * 100).toFixed(1)}% • {workroom.vendorDebitExposure.rating}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                        {workroom.rescheduleRate != null && workroom.rescheduleRate !== undefined ? (
                          <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{workroom.rescheduleRate.toFixed(1)}%</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <span className={`badge-pill ${getFinancialRiskBadge(workroom.financialRisk)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                          {workroom.financialRisk}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'center' }}>
                        <span className={`badge-pill ${getWPSBadge(workroom.weightedPerformanceScore)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                          {workroom.weightedPerformanceScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {comprehensiveAnalysis.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '2rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                      Upload a T1/T2 scorecard to see comprehensive workroom analysis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Workroom Performance Index (WPI) by Workroom - Bar Chart and Table Side by Side */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Workroom Performance Index (WPI) by Workroom</h3>
          <p className="text-xs text-gray-500 mt-1">
            Weighted using: 50% LTR • 30% Total Sales • 20% Vendor Debit discipline
          </p>
        </div>

        <div className="analytics-grid-container">
          {/* BAR CHART */}
          <div className="compact-chart-container" style={{ minHeight: '500px', padding: '1rem' }}>
            {wpiByWorkroom.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={wpiByWorkroom.map((w, index) => ({
                    name: w.name.length > 15 ? w.name.substring(0, 15) + '...' : w.name,
                    fullName: w.name,
                    wpi: Number(w.weightedWPI.toFixed(1)),
                    rank: index + 1,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: '0.7rem', fill: '#374151' }}
                    interval={0}
                  />
                  <YAxis
                    label={{ value: 'WPI Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151', fontSize: '0.75rem' } }}
                    tick={{ fontSize: '0.7rem', fill: '#374151' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.75rem' }}>{data.fullName}</p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              Rank: #{data.rank}
                            </p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1f2937', marginTop: '0.25rem' }}>
                              WPI Score: {data.wpi.toFixed(1)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="wpi"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  >
                    {wpiByWorkroom.map((w, index) => {
                      let fillColor = '#10b981' // green - default for excellent
                      if (w.weightedWPI > 70) fillColor = '#10b981' // green - excellent
                      else if (w.weightedWPI >= 40) fillColor = '#fbbf24' // yellow - warning/moderate
                      else fillColor = '#ef4444' // red - poor/critical

                      return <Cell key={`cell-${index}`} fill={fillColor} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Upload a T1/T2 scorecard to see WPI by workroom.
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="compact-table-container" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
            <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem', width: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '27.5%' }} />
                  <col style={{ width: '27.5%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'left' }}>Workroom</th>
                    <th align="center" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WPI</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Avg Total Sales</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>Avg Vendor Debits</th>
                  </tr>
                </thead>
                <tbody>
                  {wpiByWorkroom.map((workroom) => {
                    let wpiBadgeClass = 'badge-neutral'
                    if (workroom.weightedWPI > 70) wpiBadgeClass = 'badge-positive'
                    else if (workroom.weightedWPI < 40) wpiBadgeClass = 'badge-warning'

                    return (
                      <tr key={workroom.name}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', textAlign: 'left' }}>{workroom.name}</td>
                        <td align="center" style={{ padding: '0.5rem 0.75rem' }}>
                          <span className={`badge-pill ${wpiBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', fontWeight: 600, display: 'inline-block' }}>
                            {workroom.weightedWPI.toFixed(1)}
                          </span>
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {formatCurrency(workroom.avgLaborPO)}
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {formatCurrency(workroom.avgVendorDebit)}
                        </td>
                      </tr>
                    )
                  })}
                  {wpiByWorkroom.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                        Upload a T1/T2 scorecard to see WPI by workroom.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Average Labour PO $ by Workroom */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Average Total Sales by Workroom</h3>
          <p className="text-xs text-gray-500 mt-1">
            Average Total Sales per record across all workrooms
          </p>
        </div>

        <div className="compact-chart-container" style={{ minHeight: '500px', padding: '1rem' }}>
          {avgLaborPOByWorkroom.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={avgLaborPOByWorkroom.map((w) => ({
                  name: w.name.length > 15 ? w.name.substring(0, 15) + '...' : w.name,
                  fullName: w.name,
                  avgLaborPO: Number(w.avgLaborPO.toFixed(2)),
                  totalLaborPO: w.totalLaborPO,
                  records: w.records,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: '0.7rem', fill: '#374151' }}
                  interval={0}
                />
                <YAxis
                  label={{ value: 'Avg Total Sales', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151', fontSize: '0.75rem' } }}
                  tick={{ fontSize: '0.7rem', fill: '#374151' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.75rem' }}>{data.fullName}</p>
                          <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            Records: {data.records}
                          </p>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1f2937', marginTop: '0.25rem' }}>
                            Avg Total Sales: {formatCurrency(data.avgLaborPO)}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Total Sales: {formatCurrency(data.totalLaborPO)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="avgLaborPO"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                >
                  {avgLaborPOByWorkroom.map((w, index) => {
                    // Color based on average Labor PO value
                    let fillColor = '#94a3b8' // neutral gray
                    const avg = w.avgLaborPO
                    if (avg > 7000) fillColor = '#10b981' // green - high average
                    else if (avg > 5000) fillColor = '#3b82f6' // blue - good
                    else if (avg > 3000) fillColor = '#fbbf24' // yellow - moderate
                    else fillColor = '#ef4444' // red - low

                    return <Cell key={`cell-${index}`} fill={fillColor} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              Upload a T1/T2 scorecard to see average Total Sales by workroom.
            </div>
          )}
        </div>
      </section>

      {/* Top Performing Stores */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Top Performing Stores</h3>
          <p className="text-xs text-gray-500 mt-1">
            Top 10 stores based on survey and visual data - Winners vs Critical
          </p>
        </div>

        <div className="analytics-grid-container">
          {/* BAR CHART */}
        <div className="compact-chart-container" style={{ minHeight: '500px', padding: '1rem' }}>
            {topPerformingStores.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                  data={topPerformingStores.map((s) => ({
                    name: s.storeName.length > 15 ? s.storeName.substring(0, 15) + '...' : s.storeName,
                    fullName: s.storeName,
                    storeNumber: s.store,
                    performanceScore: Number(s.performanceScore.toFixed(1)),
                    status: s.status,
                    statusColor: s.statusColor,
                    avgLTR: s.avgLTR,
                    totalSales: s.totalSales,
                    records: s.records,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: '0.7rem', fill: '#374151' }}
                  interval={0}
                />
                <YAxis
                    label={{ value: 'Performance Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151', fontSize: '0.75rem' } }}
                  tick={{ fontSize: '0.7rem', fill: '#374151' }}
                    domain={[0, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                              {data.fullName} (Store {data.storeNumber})
                            </p>
                          <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              Status: <span style={{ color: data.statusColor, fontWeight: 600 }}>{data.status}</span>
                          </p>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1f2937', marginTop: '0.25rem' }}>
                              Performance Score: {data.performanceScore.toFixed(1)}
                          </p>
                            {data.avgLTR != null && (
                          <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                Avg LTR: {data.avgLTR.toFixed(1)}
                              </p>
                            )}
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              Total Sales: {formatCurrency(data.totalSales)}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              Records: {data.records}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                    dataKey="performanceScore"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                >
                    {topPerformingStores.map((s, index) => (
                      <Cell key={`cell-${index}`} fill={s.statusColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Upload T1/T2 scorecard and survey data to see top performing stores.
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="compact-table-container" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
            <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem', width: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'left' }}>Store</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'left' }}>Store Name</th>
                    <th align="center" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Score</th>
                    <th align="center" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Status</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Avg LTR</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformingStores.map((store) => {
                    let scoreBadgeClass = 'badge-neutral'
                    if (store.performanceScore >= 70) scoreBadgeClass = 'badge-positive'
                    else if (store.performanceScore < 40) scoreBadgeClass = 'badge-warning'

                    return (
                      <tr 
                        key={`store-top-${store.store}`}
                        onClick={() => {
                          setSelectedStore(store)
                          setIsStoreDetailsDialogOpen(true)
                        }}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = ''
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', textAlign: 'left' }}>
                          {String(store.store)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>
                          {store.storeName}
                        </td>
                        <td align="center" style={{ padding: '0.5rem 0.75rem' }}>
                          <span className={`badge-pill ${scoreBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', fontWeight: 600, display: 'inline-block' }}>
                            {store.performanceScore.toFixed(1)}
                          </span>
                        </td>
                        <td align="center" style={{ padding: '0.5rem 0.75rem' }}>
                          <span
                            className="badge-pill"
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.4rem',
                              fontWeight: 600,
                              backgroundColor: store.statusColor,
                              color: store.status === 'Winning' ? '#ffffff' : store.status === 'Critical' ? '#ffffff' : '#1f2937',
                              display: 'inline-block',
                            }}
                          >
                            {store.status}
                          </span>
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {store.avgLTR != null ? store.avgLTR.toFixed(1) : '—'}
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {formatCurrency(store.totalSales)}
                        </td>
                      </tr>
                    )
                  })}
                  {topPerformingStores.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                        Upload T1/T2 scorecard and survey data to see top performing stores.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Store Details Dialog - Buy and Sale */}
      {isStoreDetailsDialogOpen && selectedStore && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Store buy and sale details"
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
          onClick={() => setIsStoreDetailsDialogOpen(false)}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
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
                <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                  STORE DETAILS
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedStore.storeName} (Store {selectedStore.store})
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '1rem 1.1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Sales
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatCurrency(selectedStore.totalSales || 0)}
                    </div>
                  </div>
                  {selectedStore.sales && selectedStore.sales > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Revenue: {formatCurrency(selectedStore.sales)}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '1rem 1.1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Buy (Vendor Debits)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: selectedStore.totalVendorDebit < 0 ? '#ef4444' : '#0f172a' }}>
                      {formatCurrency(selectedStore.totalVendorDebit || 0)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {selectedStore.totalVendorDebit < 0 ? 'Debit' : selectedStore.totalVendorDebit > 0 ? 'Credit' : 'No debits'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '14px',
                  padding: '1rem 1.1rem',
                  background: '#f8fafc',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Additional Information
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Records:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{selectedStore.records || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Workrooms:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{selectedStore.workroomsCount || 0}</span>
                  </div>
                  {selectedStore.avgLTR != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Avg LTR:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{selectedStore.avgLTR.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsStoreDetailsDialogOpen(false)}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Performing Stores */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">Bottom Performing Stores</h3>
          <p className="text-xs text-gray-500 mt-1">
            Bottom 10 stores based on survey and visual data - Critical stores needing attention
          </p>
        </div>

        <div className="analytics-grid-container">
          {/* BAR CHART */}
          <div className="compact-chart-container" style={{ minHeight: '500px', padding: '1rem' }}>
            {bottomPerformingStores.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={bottomPerformingStores.map((s) => ({
                    name: s.storeName.length > 15 ? s.storeName.substring(0, 15) + '...' : s.storeName,
                    fullName: s.storeName,
                    storeNumber: s.store,
                    performanceScore: Number(s.performanceScore.toFixed(1)),
                    status: s.status,
                    statusColor: s.statusColor,
                    avgLTR: s.avgLTR,
                    totalSales: s.totalSales,
                    records: s.records,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: '0.7rem', fill: '#374151' }}
                    interval={0}
                  />
                  <YAxis
                    label={{ value: 'Performance Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151', fontSize: '0.75rem' } }}
                    tick={{ fontSize: '0.7rem', fill: '#374151' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                              {data.fullName} (Store {data.storeNumber})
                            </p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              Status: <span style={{ color: data.statusColor, fontWeight: 600 }}>{data.status}</span>
                            </p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1f2937', marginTop: '0.25rem' }}>
                              Performance Score: {data.performanceScore.toFixed(1)}
                            </p>
                            {data.avgLTR != null && (
                              <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                Avg LTR: {data.avgLTR.toFixed(1)}
                              </p>
                            )}
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              Total Sales: {formatCurrency(data.totalSales)}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              Records: {data.records}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="performanceScore"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  >
                    {bottomPerformingStores.map((s, index) => (
                      <Cell key={`cell-bottom-${index}`} fill={s.statusColor} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Upload T1/T2 scorecard and survey data to see bottom performing stores.
            </div>
          )}
          </div>

          {/* TABLE */}
          <div className="compact-table-container" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
            <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem', width: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'left' }}>Store</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'left' }}>Store Name</th>
                    <th align="center" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Score</th>
                    <th align="center" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Status</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Avg LTR</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomPerformingStores.map((store) => {
                    let scoreBadgeClass = 'badge-neutral'
                    if (store.performanceScore >= 70) scoreBadgeClass = 'badge-positive'
                    else if (store.performanceScore < 40) scoreBadgeClass = 'badge-warning'

                    return (
                      <tr 
                        key={`store-bottom-${store.store}`}
                        onClick={() => {
                          setSelectedStore(store)
                          setIsStoreDetailsDialogOpen(true)
                        }}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = ''
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', textAlign: 'left' }}>
                          {String(store.store)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>
                          {store.storeName}
                        </td>
                        <td align="center" style={{ padding: '0.5rem 0.75rem' }}>
                          <span className={`badge-pill ${scoreBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', fontWeight: 600, display: 'inline-block' }}>
                            {store.performanceScore.toFixed(1)}
                          </span>
                        </td>
                        <td align="center" style={{ padding: '0.5rem 0.75rem' }}>
                          <span
                            className="badge-pill"
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.4rem',
                              fontWeight: 600,
                              backgroundColor: store.statusColor,
                              color: store.status === 'Winning' ? '#ffffff' : store.status === 'Critical' ? '#ffffff' : '#1f2937',
                              display: 'inline-block',
                            }}
                          >
                            {store.status}
                          </span>
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {store.avgLTR != null ? store.avgLTR.toFixed(1) : '—'}
                        </td>
                        <td align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {formatCurrency(store.totalSales)}
                        </td>
                      </tr>
                    )
                  })}
                  {bottomPerformingStores.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                        Upload T1/T2 scorecard and survey data to see bottom performing stores.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Details Dialog */}
      {isRiskDialogOpen && selectedRiskWorkroom && (
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
            setIsRiskDialogOpen(false)
            setSelectedRiskWorkroom(null)
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1rem',
              maxWidth: '900px',
              width: '95%',
              maxHeight: '95vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                  Detailed Analysis - {selectedRiskWorkroom.name}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Comprehensive performance review and actionable recommendations
                </p>
              </div>
              <button
                onClick={() => {
                  setIsRiskDialogOpen(false)
                  setSelectedRiskWorkroom(null)
                }}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  borderRadius: '0.375rem',
                  lineHeight: 1,
                  width: '1.75rem',
                  height: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                  e.currentTarget.style.color = '#111827'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Key Metrics Overview */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '0.75rem', 
              marginBottom: '1rem',
            }}>
              <div style={{
                padding: '0.9rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {selectedRiskWorkroom.weightedPerformanceScore?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div style={{
                padding: '0.9rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Records</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {selectedRiskWorkroom.records || 0}
                </div>
              </div>
              <div style={{
                padding: '0.9rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reschedule Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {selectedRiskWorkroom.rescheduleRate != null && selectedRiskWorkroom.rescheduleRate !== undefined 
                    ? `${selectedRiskWorkroom.rescheduleRate.toFixed(1)}%`
                    : 'N/A'}
                </div>
              </div>
              <div style={{
                padding: '0.9rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                  {formatCurrency(selectedRiskWorkroom.laborPOVolume?.value || 0)}
                </div>
              </div>
            </div>

            {/* Financial Metrics */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                Financial Metrics
              </h3>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem'
              }}>
                <div style={{
                  padding: '0.9rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>LTR Performance</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                    {selectedRiskWorkroom.ltrPerformance?.value ? (
                      <>
                        {selectedRiskWorkroom.ltrPerformance.value.toFixed(1)}
                        {selectedRiskWorkroom.ltrPerformance.isSurveyData ? '' : '%'}
                      </>
                    ) : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                    Rating: {selectedRiskWorkroom.ltrPerformance?.rating || 'N/A'}
                    {selectedRiskWorkroom.ltrPerformance?.isSurveyData && (
                      <span style={{ fontSize: '0.65rem', color: '#3b82f6', marginLeft: '0.5rem' }}>(Survey Data)</span>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: '0.9rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Vendor Debit Exposure</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: selectedRiskWorkroom.vendorDebitExposure?.value && selectedRiskWorkroom.vendorDebitExposure.value !== 0 ? '#ef4444' : '#111827', marginBottom: '0.25rem' }}>
                    {formatCurrency(Math.abs(selectedRiskWorkroom.vendorDebitExposure?.value || 0))}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                    {(selectedRiskWorkroom.vendorDebitExposure?.ratio * 100 || 0).toFixed(1)}% • {selectedRiskWorkroom.vendorDebitExposure?.rating || 'N/A'}
                  </div>
                </div>
                <div style={{
                  padding: '0.9rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Total Job Cycle Time</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                    {selectedRiskWorkroom.jobsWorkCycleTime != null && selectedRiskWorkroom.jobsWorkCycleTime > 0 
                      ? `${selectedRiskWorkroom.jobsWorkCycleTime.toFixed(1)} days`
                      : 'N/A'}
                  </div>
                </div>
                <div style={{
                  padding: '0.9rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Total Work Order Cycle Time</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                    {selectedRiskWorkroom.cycleTime != null && selectedRiskWorkroom.cycleTime > 0 
                      ? `${selectedRiskWorkroom.cycleTime.toFixed(1)} days`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Cycle Time */}
            {selectedRiskWorkroom.cycleTime != null && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                  Cycle Time
                </h3>
                <div style={{ 
                  padding: '0.9rem 1rem', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                    Average: <strong style={{ fontSize: '1rem', color: '#111827' }}>{selectedRiskWorkroom.cycleTime.toFixed(1)} days</strong>
                    {selectedRiskWorkroom.cycleTime > 30 && (
                      <span style={{ color: '#ef4444', marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>⚠️ Above threshold</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Operational Risks */}
            {selectedRiskWorkroom.operationalRisks && selectedRiskWorkroom.operationalRisks.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                  Operational Risks
                </h3>
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {selectedRiskWorkroom.operationalRisks.map((risk: string, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#fef2f2',
                        borderRadius: '0.375rem',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '0.75rem',
                        lineHeight: '1.4',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>⚠️</span> {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues to Fix */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                Issues to Fix
              </h3>
              {selectedRiskWorkroom.fixNowBullets && selectedRiskWorkroom.fixNowBullets.length > 0 ? (
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  {selectedRiskWorkroom.fixNowBullets.map((bullet: string, index: number) => {
                    // Replace numbering (1., 2., 3., etc.) with dashes (-) at the beginning of each line
                    const replaceNumberingWithDash = (text: string): string => {
                      return text.split('\n').map(line => {
                        // Replace patterns like "1. ", "2. ", "10. ", etc. with "- " at the start of each line
                        return line.replace(/^\d+\.\s*/, '- ').trim()
                      }).join('\n')
                    }
                    return (
                      <div
                        key={index}
                        style={{
                          padding: '0.9rem 1rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                          fontSize: '0.75rem',
                          lineHeight: '1.5',
                          fontWeight: 500,
                          color: '#111827',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>🔧</span>
                        <span style={{ whiteSpace: 'pre-line' }}>{replaceNumberingWithDash(bullet)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ 
                  padding: '0.9rem 1rem', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#111827'
                }}>
                  <span>✓</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>No critical issues identified.</span>
                </div>
              )}
            </div>

            {/* Financial Risk Rating */}
            {selectedRiskWorkroom.financialRisk && (
              <div style={{ 
                marginTop: '1rem', 
                paddingTop: '1rem', 
                borderTop: '2px solid #e5e7eb',
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '0.75rem 1rem',
                  backgroundColor: selectedRiskWorkroom.financialRisk === 'Critical' || selectedRiskWorkroom.financialRisk === 'High' 
                    ? '#fef2f2' 
                    : selectedRiskWorkroom.financialRisk === 'Moderate'
                    ? '#fffbeb'
                    : '#f0fdf4',
                  borderRadius: '0.375rem',
                  border: `2px solid ${
                    selectedRiskWorkroom.financialRisk === 'Critical' 
                      ? '#dc2626' 
                      : selectedRiskWorkroom.financialRisk === 'High'
                      ? '#f59e0b'
                      : selectedRiskWorkroom.financialRisk === 'Moderate'
                      ? '#fbbf24'
                      : '#10b981'
                  }`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Risk Rating</div>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700, 
                        color: selectedRiskWorkroom.financialRisk === 'Critical' 
                          ? '#991b1b' 
                          : selectedRiskWorkroom.financialRisk === 'High'
                          ? '#b45309'
                          : selectedRiskWorkroom.financialRisk === 'Moderate'
                          ? '#a16207'
                          : '#166534'
                      }}>
                        {selectedRiskWorkroom.financialRisk}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem',
                      opacity: 0.8
                    }}>
                      {selectedRiskWorkroom.financialRisk === 'Critical' || selectedRiskWorkroom.financialRisk === 'High' 
                        ? '⚠️' 
                        : selectedRiskWorkroom.financialRisk === 'Moderate'
                        ? '⚡'
                        : '✓'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isDetailsCycleDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Details Cycle Time details"
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
          onClick={() => setIsDetailsCycleDialogOpen(false)}
        >
          <div
            style={{
              maxWidth: '760px',
              width: '100%',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
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
                <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                  DETAILS CYCLE TIME
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  Provider cycle time breakdown
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Provider Cycle Time
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMetricValue(detailsCycleMetrics.totalProviderCycleTime)}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>days</span>
                  </div>
                </div>
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Completed
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMetricValue(detailsCycleMetrics.completed)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '1rem 1.1rem',
                    background: '#f8fafc',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Cycle Time Stages
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#475569',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '999px',
                        background: '#e2e8f0',
                        fontWeight: 600,
                      }}
                    >
                      {detailsCycleMetrics.stages.filter((i) => i.value != null).length} / {detailsCycleMetrics.stages.length} populated
                    </div>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
                    {detailsCycleMetrics.stages.map((item) => (
                      <li
                        key={item.label}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '9999px',
                              background: '#2563eb',
                              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
                              flexShrink: 0,
                              marginTop: '0.25rem',
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.label}
                            </span>
                            {item.description && (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.3' }}>
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                            {formatMetricValue(item.value)}
                          </span>
                          {item.value != null && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>days</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDetailsCycleDialogOpen(false)}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isJobCycleDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Job cycle time details"
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
          onClick={() => setIsJobCycleDialogOpen(false)}
        >
          <div
            style={{
              maxWidth: '760px',
              width: '100%',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
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
                <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                  JOB CYCLE TIME
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  Stage-by-stage breakdown
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Detail Cycle
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMetricValue(jobCycleMetrics.details.at(-1)?.value)}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>days</span>
                  </div>
                </div>
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#fdfaf6',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Jobs Cycle
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMetricValue(jobCycleMetrics.jobs.at(-1)?.value)}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>days</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                {[{ title: 'Details Cycle', items: jobCycleMetrics.details }].map(
                  (section) => (
                    <div
                      key={section.title}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '14px',
                        padding: '1rem 1.1rem',
                        background: '#f8fafc',
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.65rem',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {section.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#475569',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '999px',
                            background: '#e2e8f0',
                            fontWeight: 600,
                          }}
                        >
                          {section.items.filter((i) => i.value != null).length} / {section.items.length} populated
                        </div>
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
                        {section.items.map((item) => (
                          <li
                            key={item.label}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '12px',
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                              color: '#0f172a',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                              <span
                                style={{
                                  width: '9px',
                                  height: '9px',
                                  borderRadius: '9999px',
                                  background: '#2563eb',
                                  boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
                                  flexShrink: 0,
                                  marginTop: '0.25rem',
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                                  {item.label}
                                </span>
                                {(item as any).description && (
                                  <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.3' }}>
                                    {(item as any).description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', flexShrink: 0 }}>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                                {formatMetricValue(item.value)}
                              </span>
                              {item.value != null && (
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>days</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsJobCycleDialogOpen(false)}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isWorkOrderCycleDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Work Order Cycle Time details"
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
          onClick={() => setIsWorkOrderCycleDialogOpen(false)}
        >
          <div
            style={{
              maxWidth: '760px',
              width: '100%',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
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
                <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                  PROVIDER CYCLE TIME
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  Stage-by-stage breakdown
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Provider Cycle
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMetricValue(workOrderCycleMetrics.stages.at(-1)?.value)}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>days</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '1rem 1.1rem',
                    background: '#f8fafc',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '0.02em',
                      }}
                      >
                        Provider Cycle
                      </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#475569',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '999px',
                        background: '#e2e8f0',
                        fontWeight: 600,
                      }}
                    >
                      {workOrderCycleMetrics.stages.filter((i) => i.value != null).length} / {workOrderCycleMetrics.stages.length} populated
                    </div>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
                    {workOrderCycleMetrics.stages.map((item) => (
                      <li
                        key={item.label}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '9999px',
                              background: '#2563eb',
                              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
                              flexShrink: 0,
                              marginTop: '0.25rem',
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.label}
                            </span>
                            {(item as any).description && (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.3' }}>
                                {(item as any).description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                            {formatMetricValue(item.value)}
                          </span>
                          {item.value != null && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>days</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsWorkOrderCycleDialogOpen(false)}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRescheduleRateDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reschedule Rate details"
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
          onClick={() => setIsRescheduleRateDialogOpen(false)}
        >
          <div
            style={{
              maxWidth: '760px',
              width: '100%',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
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
                <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                  RESCHEDULE RATE
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  Rate breakdown by category
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRescheduleRateDialogOpen(false)}
                aria-label="Close reschedule rate details"
                style={{
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.875rem',
                  color: '#0f172a',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Reschedule Rate
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMetricValue(rescheduleRateMetrics.rates[0]?.value)}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>%</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '1rem 1.1rem',
                    background: '#f8fafc',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Reschedule Rates
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#475569',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '999px',
                        background: '#e2e8f0',
                        fontWeight: 600,
                      }}
                    >
                      {rescheduleRateMetrics.rates.filter((i) => i.value != null).length} / {rescheduleRateMetrics.rates.length} populated
                    </div>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
                    {rescheduleRateMetrics.rates.map((item) => (
                      <li
                        key={item.label}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '9999px',
                              background: '#2563eb',
                              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
                              flexShrink: 0,
                              marginTop: '0.25rem',
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.label}
                            </span>
                            {(item as any).description && (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.3' }}>
                                {(item as any).description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                            {formatMetricValue(item.value)}
                          </span>
                          {item.value != null && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>%</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsRescheduleRateDialogOpen(false)}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGetItRightDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Get it Right details"
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
          onClick={() => setIsGetItRightDialogOpen(false)}
        >
          <div
            style={{
              maxWidth: '760px',
              width: '100%',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
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
                <div style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.04em' }}>
                  GET IT RIGHT
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  Quality performance breakdown
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Get it Right
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMetricValue(getItRightMetrics.rates[0]?.value)}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>%</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '1rem 1.1rem',
                    background: '#f8fafc',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Get it Right Rates
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#475569',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '999px',
                        background: '#e2e8f0',
                        fontWeight: 600,
                      }}
                    >
                      {getItRightMetrics.rates.filter((i) => i.value != null).length} / {getItRightMetrics.rates.length} populated
                    </div>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
                    {getItRightMetrics.rates.map((item) => (
                      <li
                        key={item.label}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '9999px',
                              background: '#2563eb',
                              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
                              flexShrink: 0,
                              marginTop: '0.25rem',
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.label}
                            </span>
                            {(item as any).description && (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.3' }}>
                                {(item as any).description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                            {formatMetricValue(item.value)}
                          </span>
                          {item.value != null && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>%</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsGetItRightDialogOpen(false)}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


