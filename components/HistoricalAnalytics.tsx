'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useNotification } from '@/components/NotificationContext'
import { Upload, CheckCircle2, Calendar, Trash2 } from 'lucide-react'
import CountUpNumber from '@/components/CountUpNumber'
import { getStoreName } from '@/data/storeNames'
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
import {
  getAllHistoricalData,
  saveHistoricalData,
  getHistoricalDataByPeriod,
  getAvailableMonths,
  getAvailableYears,
  deleteHistoricalData,
  clearAllHistoricalData,
  type HistoricalDataEntry,
} from '@/data/historicalDataStorage'
import DualFileUpload from '@/components/DualFileUpload'
import * as XLSX from 'xlsx'
import type { DashboardData, WorkroomData } from '@/context/DataContext'
import { workroomStoreData } from '@/data/workroomStoreData'

const isValidWorkroomName = (name: string): boolean => {
  const normalizedName = (name || '').toLowerCase().trim()
  return (
    normalizedName !== 'location #' &&
    normalizedName !== 'location' &&
    normalizedName !== '' &&
    !normalizedName.includes('location #')
  )
}

export default function HistoricalAnalytics() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [historicalEntries, setHistoricalEntries] = useState<HistoricalDataEntry[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isUploadingVisual, setIsUploadingVisual] = useState(false)
  const [isUploadingSurvey, setIsUploadingSurvey] = useState(false)
  const [visualFileName, setVisualFileName] = useState<string | null>(null)
  const [surveyFileName, setSurveyFileName] = useState<string | null>(null)
  const [pendingVisualData, setPendingVisualData] = useState<WorkroomData[] | null>(null)
  const [pendingSurveyData, setPendingSurveyData] = useState<Partial<WorkroomData>[] | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today's date
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [showUploadWizard, setShowUploadWizard] = useState(false)
  const [uploadStep, setUploadStep] = useState(1)
  const [uploadAnswers, setUploadAnswers] = useState<{
    date?: string
    dataType?: 'visual' | 'survey' | 'both'
    description?: string
  }>({})
  const { showNotification } = useNotification()
  const visualFileInputRef = useRef<HTMLInputElement>(null)
  const surveyFileInputRef = useRef<HTMLInputElement>(null)

  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [filteredEntries, setFilteredEntries] = useState<HistoricalDataEntry[]>([])

  // Load historical data on mount only (client-side)
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      loadHistoricalData()
    }
  }, [])

  // Load historical data from database
  const loadHistoricalData = async () => {
    try {
      const entries = await getAllHistoricalData()
      setHistoricalEntries(entries)
      
      // Load available months and years
      const months = await getAvailableMonths()
      const years = await getAvailableYears()
      setAvailableMonths(months)
      setAvailableYears(years)
    } catch (error) {
      console.error('Error loading historical data:', error)
    }
  }

  // Refresh entries when uploading
  const refreshEntries = async () => {
    await loadHistoricalData()
  }

  // Update filtered entries when filters change
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return
    
    const loadFiltered = async () => {
      try {
        const filtered = await getHistoricalDataByPeriod(
          period,
          selectedMonth || undefined,
          selectedYear || undefined
        )
        setFilteredEntries(filtered)
      } catch (error) {
        console.error('Error loading filtered entries:', error)
        setFilteredEntries([])
      }
    }
    
    loadFiltered()
  }, [period, selectedMonth, selectedYear, historicalEntries, isMounted])

  // Process historical data to create comprehensive analysis (similar to front dashboard)
  const comprehensiveAnalysisData = useMemo(() => {
    if (filteredEntries.length === 0) return []

    // Aggregate data across all historical entries for the selected period
    const workroomMap = new Map<
      string,
      {
        name: string
        totalSales: number
        totalLaborPO: number
        totalVendorDebit: number
        totalRecords: number
        stores: Set<string>
        uploadCount: number
        avgLTRFromSurvey: number | null
        ltrSum: number
        ltrCount: number
      }
    >()

    filteredEntries.forEach((entry) => {
      entry.data.workrooms
        .filter((w) => isValidWorkroomName(w.name || ''))
        .forEach((w) => {
          const existing = workroomMap.get(w.name) || {
            name: w.name || 'Unknown',
            totalSales: 0,
            totalLaborPO: 0,
            totalVendorDebit: 0,
            totalRecords: 0,
            stores: new Set<string>(),
            uploadCount: 0,
            avgLTRFromSurvey: null,
            ltrSum: 0,
            ltrCount: 0,
          }

          existing.totalSales += w.sales || 0
          existing.totalLaborPO += w.laborPO || 0
          existing.totalVendorDebit += w.vendorDebit || 0
          // Only count records that have visual data (not survey-only records)
          const hasVisualData = (w.sales && w.sales > 0) || (w.laborPO && w.laborPO > 0) || (w.vendorDebit && w.vendorDebit !== 0)
          if (hasVisualData) {
            existing.totalRecords += 1
          }
          if (w.store) existing.stores.add(String(w.store))
          if (w.ltrScore != null) {
            existing.ltrSum += w.ltrScore
            existing.ltrCount += 1
          }

          workroomMap.set(w.name, existing)
        })
    })

    // Calculate averages and create analysis data
    // Only include workrooms that have visual data (not survey-only)
    const analysis = Array.from(workroomMap.values())
      .filter((w) => {
        // Only include workrooms with visual data (sales, laborPO, or vendorDebit)
        return (w.totalSales > 0) || (w.totalLaborPO > 0) || (w.totalVendorDebit !== 0)
      })
      .map((w) => {
        // Count how many entries contain this workroom
        const entryCount = filteredEntries.filter((entry) =>
          entry.data.workrooms.some((wr) => wr.name === w.name)
        ).length
        
        // For monthly/yearly views: show TOTALS (sum of all weeks)
        // For weekly view: show AVERAGES (per week)
        const displaySales = period === 'monthly' || period === 'yearly' 
          ? w.totalSales 
          : (entryCount > 0 ? w.totalSales / entryCount : w.totalSales)
        const displayLaborPO = period === 'monthly' || period === 'yearly'
          ? w.totalLaborPO
          : (entryCount > 0 ? w.totalLaborPO / entryCount : w.totalLaborPO)
        const displayVendorDebit = period === 'monthly' || period === 'yearly'
          ? w.totalVendorDebit
          : (entryCount > 0 ? w.totalVendorDebit / entryCount : w.totalVendorDebit)
        
        // Records: For monthly/yearly views, show TOTAL records (sum of all weeks)
        // For weekly view, show TOTAL records (sum across selected weeks) - not averages
        // Jobs completed should always show totals, not averages
        const displayRecords = w.totalRecords
        
        // LTR: ONLY from survey data, used for LTR display only (not WPI / jobs / risk)
        const avgLTR = w.ltrCount > 0 ? w.ltrSum / w.ltrCount : null
        const totalCost = displayLaborPO + displayVendorDebit

        // Calculate weighted performance score
        // IMPORTANT: Survey LTR is NOT used to influence WPI here.
        // WPI is driven only by visual data (Labor PO and Vendor Debits).
        const maxLaborPO = Math.max(...Array.from(workroomMap.values())
          .filter((wr) => (wr.totalSales > 0) || (wr.totalLaborPO > 0) || (wr.totalVendorDebit !== 0))
          .map((wr) => {
            const wrEntryCount = filteredEntries.filter((entry) =>
              entry.data.workrooms.some((wrr) => wrr.name === wr.name)
            ).length
            // Use same logic: totals for monthly/yearly, averages for weekly
            return period === 'monthly' || period === 'yearly'
              ? wr.totalLaborPO
              : (wrEntryCount > 0 ? wr.totalLaborPO / wrEntryCount : wr.totalLaborPO)
          }), 1)
        const laborPOScore = maxLaborPO > 0 ? ((displayLaborPO / maxLaborPO) * 100) : 0

        const vendorDebitRatio = totalCost > 0 ? Math.abs(displayVendorDebit) / totalCost : 0
        const vendorDebitDisciplineScore = Math.max(0, 100 - (vendorDebitRatio * 200))

        // WPI uses ONLY visual data: Labor PO (volume) and Vendor Debits (discipline)
        // No survey LTR is included in this score.
        const weightedPerformanceScore = (laborPOScore * 0.60) + (vendorDebitDisciplineScore * 0.40)

      return {
        name: w.name,
        sales: displaySales,
        laborPO: displayLaborPO,
        vendorDebit: displayVendorDebit,
        totalCost,
        stores: w.stores.size,
        records: displayRecords,
        weightedPerformanceScore,
        avgLTR,
      }
    })

    return analysis.sort((a, b) => b.weightedPerformanceScore - a.weightedPerformanceScore)
  }, [filteredEntries, period])

  // Chart data for bar charts
  const chartData = useMemo(() => {
    return comprehensiveAnalysisData.slice(0, 15).map((w) => ({
      workroom: w.name,
      'WPI Score': w.weightedPerformanceScore,
      'Labor PO $': w.laborPO,
      'Vendor Debit $': Math.abs(w.vendorDebit),
      'Sales $': w.sales,
      'LTR': w.avgLTR || null, // Only use survey LTR data, no fallback
    }))
  }, [comprehensiveAnalysisData])

  // Merge function for combining visual and survey data
  const mergeData = (
    visualData: WorkroomData[],
    surveyData: Partial<WorkroomData>[]
  ): WorkroomData[] => {
    const workroomMap = new Map<string, WorkroomData>()

    visualData.forEach((wr) => {
      const key = `${String(wr.store || '')}|||${wr.name || ''}`
      if (!workroomMap.has(key)) {
        workroomMap.set(key, { ...wr })
      } else {
        const existing = workroomMap.get(key)!
        existing.sales = (existing.sales || 0) + (wr.sales || 0)
        existing.laborPO = (existing.laborPO || 0) + (wr.laborPO || 0)
        existing.vendorDebit = (existing.vendorDebit || 0) + (wr.vendorDebit || 0)
      }
    })

    surveyData.forEach((survey) => {
      const store = String(survey.store || '')
      const workroom = survey.name || ''
      const key = `${store}|||${workroom}`

      if (workroomMap.has(key)) {
        const existing = workroomMap.get(key)!
        Object.assign(existing, survey)
      } else {
        const newRecord: WorkroomData = {
          id: `survey-${Date.now()}-${Math.random()}`,
          name: workroom,
          store: survey.store || '',
          sales: 0,
          laborPO: 0,
          vendorDebit: 0,
          ...survey,
        }
        workroomMap.set(key, newRecord)
      }
    })

    return Array.from(workroomMap.values())
  }

  // Save merged data to historical storage with selected date
  const saveMergedData = async () => {
    if (!selectedDate) {
      showNotification('Please select a date for this data snapshot', 'error')
      return
    }

    try {
      if (pendingVisualData && pendingVisualData.length > 0) {
        const merged = pendingSurveyData && pendingSurveyData.length > 0
          ? mergeData(pendingVisualData, pendingSurveyData)
          : pendingVisualData
        
        const dashboardData: DashboardData = { workrooms: merged }
        const entry = await saveHistoricalData(dashboardData, selectedDate)
        await refreshEntries()
        
        const surveyCount = pendingSurveyData && pendingSurveyData.length > 0 ? pendingSurveyData.length : 0
        
        // Clear pending data
        setPendingVisualData(null)
        setPendingSurveyData(null)
        setVisualFileName(null)
        setSurveyFileName(null)
        // Reset date to today for next upload
        setSelectedDate(new Date().toISOString().split('T')[0])
        
        showNotification(
          `Weekly data uploaded successfully! (${entry.week})${surveyCount > 0 ? ` Merged with ${surveyCount} survey records.` : ''}`,
          'success'
        )
      } else if (pendingSurveyData && pendingSurveyData.length > 0) {
        // Survey-only upload
        const workrooms: WorkroomData[] = pendingSurveyData.map((survey) => ({
          id: `survey-${Date.now()}-${Math.random()}`,
          name: survey.name || 'Unknown',
          store: survey.store || '',
          sales: 0,
          laborPO: 0,
          vendorDebit: 0,
          ...survey,
        }))
        
        const dashboardData: DashboardData = { workrooms }
        const entry = await saveHistoricalData(dashboardData, selectedDate)
        await refreshEntries()
        
        setPendingSurveyData(null)
        setSurveyFileName(null)
        // Reset date to today for next upload
        setSelectedDate(new Date().toISOString().split('T')[0])
        
        showNotification(`Weekly survey data uploaded successfully! (${entry.week})`, 'success')
      }
    } catch (error) {
      console.error('Error saving historical data:', error)
      showNotification('Failed to save historical data. Please try again.', 'error')
    }
  }

  // Parse visual data (reusing logic from DualFileUpload)
  const parseVisualData = async (file: File): Promise<WorkroomData[]> => {
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isCSV = fileName.endsWith('.csv')
    const isJSON = fileName.endsWith('.json')

    if (isJSON) {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      if (jsonData.workrooms && Array.isArray(jsonData.workrooms)) {
        return jsonData.workrooms as WorkroomData[]
      }
      throw new Error('JSON file must contain a "workrooms" array')
    }

    let headers: string[] = []
    let rows: any[][] = []

    if (isExcel) {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      if (jsonData.length < 2) {
        throw new Error('Excel file must have a header row and at least one data row')
      }
      headers = (jsonData[0] as any[]).map((h: any) => String(h ?? '').trim().toLowerCase())
      rows = jsonData.slice(1)
    } else if (isCSV) {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row')
      }
      headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      rows = lines.slice(1).map((line) => line.split(',').map((v) => v.trim()))
    }

    const workroomIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('workroom'))
    let locationIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('location #') || lowerH === 'location'
    })
    if (locationIdx === -1 && headers.length > 4) locationIdx = 4

    const storeIdx = headers.findIndex(
      (h) => typeof h === 'string' && h.includes('store') && !h.includes('store name')
    )
    const salesIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('sales') || lowerH.includes('revenue') || lowerH.includes('amount') || lowerH.includes('dollar') || lowerH.includes('$')
    })
    const laborPOIdx = headers.findIndex(
      (h) => typeof h === 'string' && (h.includes('labor po') || h === 'labor po $')
    )
    const vendorDebitIdx = headers.findIndex(
      (h) => typeof h === 'string' && (h.includes('vendor debits') || h.includes('vendor debit'))
    )
    const cycleTimeIdx = headers.findIndex(
      (h) => typeof h === 'string' && h.includes('cycle time')
    )

    const workrooms: WorkroomData[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const locationValue = locationIdx >= 0 ? String(row[locationIdx] || '').trim() : ''
      const storeSource = storeIdx >= 0 ? String(row[storeIdx] || '').trim() : locationValue
      const storeNumber = Number(storeSource || locationValue)
      const mapped = workroomStoreData.find((r) => r.store === storeNumber)
      const nameSource = workroomIdx >= 0 ? row[workroomIdx] : mapped?.workroom || storeSource || `Record ${i + 1}`

      let salesValue = 0
      if (salesIdx >= 0 && row[salesIdx] != null) {
        const salesRaw = row[salesIdx]
        if (typeof salesRaw === 'number') {
          salesValue = salesRaw
        } else if (typeof salesRaw === 'string') {
          const cleaned = String(salesRaw).replace(/[$€£¥,\s]/g, '').trim()
          salesValue = Number(cleaned) || 0
        } else {
          salesValue = Number(salesRaw) || 0
        }
      }

      const workroom: WorkroomData = {
        id: `visual-${i}-${Date.now()}`,
        name: mapped?.workroom || String(nameSource || '').trim(),
        store: mapped?.store ?? storeSource ?? '',
        sales: salesValue,
        laborPO: laborPOIdx >= 0 ? Number(row[laborPOIdx] || 0) : 0,
        vendorDebit: vendorDebitIdx >= 0 ? Number(row[vendorDebitIdx] || 0) : 0,
      }

      if (cycleTimeIdx >= 0 && row[cycleTimeIdx] != null && row[cycleTimeIdx] !== '') {
        workroom.cycleTime = Number(row[cycleTimeIdx]) || 0
      }

      workrooms.push(workroom)
    }
    return workrooms
  }

  // Parse survey data (reusing logic from DualFileUpload)
  const parseSurveyData = async (file: File): Promise<Partial<WorkroomData>[]> => {
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isCSV = fileName.endsWith('.csv')
    const isJSON = fileName.endsWith('.json')

    if (isJSON) {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      if (jsonData.surveys && Array.isArray(jsonData.surveys)) {
        return jsonData.surveys
      }
      throw new Error('JSON file must contain a "surveys" array')
    }

    let headers: string[] = []
    let rows: any[][] = []

    if (isExcel) {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      if (jsonData.length < 2) {
        throw new Error('Excel file must have a header row and at least one data row')
      }
      headers = (jsonData[0] as any[]).map((h: any) => String(h ?? '').trim().toLowerCase())
      rows = jsonData.slice(1)
    } else if (isCSV) {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row')
      }
      headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      rows = lines.slice(1).map((line) => line.split(',').map((v) => v.trim()))
    }

    const workroomIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('workroom'))
    let locationIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('location #') || lowerH === 'location'
    })
    if (locationIdx === -1 && headers.length > 4) locationIdx = 4

    const storeIdx = headers.findIndex(
      (h) => typeof h === 'string' && h.includes('store') && !h.includes('store name')
    )
    const surveyDateIdx = headers.findIndex((h) => typeof h === 'string' && h.toLowerCase().trim().includes('survey date'))
    const surveyCommentIdx = headers.findIndex((h) => typeof h === 'string' && h.toLowerCase().trim().includes('survey comment'))
    const laborCategoryIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('labor category') || h.includes('category')))
    const ltrScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('ltr score') || h === 'ltr'))
    const craftScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('craft score') || h === 'craft'))
    const profScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('prof score') || h.includes('professional score')))
    const reliableHomeImprovementScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('reliable home improvement') || h.includes('rhis')))
    const timeTakenToCompleteIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('time taken') || h.includes('time to complete')))
    const projectValueScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('project value') || h.includes('prs')))
    const installerKnowledgeScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('installer knowledge') || h.includes('iks')))

    const surveyRecords: Partial<WorkroomData>[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const locationValue = locationIdx >= 0 ? String(row[locationIdx] || '').trim() : ''
      const storeSource = storeIdx >= 0 ? String(row[storeIdx] || '').trim() : locationValue
      const storeNumber = Number(storeSource || locationValue)
      const mapped = workroomStoreData.find((r) => r.store === storeNumber)
      const nameSource = workroomIdx >= 0 ? row[workroomIdx] : mapped?.workroom || storeSource || `Record ${i + 1}`
      const workroomName = mapped?.workroom || String(nameSource || '').trim()

      const hasSurveyData =
        (surveyDateIdx >= 0 && row[surveyDateIdx]) ||
        (ltrScoreIdx >= 0 && row[ltrScoreIdx]) ||
        (craftScoreIdx >= 0 && row[craftScoreIdx]) ||
        (profScoreIdx >= 0 && row[profScoreIdx]) ||
        (reliableHomeImprovementScoreIdx >= 0 && row[reliableHomeImprovementScoreIdx])

      if (!hasSurveyData) continue

      const surveyRecord: Partial<WorkroomData> = {
        name: workroomName,
        store: mapped?.store ?? storeSource ?? '',
      }

      if (surveyDateIdx >= 0 && row[surveyDateIdx] != null && row[surveyDateIdx] !== '') {
        surveyRecord.surveyDate = row[surveyDateIdx]
      }
      if (surveyCommentIdx >= 0 && row[surveyCommentIdx] != null && row[surveyCommentIdx] !== '') {
        surveyRecord.surveyComment = String(row[surveyCommentIdx]).trim()
      }
      if (laborCategoryIdx >= 0 && row[laborCategoryIdx] != null && row[laborCategoryIdx] !== '') {
        const categoryValue = String(row[laborCategoryIdx]).trim()
        surveyRecord.laborCategory = categoryValue
        surveyRecord.category = categoryValue
      }
      if (ltrScoreIdx >= 0 && row[ltrScoreIdx] != null && row[ltrScoreIdx] !== '') {
        surveyRecord.ltrScore = Number(row[ltrScoreIdx]) || null
      }
      if (craftScoreIdx >= 0 && row[craftScoreIdx] != null && row[craftScoreIdx] !== '') {
        surveyRecord.craftScore = Number(row[craftScoreIdx]) || null
      }
      if (profScoreIdx >= 0 && row[profScoreIdx] != null && row[profScoreIdx] !== '') {
        const score = Number(row[profScoreIdx]) || null
        surveyRecord.profScore = score
        surveyRecord.professionalScore = score
      }
      if (reliableHomeImprovementScoreIdx >= 0 && row[reliableHomeImprovementScoreIdx] != null && row[reliableHomeImprovementScoreIdx] !== '') {
        const score = Number(row[reliableHomeImprovementScoreIdx]) || null
        surveyRecord.reliableHomeImprovementScore = score
        surveyRecord.reliableHomeImprovement = score
      }
      if (timeTakenToCompleteIdx >= 0 && row[timeTakenToCompleteIdx] != null && row[timeTakenToCompleteIdx] !== '') {
        const time = Number(row[timeTakenToCompleteIdx]) || null
        surveyRecord.timeTakenToComplete = time
        surveyRecord.timeToComplete = time
      }
      if (projectValueScoreIdx >= 0 && row[projectValueScoreIdx] != null && row[projectValueScoreIdx] !== '') {
        const score = Number(row[projectValueScoreIdx]) || null
        surveyRecord.projectValueScore = score
        surveyRecord.projectValue = score
      }
      if (installerKnowledgeScoreIdx >= 0 && row[installerKnowledgeScoreIdx] != null && row[installerKnowledgeScoreIdx] !== '') {
        const score = Number(row[installerKnowledgeScoreIdx]) || null
        surveyRecord.installerKnowledgeScore = score
        surveyRecord.installerKnowledge = score
      }

      surveyRecords.push(surveyRecord)
    }
    return surveyRecords
  }

  // Handle visual data upload (from wizard)
  const handleVisualDataUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingVisual(true)
    setVisualFileName(null)

    try {
      const visualData = await parseVisualData(file)
      setVisualFileName(file.name)
      setPendingVisualData(visualData)
      showNotification(`Visual data loaded successfully!`, 'success')
    } catch (error: any) {
      console.error('Visual data upload error:', error)
      showNotification(`Error uploading visual data: ${error.message}`, 'error')
      setVisualFileName(null)
    } finally {
      setIsUploadingVisual(false)
      if (visualFileInputRef.current) {
        visualFileInputRef.current.value = ''
      }
    }
  }

  // Handle survey data upload (from wizard)
  const handleSurveyDataUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingSurvey(true)
    setSurveyFileName(null)

    try {
      const surveyData = await parseSurveyData(file)
      setSurveyFileName(file.name)
      setPendingSurveyData(surveyData)
      showNotification(`Survey data loaded successfully!`, 'success')
    } catch (error: any) {
      console.error('Survey data upload error:', error)
      showNotification(`Error uploading survey data: ${error.message}`, 'error')
      setSurveyFileName(null)
    } finally {
      setIsUploadingSurvey(false)
      if (surveyFileInputRef.current) {
        surveyFileInputRef.current.value = ''
      }
    }
  }

  // Start upload wizard
  const startUploadWizard = () => {
    setShowUploadWizard(true)
    setUploadStep(1)
    setUploadAnswers({})
    setPendingVisualData(null)
    setPendingSurveyData(null)
    setVisualFileName(null)
    setSurveyFileName(null)
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  // Reset wizard
  const resetWizard = () => {
    setShowUploadWizard(false)
    setUploadStep(1)
    setUploadAnswers({})
    setPendingVisualData(null)
    setPendingSurveyData(null)
    setVisualFileName(null)
    setSurveyFileName(null)
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  // Next step in wizard
  const nextStep = () => {
    if (uploadStep === 1 && !uploadAnswers.date) {
      showNotification('Please select a date for this data snapshot', 'error')
      return
    }
    if (uploadStep === 2 && !uploadAnswers.dataType) {
      showNotification('Please select the type of data you are uploading', 'error')
      return
    }
    if (uploadStep === 3) {
      // Check if files are uploaded based on data type
      if (uploadAnswers.dataType === 'visual' && !pendingVisualData) {
        showNotification('Please upload visual data file', 'error')
        return
      }
      if (uploadAnswers.dataType === 'survey' && !pendingSurveyData) {
        showNotification('Please upload survey data file', 'error')
        return
      }
      if (uploadAnswers.dataType === 'both' && (!pendingVisualData || !pendingSurveyData)) {
        showNotification('Please upload both visual and survey data files', 'error')
        return
      }
      // Save the data
      setSelectedDate(uploadAnswers.date || new Date().toISOString().split('T')[0])
      saveMergedData()
      resetWizard()
      return
    }
    setUploadStep(uploadStep + 1)
  }

  // Previous step in wizard
  const prevStep = () => {
    if (uploadStep > 1) {
      setUploadStep(uploadStep - 1)
    }
  }

  const formatCurrency = (value: number) =>
    value === 0 ? '$0' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Workroom Data</h2>
          <p className="text-gray-600">
            Comprehensive Workroom Analysis Dashboard with weekly, monthly, and yearly trends
          </p>
        </div>
        {isMounted && historicalEntries.length > 0 && (
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to clear all historical data? This action cannot be undone.')) {
                await clearAllHistoricalData()
                await refreshEntries()
                showNotification('All historical data cleared', 'success')
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Clear All Data
          </button>
        )}
      </div>

      {/* Upload Weekly Data Section */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Weekly Data</h3>
          <Calendar size={20} className="text-gray-500" />
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Upload weekly data snapshots to track historical trends. This data is stored separately and does not affect the main dashboard.
        </p>

        {!showUploadWizard ? (
          <button
            onClick={startUploadWizard}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Start Upload Process
          </button>
        ) : (
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${uploadStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  1
                </div>
                <span className={`text-sm font-medium ${uploadStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Date</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                <div className={`h-full transition-all ${uploadStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: uploadStep >= 2 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${uploadStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <span className={`text-sm font-medium ${uploadStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Type</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                <div className={`h-full transition-all ${uploadStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: uploadStep >= 3 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${uploadStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
                <span className={`text-sm font-medium ${uploadStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Files</span>
              </div>
            </div>

            {/* Step 1: Date Selection */}
            {uploadStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Select Date</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    What date does this data represent? Choose the day, month, and year to help the system categorize it correctly.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Date
                  </label>
                  <input
                    type="date"
                    value={uploadAnswers.date || selectedDate}
                    onChange={(e) => setUploadAnswers({ ...uploadAnswers, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {uploadAnswers.date && (
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {new Date(uploadAnswers.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Data Type Selection */}
            {uploadStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Select Data Type</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    What type of data are you uploading?
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setUploadAnswers({ ...uploadAnswers, dataType: 'visual' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      uploadAnswers.dataType === 'visual'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1">Visual Data</div>
                    <div className="text-xs text-gray-600">Sales, Labor PO, Vendor Debit, Cycle Time</div>
                  </button>
                  <button
                    onClick={() => setUploadAnswers({ ...uploadAnswers, dataType: 'survey' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      uploadAnswers.dataType === 'survey'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1">Survey Data</div>
                    <div className="text-xs text-gray-600">LTR, Craft, Prof Scores, Survey Comments</div>
                  </button>
                  <button
                    onClick={() => setUploadAnswers({ ...uploadAnswers, dataType: 'both' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      uploadAnswers.dataType === 'both'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1">Both Types</div>
                    <div className="text-xs text-gray-600">Visual and Survey data together</div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: File Upload */}
            {uploadStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Upload Files</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your data files based on the type you selected.
                  </p>
                </div>
                <div className="space-y-3">
                  {(uploadAnswers.dataType === 'visual' || uploadAnswers.dataType === 'both') && (
                    <div className="relative">
                      <input
                        ref={visualFileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.json"
                        onChange={handleVisualDataUpload}
                        disabled={isUploadingVisual}
                        className="absolute opacity-0 w-0 h-0 overflow-hidden"
                        id="visual-historical-upload-input"
                      />
                      <label
                        htmlFor="visual-historical-upload-input"
                        className={`cursor-pointer inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg transition-colors border-2 ${
                          pendingVisualData
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Upload size={18} />
                        <span className="text-sm font-medium whitespace-nowrap">
                          {isUploadingVisual ? 'Uploading...' : pendingVisualData ? 'Visual Data Uploaded ✓' : 'Upload Visual Data'}
                        </span>
                        {visualFileName && <CheckCircle2 size={16} className="text-green-500 ml-2" />}
                      </label>
                      {visualFileName && (
                        <p className="text-xs text-gray-500 mt-1 truncate" title={visualFileName}>
                          {visualFileName}
                        </p>
                      )}
                    </div>
                  )}

                  {(uploadAnswers.dataType === 'survey' || uploadAnswers.dataType === 'both') && (
                    <div className="relative">
                      <input
                        ref={surveyFileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.json"
                        onChange={handleSurveyDataUpload}
                        disabled={isUploadingSurvey}
                        className="absolute opacity-0 w-0 h-0 overflow-hidden"
                        id="survey-historical-upload-input"
                      />
                      <label
                        htmlFor="survey-historical-upload-input"
                        className={`cursor-pointer inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg transition-colors border-2 ${
                          pendingSurveyData
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Upload size={18} />
                        <span className="text-sm font-medium whitespace-nowrap">
                          {isUploadingSurvey ? 'Uploading...' : pendingSurveyData ? 'Survey Data Uploaded ✓' : 'Upload Survey Data'}
                        </span>
                        {surveyFileName && <CheckCircle2 size={16} className="text-green-500 ml-2" />}
                      </label>
                      {surveyFileName && (
                        <p className="text-xs text-gray-500 mt-1 truncate" title={surveyFileName}>
                          {surveyFileName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={resetWizard}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                {uploadStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {uploadStep === 3 ? 'Save & Complete' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}
        {isMounted && historicalEntries.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Uploaded weeks: {historicalEntries.length}</p>
            <div className="flex flex-wrap gap-2">
              {historicalEntries.slice(0, 10).map((entry) => (
                <span
                  key={entry.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {entry.week}
                  <button
                    onClick={async () => {
                      await deleteHistoricalData(entry.id)
                      await refreshEntries()
                      showNotification('Historical entry deleted', 'success')
                    }}
                    className="ml-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
              {historicalEntries.length > 10 && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  +{historicalEntries.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Summary Dashboard Cards */}
      {isMounted && comprehensiveAnalysisData.length > 0 && (
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Historical Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Average LTR Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105 border-2 border-blue-400">
              <div className="mb-3">
                <div className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                  Average LTR
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {(() => {
                  // Only use survey LTR data, no fallback to calculated LTR%
                  let totalLTRSum = 0
                  let totalLTRCount = 0
                  comprehensiveAnalysisData.forEach((w) => {
                    if (w.avgLTR != null) {
                      totalLTRSum += w.avgLTR
                      totalLTRCount += 1
                    }
                  })
                  const avgLTR = totalLTRCount > 0 ? totalLTRSum / totalLTRCount : null
                  return avgLTR != null ? (
                    <CountUpNumber value={avgLTR} duration={1.2} decimals={1} />
                  ) : (
                    '—'
                  )
                })()}
              </div>
              <div className="text-sm font-medium text-blue-100">Average across all workrooms</div>
            </div>

            {/* Jobs Completed Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105 border-2 border-green-400">
              <div className="mb-3">
                <div className="text-xs font-bold text-green-100 uppercase tracking-wider">
                  Jobs Completed
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                <CountUpNumber
                  value={comprehensiveAnalysisData.reduce((sum, w) => sum + w.records, 0)}
                  duration={1.2}
                  decimals={0}
                />
              </div>
              <div className="text-sm font-medium text-green-100">Total records across all workrooms</div>
            </div>

            {/* Labor PO $ Card */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105 border-2 border-purple-400">
              <div className="mb-3">
                <div className="text-xs font-bold text-purple-100 uppercase tracking-wider">
                  Labor PO $
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {formatCurrency(
                  comprehensiveAnalysisData.reduce((sum, w) => sum + w.laborPO, 0)
                )}
              </div>
              <div className="text-sm font-medium text-purple-100">Total Labor PO across all workrooms</div>
            </div>

            {/* Vendor Debits Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105 border-2 border-orange-400">
              <div className="mb-3">
                <div className="text-xs font-bold text-orange-100 uppercase tracking-wider">
                  Vendor Debits
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {formatCurrency(
                  Math.abs(comprehensiveAnalysisData.reduce((sum, w) => sum + w.vendorDebit, 0))
                )}
              </div>
              <div className="text-sm font-medium text-orange-100">Total Vendor Debits across all workrooms</div>
            </div>

            {/* WPI Score Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105 border-2 border-indigo-400">
              <div className="mb-3">
                <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
                  WPI Score
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {(() => {
                  const totalWPI = comprehensiveAnalysisData.reduce((sum, w) => sum + w.weightedPerformanceScore, 0)
                  const avgWPI = comprehensiveAnalysisData.length > 0 ? totalWPI / comprehensiveAnalysisData.length : 0
                  return (
                    <CountUpNumber value={avgWPI} duration={1.2} decimals={1} />
                  )
                })()}
              </div>
              <div className="text-sm font-medium text-indigo-100">Average WPI across all workrooms</div>
            </div>
          </div>
        </section>
      )}

      {/* Period Filter */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">View Period & Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')
                // Clear month/year filters when changing view type
                if (e.target.value === 'yearly') {
                  setSelectedMonth('')
                }
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {isMounted && availableYears.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Year</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value)
                  // Clear month if year changes
                  if (e.target.value) {
                    setSelectedMonth('')
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isMounted && (period as string) !== 'yearly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
                disabled={period === 'yearly'}
              >
                <option value="">All Months</option>
                {availableMonths.length > 0 ? (
                  availableMonths
                    .filter((month) => !selectedYear || month.startsWith(selectedYear))
                    .map((month) => {
                      const [year, monthNum] = month.split('-')
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('en-US', { month: 'long' })
                      return (
                        <option key={month} value={month}>
                          {monthName} {year}
                        </option>
                      )
                    })
                ) : (
                  <option disabled>No months available</option>
                )}
              </select>
            </div>
          )}
        </div>

        {(selectedMonth || selectedYear) && (
          <div className="mb-4">
            <button
              onClick={() => {
                setSelectedMonth('')
                setSelectedYear('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        <p className="text-sm text-gray-600">
          {isMounted ? (
            <>
              Showing {filteredEntries.length} data point{filteredEntries.length !== 1 ? 's' : ''} 
              {selectedYear && ` for ${selectedYear}`}
              {selectedMonth && ` - ${new Date(selectedMonth + '-01').toLocaleString('en-US', { month: 'long' })}`}
              {` (${period} view)`}
            </>
          ) : (
            <>Loading historical data...</>
          )}
        </p>
      </section>

      {/* Bar Chart - Trends */}
      {isMounted && chartData.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Trends ({period} view)
          </h3>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="workroom"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => value.toFixed(1)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="WPI Score" fill="#3b82f6" />
                <Bar dataKey="Labor PO $" fill="#10b981" />
                <Bar dataKey="Vendor Debit $" fill="#ef4444" />
                {period !== 'weekly' && <Bar dataKey="Sales $" fill="#f59e0b" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Comprehensive Workroom Analysis Dashboard Table */}
      {isMounted && comprehensiveAnalysisData.length > 0 ? (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Comprehensive Workroom Analysis Dashboard ({period} view)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Store Mix • LTR Performance • Labor PO Volume • Vendor Debit Exposure • Weighted Performance Score • Operational Risks • Financial Risk Rating
            </p>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
                {comprehensiveAnalysisData.map((workroom) => {
                  const getStoreMixBadge = (stores: number) => {
                    if (stores >= 10) return 'badge-positive'
                    if (stores >= 5) return 'badge-positive'
                    if (stores >= 3) return 'badge-neutral'
                    return 'badge-warning'
                  }

                  // LTR badge based ONLY on visual data (Labor PO vs Sales), not survey data
                  const getLTRBadge = (ltrPercent: number | null) => {
                    if (ltrPercent == null) return 'badge-neutral'
                    if (ltrPercent < 15) return 'badge-positive'
                    if (ltrPercent < 25) return 'badge-positive'
                    if (ltrPercent < 35) return 'badge-neutral'
                    return 'badge-warning'
                  }

                  const getVendorDebitBadge = (value: number) => {
                    if (value > 0) return 'badge-warning'
                    if (value < 0) return 'badge-positive'
                    return 'badge-neutral'
                  }

                  const getWPSBadge = (score: number) => {
                    if (score >= 70) return 'badge-positive'
                    if (score >= 40) return 'badge-neutral'
                    return 'badge-warning'
                  }

                  const getFinancialRiskBadge = (risk: string) => {
                    if (risk === 'Low') return 'badge-positive'
                    if (risk === 'Moderate') return 'badge-neutral'
                    return 'badge-warning'
                  }

                  // LTR% from visual data only: Labor PO $ / Sales $
                  const ltrPercent = workroom.sales > 0 ? (workroom.laborPO / workroom.sales) * 100 : null
                  const vendorDebitRatio = workroom.totalCost > 0 ? Math.abs(workroom.vendorDebit) / workroom.totalCost : 0
                  const totalLaborPO = comprehensiveAnalysisData.reduce((sum, w) => sum + w.laborPO, 0)
                  const laborPOContribution = totalLaborPO > 0 ? (workroom.laborPO / totalLaborPO) * 100 : 0

                  // Store mix rating
                  let storeMixRating = 'Low'
                  if (workroom.stores >= 10) storeMixRating = 'Excellent'
                  else if (workroom.stores >= 5) storeMixRating = 'Good'
                  else if (workroom.stores >= 3) storeMixRating = 'Moderate'

                  // LTR Performance - from visual data only (Labor PO vs Sales), NOT survey
                  let ltrRating = 'N/A'
                  if (ltrPercent != null) {
                    if (ltrPercent < 15) ltrRating = 'Excellent'
                    else if (ltrPercent < 25) ltrRating = 'Good'
                    else if (ltrPercent < 35) ltrRating = 'Moderate'
                    else if (ltrPercent < 45) ltrRating = 'Poor'
                    else ltrRating = 'Critical'
                  }

                  // Labor PO Volume
                  let laborPOVolume = 'Low'
                  if (laborPOContribution >= 15) laborPOVolume = 'Very High'
                  else if (laborPOContribution >= 10) laborPOVolume = 'High'
                  else if (laborPOContribution >= 5) laborPOVolume = 'Moderate'
                  else if (laborPOContribution >= 2) laborPOVolume = 'Low'
                  else laborPOVolume = 'Very Low'

                  // Vendor Debit Exposure
                  let vendorDebitExposure = 'Low'
                  if (vendorDebitRatio >= 0.4) vendorDebitExposure = 'Critical'
                  else if (vendorDebitRatio >= 0.3) vendorDebitExposure = 'High'
                  else if (vendorDebitRatio >= 0.2) vendorDebitExposure = 'Moderate'
                  else if (vendorDebitRatio > 0) vendorDebitExposure = 'Low'
                  else vendorDebitExposure = 'None'

                  // Operational Risks
                  const operationalRisks: string[] = []
                  if (workroom.stores < 3) operationalRisks.push('Limited store coverage')
                  if (workroom.records < 5) operationalRisks.push('Low record volume')

                  // Financial Risk - based ONLY on visual data (vendor debits + visual LTR%), not survey
                  let financialRisk = 'Low'
                  if (vendorDebitRatio > 0.3) financialRisk = 'High'
                  if (ltrPercent != null && ltrPercent > 40) {
                    if (financialRisk === 'Low') financialRisk = 'Moderate'
                  }
                  if (vendorDebitRatio > 0.4 || (ltrPercent != null && ltrPercent > 50)) {
                    financialRisk = 'Critical'
                  }

                  // Fix This Now - visual data only
                  const fixNowBullets: string[] = []
                  if (vendorDebitRatio > 0.3) {
                    fixNowBullets.push(`Reduce vendor debit exposure (${(vendorDebitRatio * 100).toFixed(1)}%)`)
                  }
                  if (ltrPercent != null && ltrPercent > 35) {
                    fixNowBullets.push(`Improve LTR% performance (${ltrPercent.toFixed(1)}%)`)
                  }
                  if (workroom.stores < 3) {
                    fixNowBullets.push(`Expand store coverage (${workroom.stores} stores)`)
                  }

                  return (
                    <tr key={workroom.name}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5 }}>
                        {workroom.name}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span className={`badge-pill ${getStoreMixBadge(workroom.stores)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            {workroom.stores} stores
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{storeMixRating}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        {ltrPercent != null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span className={`badge-pill ${getLTRBadge(ltrPercent)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                              {ltrPercent.toFixed(1)}%
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{ltrRating}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(workroom.laborPO)}</span>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                            {laborPOVolume} ({laborPOContribution.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem' }}>{formatCurrency(workroom.vendorDebit)}</span>
                          <span className={`badge-pill ${getVendorDebitBadge(workroom.vendorDebit)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            {(vendorDebitRatio * 100).toFixed(1)}% • {vendorDebitExposure}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <span className={`badge-pill ${getWPSBadge(workroom.weightedPerformanceScore)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', fontWeight: 600 }}>
                          {workroom.weightedPerformanceScore.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', maxWidth: '150px' }}>
                        {operationalRisks.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.65rem', color: '#dc2626' }}>
                            {operationalRisks.map((risk, idx) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#10b981' }}>✓ No risks</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
                        <span className={`badge-pill ${getFinancialRiskBadge(financialRisk)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                          {financialRisk}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', minWidth: '200px' }}>
                        {fixNowBullets.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.65rem', color: '#dc2626' }}>
                            {fixNowBullets.map((bullet, idx) => (
                              <li key={idx}>{bullet}</li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#10b981' }}>✓ No actions needed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">No historical data available</p>
          <p className="text-gray-400 text-sm">
            Upload weekly data snapshots to see workroom data and trends.
          </p>
        </section>
      )}
    </div>
  )
}

