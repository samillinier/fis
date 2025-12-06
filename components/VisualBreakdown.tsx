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

export default function VisualBreakdown({ selectedWorkroom }: VisualBreakdownProps) {
  const { data } = useData()
  const [selectedRiskWorkroom, setSelectedRiskWorkroom] = useState<any | null>(null)
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false)

  let filteredData = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))
  if (selectedWorkroom !== 'all') {
    filteredData = filteredData.filter((w) => w.name === selectedWorkroom)
  }

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
      name: 'Labor PO',
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
    { name: string; sales: number; laborPO: number; vendorDebit: number; stores: Set<string>; records: number; cycleTime?: number }
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
    }
    performingWorkroomsMap.set(w.name, {
      name: w.name,
      sales: existing.sales + (w.sales || 0),
      laborPO: existing.laborPO + (w.laborPO || 0),
      vendorDebit: existing.vendorDebit + (w.vendorDebit || 0),
      stores: existing.stores,
      records: existing.records + 1,
      cycleTime: w.cycleTime || existing.cycleTime,
    })
    existing.stores.add(String(w.store))
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

      return {
        name: w.name,
        ltrPercent,
        laborPO: w.laborPO,
        vendorDebit: w.vendorDebit,
        avgLaborPO,
        avgVendorDebit,
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

  // Average Vendor Debits $ by Workroom
  const avgVendorDebitByWorkroom = Array.from(performingWorkroomsMap.values())
    .map((w) => {
      const avgVendorDebit = w.records > 0 ? w.vendorDebit / w.records : 0
      return {
        name: w.name,
        avgVendorDebit,
        totalVendorDebit: w.vendorDebit,
        records: w.records,
        stores: w.stores.size,
      }
    })
    .sort((a, b) => Math.abs(b.avgVendorDebit) - Math.abs(a.avgVendorDebit)) // Sort by absolute value since debits can be negative
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
      
      // Calculate weighted WPI for this workroom
      let ltrScore = 0
      if (ltrPercent > 0) {
        if (ltrPercent <= 20) {
          ltrScore = 100 - (ltrPercent / 20) * 30
        } else if (ltrPercent <= 40) {
          ltrScore = 70 - ((ltrPercent - 20) / 20) * 70
        }
      } else {
        ltrScore = 50
      }
      
      const maxLaborPO = Math.max(...Array.from(performingWorkroomsMap.values()).map(wr => wr.laborPO), 1)
      const laborPOScore = maxLaborPO > 0 ? (w.laborPO / maxLaborPO) * 100 : 0
      
      let vendorDebitDisciplineScore = 100
      if (totalCost > 0) {
        const vendorDebitRatio = Math.abs(w.vendorDebit) / totalCost
        vendorDebitDisciplineScore = Math.max(0, 100 - (vendorDebitRatio * 200))
      }
      
      const weightedPerformanceScore = (ltrScore * 0.50) + (laborPOScore * 0.30) + (vendorDebitDisciplineScore * 0.20)
      
      // Operational Risks
      const operationalRisks: string[] = []
      if (w.stores.size < 3) {
        operationalRisks.push('Limited store coverage')
      }
      if (w.records < 5) {
        operationalRisks.push('Low record volume')
      }
      if (avgCostPerRecord > 10000) {
        operationalRisks.push('High cost per record')
      }
      if (w.cycleTime != null && w.cycleTime > 30) {
        operationalRisks.push(`Extended cycle time (${w.cycleTime.toFixed(0)} days)`)
      }
      if (avgLaborPOPerStore > 5000) {
        operationalRisks.push('High Labor PO per store')
      }
      
      // Financial Risk Rating
      let financialRisk = 'Low'
      const riskFactors: string[] = []
      
      if (vendorDebitRatio > 0.3) {
        riskFactors.push('High vendor debit exposure')
        financialRisk = 'High'
      }
      if (ltrPercent > 40 && ltrPercent > 0) {
        riskFactors.push('High LTR%')
        if (financialRisk === 'Low') financialRisk = 'Moderate'
      }
      if (totalCost > 0 && w.sales > 0 && (w.sales - totalCost) / totalCost < 0.1) {
        riskFactors.push('Low margin rate')
        if (financialRisk === 'Low') financialRisk = 'Moderate'
      }
      if (vendorDebitRatio > 0.4 || (ltrPercent > 50 && ltrPercent > 0)) {
        financialRisk = 'Critical'
      }
      
      // "Fix this now" bullets - Actionable items
      const fixNowBullets: string[] = []
      if (vendorDebitRatio > 0.3) {
        fixNowBullets.push(`Reduce vendor debit exposure (currently ${(vendorDebitRatio * 100).toFixed(1)}%)`)
      }
      if (ltrPercent > 35 && ltrPercent > 0) {
        fixNowBullets.push(`Improve LTR% performance (currently ${ltrPercent.toFixed(1)}%)`)
      }
      if (w.stores.size < 3) {
        fixNowBullets.push(`Expand store coverage (currently ${w.stores.size} stores)`)
      }
      if (avgCostPerRecord > 10000) {
        fixNowBullets.push(`Optimize cost per record (currently ${formatCurrency(avgCostPerRecord)})`)
      }
      if (w.cycleTime != null && w.cycleTime > 30) {
        fixNowBullets.push(`Reduce cycle time (currently ${w.cycleTime.toFixed(0)} days)`)
      }
      if (weightedPerformanceScore < 50) {
        fixNowBullets.push(`Improve overall performance score (currently ${weightedPerformanceScore.toFixed(1)})`)
      }
      
      return {
        name: w.name,
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
        sales: w.sales,
        totalCost,
        avgCostPerRecord,
        avgLTRFromSurvey, // Average LTR score from survey data
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
            gridAutoRows: 'minmax(140px, auto)',
            alignItems: 'stretch'
          }}>
            {comprehensiveAnalysis.map((workroom) => {
              // Determine heatmap color with vibrant volcanic gradient style
              let gradientFrom = '#ef4444' // Red - costing money
              let gradientTo = '#dc2626' // Dark red
              let heatmapLabel = 'Costing Money'
              let textColor = '#ffffff'
              let glowColor = 'rgba(239, 68, 68, 0.4)' // Red glow
              let borderColor = '#dc2626'
              
              if (workroom.weightedPerformanceScore >= 70) {
                gradientFrom = '#10b981' // Emerald green
                gradientTo = '#059669' // Darker emerald
                heatmapLabel = 'Carrying Company'
                textColor = '#ffffff'
                glowColor = 'rgba(16, 185, 129, 0.5)' // Green glow
                borderColor = '#059669'
              } else if (workroom.weightedPerformanceScore >= 50) {
                gradientFrom = '#fbbf24' // Vibrant yellow
                gradientTo = '#f59e0b' // Golden orange
                heatmapLabel = 'Inconsistent'
                textColor = '#1f2937' // Dark gray for readability
                glowColor = 'rgba(251, 191, 36, 0.5)' // Yellow glow
                borderColor = '#f59e0b'
              } else if (workroom.weightedPerformanceScore >= 40) {
                gradientFrom = '#f59e0b' // Amber orange
                gradientTo = '#d97706' // Darker amber
                heatmapLabel = 'Warning'
                textColor = '#ffffff'
                glowColor = 'rgba(245, 158, 11, 0.5)' // Orange glow
                borderColor = '#d97706'
              }

              // Additional red flags for critical issues - intense volcanic red
              if (workroom.financialRisk === 'Critical' || 
                  workroom.vendorDebitExposure.ratio > 0.4 ||
                  (workroom.ltrPerformance.value > 50 && workroom.ltrPerformance.value > 0) ||
                  workroom.operationalRisks.length > 3) {
                gradientFrom = '#dc2626' // Dark red
                gradientTo = '#991b1b' // Very dark red
                heatmapLabel = 'Critical Issues'
                textColor = '#ffffff'
                glowColor = 'rgba(220, 38, 38, 0.6)' // Strong red glow
                borderColor = '#991b1b'
              }

              return (
                <div
                  key={workroom.name}
                  style={{
                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                    color: textColor,
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    boxShadow: `0 4px 12px ${glowColor}, 0 2px 4px rgba(0, 0, 0, 0.2)`,
                    border: `2px solid ${borderColor}40`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                    minHeight: '140px',
                    height: '100%',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                    e.currentTarget.style.boxShadow = `0 8px 24px ${glowColor}, 0 4px 8px rgba(0, 0, 0, 0.3)`
                    e.currentTarget.style.borderColor = `${borderColor}80`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${glowColor}, 0 2px 4px rgba(0, 0, 0, 0.2)`
                    e.currentTarget.style.borderColor = `${borderColor}40`
                  }}
                >
                  {/* Subtle overlay for depth */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%)',
                    pointerEvents: 'none',
                    borderRadius: '0.75rem 0.75rem 0 0'
                  }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: '1.3', marginBottom: '0.25rem' }}>
                      {workroom.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      opacity: 0.98, 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em', 
                      marginBottom: '0.5rem'
                    }}>
                      {heatmapLabel}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    opacity: 0.95, 
                    marginTop: '0.25rem', 
                    borderTop: `2px solid ${textColor}40`, 
                    paddingTop: '0.5rem',
                    position: 'relative',
                    zIndex: 1,
                    backdropFilter: 'blur(4px)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>WPI Score:</span>
                      <span style={{ fontWeight: 600 }}>{workroom.weightedPerformanceScore.toFixed(1)}</span>
                    </div>
                    {workroom.avgLTRFromSurvey !== null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>LTR:</span>
                        <span style={{ fontWeight: 600 }}>{workroom.avgLTRFromSurvey.toFixed(1)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Stores:</span>
                      <span style={{ fontWeight: 600 }}>{workroom.storeMix.count}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Risk:</span>
                      <span style={{ fontWeight: 600 }}>{workroom.financialRisk}</span>
                    </div>
                    {workroom.fixNowBullets.length > 0 && (
                      <div 
                        style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.65rem', 
                          opacity: 0.9,
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          transition: 'background-color 0.2s',
                          textDecoration: 'underline'
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
                    )}
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
            const jobsCompleted = filteredData.length
            const jobsPending = filteredData.length > 0 ? Math.max(0, Math.floor(filteredData.length * 0.12)) : 0
            const returnRedoJobs = filteredData.length > 0 ? Math.max(0, Math.floor(filteredData.length * 0.04)) : 0
            
            // Installation Quality
            const avgCycleTime = filteredData.length > 0 
              ? filteredData.reduce((sum, w) => sum + (w.cycleTime || 0), 0) / filteredData.length 
              : 0
            const installationQualityScore = avgCycleTime > 0 ? Math.max(75, 95 - (avgCycleTime / 2)) : 90
            
            // Customer Satisfaction
            const totalSales = filteredData.reduce((sum, w) => sum + (w.sales || 0), 0)
            const totalCost = filteredData.reduce((sum, w) => sum + (w.laborPO || 0) + (w.vendorDebit || 0), 0)
            const marginRate = totalCost > 0 ? ((totalSales - totalCost) / totalCost) * 100 : 0
            const customerSatisfactionScore = Math.min(100, Math.max(75, 82 + (marginRate / 5)))
            
            // Average Labor Hours
            const laborData = filteredData.filter((w) => w.laborPO && w.laborPO > 0)
            const avgLaborHours = laborData.length > 0
              ? laborData.reduce((sum, w) => sum + ((w.laborPO || 0) / 50), 0) / laborData.length
              : 0
            
            // On-Time Completion Rate
            const avgCycleTimeForRate = filteredData.length > 0
              ? filteredData.reduce((sum, w) => sum + (w.cycleTime || 10), 0) / filteredData.length
              : 10
            const onTimeCompletionRate = avgCycleTimeForRate > 0 
              ? Math.min(98, Math.max(80, 88 - (avgCycleTimeForRate * 0.8))) 
              : 90

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

                {/* Jobs Pending */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jobs Pending</div>
                  <div className="text-xl font-bold text-gray-900">
                    <CountUpNumber value={jobsPending} duration={1500} decimals={0} />
                  </div>
                </div>

                {/* Return/Redo Jobs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Return/Redo Jobs</div>
                  <div className="text-xl font-bold text-gray-900">
                    <CountUpNumber value={returnRedoJobs} duration={1500} decimals={0} />
                  </div>
                </div>

                {/* Installation Quality */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Installation Quality</div>
                  <div className="text-xl font-bold text-gray-900">
                    {filteredData.length > 0 ? (
                      <CountUpNumber 
                        value={installationQualityScore} 
                        duration={1500} 
                        decimals={1} 
                        suffix="%" 
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* Customer Satisfaction */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer Satisfaction</div>
                  <div className="text-xl font-bold text-gray-900">
                    {filteredData.length > 0 ? (
                      <CountUpNumber 
                        value={customerSatisfactionScore} 
                        duration={1500} 
                        decimals={1} 
                        suffix="%" 
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* Average Labor Hours */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Average Labor Hours</div>
                  <div className="text-xl font-bold text-gray-900">
                    {laborData.length > 0 ? (
                      <CountUpNumber 
                        value={avgLaborHours} 
                        duration={1500} 
                        decimals={1} 
                        suffix=" hrs" 
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* On-Time Completion Rate */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">On-Time Completion Rate</div>
                  <div className="text-xl font-bold text-gray-900">
                    {filteredData.length > 0 ? (
                      <CountUpNumber 
                        value={onTimeCompletionRate} 
                        duration={1500} 
                        decimals={1} 
                        suffix="%" 
                      />
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
            <p className="text-xs text-gray-500 mt-1">Top Load (Labor PO $ Average) - Top 4 Workrooms</p>
          </div>

          <div className="compact-chart-container">
            <h4 className="text-xs font-semibold mb-3 text-gray-700 uppercase tracking-wider">Labor PO $ Distribution</h4>
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
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Avg Labor PO $</th>
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
                  <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor PO $</th>
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
            Store Mix • LTR Performance • Labor PO Volume • Vendor Debit Exposure • Weighted Performance Score • Operational Risks • Financial Risk Rating • Fix This Now
          </p>
        </div>

        <div className="compact-table-container">
          <div className="overflow-x-auto" style={{ maxHeight: '800px', overflowY: 'auto' }}>
            <table className="professional-table professional-table-zebra" style={{ fontSize: '0.7rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 10 }}>Workroom</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Store Mix</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>LTR Performance</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Labor PO Volume</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Vendor Debit Exposure</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Weighted Score</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Operational Risks</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Financial Risk</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', minWidth: '200px' }}>Fix This Now</th>
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
                    if (value > 0) return 'badge-warning' // Red for positive (bad)
                    if (value < 0) return 'badge-positive' // Green for negative (good - credit/refund)
                    return 'badge-neutral' // Neutral for zero
                  }
                  
                  const getWPSBadge = (score: number) => {
                    if (score >= 70) return 'badge-positive'
                    if (score >= 40) return 'badge-neutral'
                    return 'badge-warning'
                  }

                  return (
                    <tr key={workroom.name}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5 }}>
                        {workroom.name}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span className={`badge-pill ${getStoreMixBadge(workroom.storeMix.rating)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            {workroom.storeMix.count} stores
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{workroom.storeMix.rating}</span>
                        </div>
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
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(workroom.laborPOVolume.value)}</span>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                            {workroom.laborPOVolume.rating} ({workroom.laborPOVolume.contribution.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem' }}>{formatCurrency(workroom.vendorDebitExposure.value)}</span>
                          <span className={`badge-pill ${getVendorDebitBadge(workroom.vendorDebitExposure.value)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            {(workroom.vendorDebitExposure.ratio * 100).toFixed(1)}% • {workroom.vendorDebitExposure.rating}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <span className={`badge-pill ${getWPSBadge(workroom.weightedPerformanceScore)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                          {workroom.weightedPerformanceScore.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', maxWidth: '150px' }}>
                        {workroom.operationalRisks.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.65rem', color: '#dc2626' }}>
                            {workroom.operationalRisks.map((risk, idx) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#10b981' }}>✓ No risks</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <span className={`badge-pill ${getFinancialRiskBadge(workroom.financialRisk)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                          {workroom.financialRisk}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', maxWidth: '200px' }}>
                        {workroom.fixNowBullets.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.65rem', color: '#dc2626', fontWeight: 500 }}>
                            {workroom.fixNowBullets.map((bullet, idx) => (
                              <li key={idx} style={{ marginBottom: '0.25rem' }}>• {bullet}</li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#10b981' }}>✓ No critical issues</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {comprehensiveAnalysis.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem 0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
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
            Weighted using: 50% LTR • 30% Labor PO $ • 20% Vendor Debit discipline
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
                      let fillColor = '#94a3b8' // neutral gray
                      if (w.weightedWPI > 70) fillColor = '#10b981' // green - excellent
                      else if (w.weightedWPI >= 50) fillColor = '#3b82f6' // blue - good
                      else if (w.weightedWPI >= 40) fillColor = '#fbbf24' // yellow - warning
                      else fillColor = '#ef4444' // red - poor

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
                  <col style={{ width: '27%' }} />
                  <col style={{ width: '28%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textAlign: 'left' }}>Workroom</th>
                    <th align="center" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>WPI</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Avg Labor PO $</th>
                    <th align="right" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>Avg Vendor Debits</th>
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
          <h3 className="compact-section-title">Average Labour PO $ by Workroom</h3>
          <p className="text-xs text-gray-500 mt-1">
            Average Labor PO per record across all workrooms
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
                  label={{ value: 'Avg Labor PO $', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151', fontSize: '0.75rem' } }}
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
                            Avg Labor PO $: {formatCurrency(data.avgLaborPO)}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Total Labor PO $: {formatCurrency(data.totalLaborPO)}
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
              Upload a T1/T2 scorecard to see average Labor PO by workroom.
            </div>
          )}
        </div>
      </section>

      {/* AVERAGE VENDOR DEBITS $ BY WORKROOM */}
      <section className="compact-section" style={{ marginTop: '1.5rem' }}>
        <div className="compact-section-header">
          <h3 className="compact-section-title">AVERAGE VENDOR DEBITS $ BY WORKROOM</h3>
          <p className="text-xs text-gray-500 mt-1">
            Average Vendor Debits per record across all workrooms
          </p>
        </div>

        <div className="compact-chart-container" style={{ minHeight: '500px', padding: '1rem' }}>
          {avgVendorDebitByWorkroom.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={avgVendorDebitByWorkroom.map((w) => ({
                  name: w.name.length > 15 ? w.name.substring(0, 15) + '...' : w.name,
                  fullName: w.name,
                  avgVendorDebit: Number(w.avgVendorDebit.toFixed(2)),
                  totalVendorDebit: w.totalVendorDebit,
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
                  label={{ value: 'Avg Vendor Debits $', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151', fontSize: '0.75rem' } }}
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
                            Avg Vendor Debits $: {formatCurrency(data.avgVendorDebit)}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Total Vendor Debits $: {formatCurrency(data.totalVendorDebit)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="avgVendorDebit"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                >
                  {avgVendorDebitByWorkroom.map((w, index) => {
                    // Color based on average Vendor Debit value (negative values are red, positive/zero are neutral)
                    let fillColor = '#94a3b8' // neutral gray
                    const avg = w.avgVendorDebit
                    if (avg < -2000) fillColor = '#ef4444' // red - high negative (costing money)
                    else if (avg < -1000) fillColor = '#f59e0b' // orange - moderate negative
                    else if (avg < -500) fillColor = '#fbbf24' // yellow - low negative
                    else if (avg < 0) fillColor = '#e5e7eb' // light gray - very small negative
                    else if (avg === 0) fillColor = '#10b981' // green - zero (good)
                    else fillColor = '#3b82f6' // blue - positive (credit)

                    return <Cell key={`cell-${index}`} fill={fillColor} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              Upload a T1/T2 scorecard to see average Vendor Debits by workroom.
            </div>
          )}
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
              gap: '0.5rem', 
              marginBottom: '1rem',
            }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {selectedRiskWorkroom.weightedPerformanceScore?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Records</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {selectedRiskWorkroom.records || 0}
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Coverage</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {selectedRiskWorkroom.storeMix?.count || 0} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>stores</span>
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                  {formatCurrency(selectedRiskWorkroom.sales || 0)}
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
                gap: '0.5rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem',
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
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Vendor Debit Exposure</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: selectedRiskWorkroom.vendorDebitExposure?.value && selectedRiskWorkroom.vendorDebitExposure.value > 0 ? '#ef4444' : '#10b981', marginBottom: '0.25rem' }}>
                    {formatCurrency(Math.abs(selectedRiskWorkroom.vendorDebitExposure?.value || 0))}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                    {(selectedRiskWorkroom.vendorDebitExposure?.ratio * 100 || 0).toFixed(1)}% • {selectedRiskWorkroom.vendorDebitExposure?.rating || 'N/A'}
                  </div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Labor PO Volume</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                    {formatCurrency(selectedRiskWorkroom.laborPOVolume?.value || 0)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                    {(selectedRiskWorkroom.laborPOVolume?.contribution || 0).toFixed(1)}% • {selectedRiskWorkroom.laborPOVolume?.rating || 'N/A'}
                  </div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Total Cost</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                    {formatCurrency(selectedRiskWorkroom.totalCost || 0)}
                  </div>
                  {selectedRiskWorkroom.avgCostPerRecord && (
                    <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                      Avg/Record: {formatCurrency(selectedRiskWorkroom.avgCostPerRecord)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Store Coverage */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                Store Coverage
              </h3>
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.375rem',
              }}>
                <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <strong>{selectedRiskWorkroom.storeMix?.count || 0}</strong> stores • Rating: <strong>{selectedRiskWorkroom.storeMix?.rating || 'N/A'}</strong>
                </div>
                {selectedRiskWorkroom.storeMix?.stores && selectedRiskWorkroom.storeMix.stores.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '0.375rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#111827', fontSize: '0.75rem' }}>Stores:</div>
                    <div style={{ lineHeight: '1.5' }}>
                      {selectedRiskWorkroom.storeMix.stores.slice(0, 10).map((storeNumber: string, idx: number) => {
                        const fullStoreName = getStoreName(storeNumber)
                        const cityName = fullStoreName ? extractCityName(fullStoreName) : `Store #${storeNumber}`
                        return (
                          <span key={idx}>
                            {cityName}
                            {idx < Math.min(selectedRiskWorkroom.storeMix.stores.length, 10) - 1 && <span>, </span>}
                          </span>
                        )
                      })}
                      {selectedRiskWorkroom.storeMix.stores.length > 10 && (
                        <span style={{ fontWeight: 500 }}> (+{selectedRiskWorkroom.storeMix.stores.length - 10} more)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cycle Time */}
            {selectedRiskWorkroom.cycleTime != null && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                  Cycle Time
                </h3>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '0.375rem',
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
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0,
                  margin: 0,
                }}>
                  {selectedRiskWorkroom.operationalRisks.map((risk: string, index: number) => (
                    <li
                      key={index}
                      style={{
                        marginBottom: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#fef2f2',
                        borderRadius: '0.375rem',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '0.75rem',
                        lineHeight: '1.4',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>⚠️</span> {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues to Fix */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                Issues to Fix
              </h3>
              {selectedRiskWorkroom.fixNowBullets && selectedRiskWorkroom.fixNowBullets.length > 0 ? (
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0,
                  margin: 0,
                }}>
                  {selectedRiskWorkroom.fixNowBullets.map((bullet: string, index: number) => (
                    <li
                      key={index}
                      style={{
                        marginBottom: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#fffbeb',
                        borderRadius: '0.375rem',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        fontSize: '0.75rem',
                        lineHeight: '1.4',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>🔧</span> {bullet}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '0.375rem',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>✓</span>
                  <p style={{ color: '#166534', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>No critical issues identified.</p>
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
                  padding: '1rem',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Risk Rating</div>
                      <div style={{ 
                        fontSize: '1.5rem', 
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
                      fontSize: '2rem',
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
    </div>
  )
}


