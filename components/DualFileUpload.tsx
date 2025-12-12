'use client'

import { useState, useRef } from 'react'
import { useData } from '@/context/DataContext'
import { useNotification } from '@/components/NotificationContext'
import { Upload, FileText, CheckCircle2, XCircle } from 'lucide-react'
import type { DashboardData, WorkroomData } from '@/context/DataContext'
import * as XLSX from 'xlsx'
import { workroomStoreData } from '@/data/workroomStoreData'
import { getStoreName } from '@/data/storeNames'

export default function DualFileUpload() {
  const [isUploadingVisual, setIsUploadingVisual] = useState(false)
  const [isUploadingSurvey, setIsUploadingSurvey] = useState(false)
  const [visualFileName, setVisualFileName] = useState<string | null>(null)
  const [surveyFileName, setSurveyFileName] = useState<string | null>(null)
  const { data, setData } = useData()
  const { showNotification } = useNotification()
  const visualFileInputRef = useRef<HTMLInputElement>(null)
  const surveyFileInputRef = useRef<HTMLInputElement>(null)

  // Helper function to parse visual data (sales, labor PO, vendor debit, cycle time, workroom/store info)
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

    // Map headers for visual data
    const workroomIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('workroom'))
    let locationIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('location #') || lowerH === 'location'
    })
    if (locationIdx === -1 && headers.length > 4) {
      locationIdx = 4
    }

    const storeIdx = headers.findIndex(
      (h) => typeof h === 'string' && h.includes('store') && !h.includes('store name')
    )

    const salesIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return (
        lowerH.includes('sales') ||
        lowerH.includes('revenue') ||
        lowerH.includes('amount') ||
        lowerH.includes('dollar') ||
        lowerH.includes('$')
      )
    })

    const laborPOIdx = headers.findIndex(
      (h) => typeof h === 'string' && (h.includes('labor po') || h === 'labor po $')
    )
    const vendorDebitIdx = headers.findIndex(
      (h) => typeof h === 'string' && (h.includes('vendor debits') || h.includes('vendor debit'))
    )
    // Use column AC (index 28) for Cycle Time data
    // Column AC is the 29th column (A=0, B=1, ..., AC=28)
    const cycleTimeIdx = headers.length > 28 ? 28 : headers.findIndex(
      (h) => typeof h === 'string' && h.includes('cycle time')
    )
    // Use column T (index 19) for Completed data in Excel files
    // Column T is the 20th column (A=0, B=1, ..., T=19)
    const completedIdx = headers.length > 19 ? 19 : -1
    // Details Cycle Time breakdown (columns P–T)
    // P=15, Q=16, R=17, S=18 (Total Provider Cycle Time), T=19 (Completed)
    const detailsRtsSchedIdx = headers.length > 15 ? 15 : -1 // Column P - RTS - Sch (Details)
    const detailsSchedStartIdx = headers.length > 16 ? 16 : -1 // Column Q - Sch - Start (Details)
    const detailsStartDocsSubIdx = headers.length > 17 ? 17 : -1 // Column R - Start - Docs Sub (Details)
    const detailsCycleTimeIdx = headers.length > 18 ? 18 : -1 // Column S - Details Cycle Time (Total Provider Cycle Time)
    // completedIdx is Column T (index 19) - Completed
    // Job Cycle Time breakdown (columns U–Y)
    // U=20, V=21, W=22, X=23 (Total Detail), Y=24 (Total Jobs)
    const rtsSchedDetailsIdx = headers.length > 20 ? 20 : -1
    const schedStartDetailsIdx = headers.length > 21 ? 21 : -1
    const startDocsSubDetailsIdx = headers.length > 22 ? 22 : -1
    const totalDetailCycleTimeIdx = headers.length > 23 ? 23 : -1 // Column X
    const rtsSchedJobsIdx = -1
    const schedStartJobsIdx = -1
    const startCompleteJobsIdx = -1
    const jobsWorkCycleTimeIdx = headers.length > 24 ? 24 : -1
    // Work Order Cycle Time breakdown (columns Z–AC)
    // Z=25, AA=26, AB=27, AC=28 (0-based)
    const workOrderStage1Idx = headers.length > 25 ? 25 : -1 // Column Z
    const workOrderStage2Idx = headers.length > 26 ? 26 : -1 // Column AA
    const workOrderStage3Idx = headers.length > 27 ? 27 : -1 // Column AB
    const totalWorkOrderCycleTimeIdx = headers.length > 28 ? 28 : -1 // Column AC
    // Reschedule Rate breakdown (columns AD–AH)
    // AD=29, AE=30, AF=31, AG=32, AH=33 (0-based)
    const rescheduleRateIdx = headers.length > 29 ? 29 : -1 // Column AD - Reschedule Rate
    const rescheduleRateLYIdx = headers.length > 30 ? 30 : -1 // Column AE - Reschedule Rate Last Year
    const detailRateIdx = headers.length > 31 ? 31 : -1 // Column AF - Detail Reschedule Rate
    const jobRateIdx = headers.length > 32 ? 32 : -1 // Column AG - Job Reschedule Rate
    const workOrderRateIdx = headers.length > 33 ? 33 : -1 // Column AH - Work Order Reschedule Rate
    // Get it Right breakdown (columns AQ–AR)
    // AQ=42, AR=43 (0-based)
    const getItRightIdx = headers.length > 42 ? 42 : -1 // Column AQ - Get it Right
    const getItRightLYIdx = headers.length > 43 ? 43 : -1 // Column AR - Get it Right Last Year
    const workrooms: WorkroomData[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const locationValue = locationIdx >= 0 ? String(row[locationIdx] || '').trim() : ''
      const storeSource = storeIdx >= 0 ? String(row[storeIdx] || '').trim() : locationValue
      const storeNumber = Number(storeSource || locationValue)

      const mapped = workroomStoreData.find((r) => r.store === storeNumber)

      const nameSource =
        workroomIdx >= 0
          ? row[workroomIdx]
          : mapped?.workroom || storeSource || `Record ${i + 1}`

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

      let workroomName = mapped?.workroom || String(nameSource || '').trim()
      // Normalize workroom names
      if (workroomName === 'Panama Cit') {
        workroomName = 'Panama City'
      }

      const workroom: WorkroomData = {
        id: `visual-${i}-${Date.now()}`,
        name: workroomName,
        store: mapped?.store ?? storeSource ?? '',
        sales: salesValue,
        laborPO: laborPOIdx >= 0 ? Number(row[laborPOIdx] || 0) : 0,
        vendorDebit: vendorDebitIdx >= 0 ? Number(row[vendorDebitIdx] || 0) : 0,
      }

      if (cycleTimeIdx >= 0 && row[cycleTimeIdx] != null && row[cycleTimeIdx] !== '') {
        workroom.cycleTime = Number(row[cycleTimeIdx]) || 0
      }

      if (completedIdx >= 0 && row[completedIdx] != null && row[completedIdx] !== '') {
        const completedValue = Number(row[completedIdx])
        // Store the value even if it's 0.0 (we want to sum all values including zeros)
        if (!isNaN(completedValue)) {
          workroom.completed = completedValue
        }
      }
      // Details Cycle Time breakdown (columns P–S)
      if (detailsRtsSchedIdx >= 0 && row[detailsRtsSchedIdx] != null && row[detailsRtsSchedIdx] !== '') {
        const val = Number(row[detailsRtsSchedIdx])
        if (!isNaN(val)) workroom.detailsRtsSched = val
      }
      if (detailsSchedStartIdx >= 0 && row[detailsSchedStartIdx] != null && row[detailsSchedStartIdx] !== '') {
        const val = Number(row[detailsSchedStartIdx])
        if (!isNaN(val)) workroom.detailsSchedStart = val
      }
      if (detailsStartDocsSubIdx >= 0 && row[detailsStartDocsSubIdx] != null && row[detailsStartDocsSubIdx] !== '') {
        const val = Number(row[detailsStartDocsSubIdx])
        if (!isNaN(val)) workroom.detailsStartDocsSub = val
      }
      if (detailsCycleTimeIdx >= 0 && row[detailsCycleTimeIdx] != null && row[detailsCycleTimeIdx] !== '') {
        const val = Number(row[detailsCycleTimeIdx])
        if (!isNaN(val)) workroom.detailsCycleTime = val
      }

      if (rtsSchedDetailsIdx >= 0 && row[rtsSchedDetailsIdx] != null && row[rtsSchedDetailsIdx] !== '') {
        const val = Number(row[rtsSchedDetailsIdx])
        if (!isNaN(val)) workroom.rtsSchedDetails = val
      }
      if (schedStartDetailsIdx >= 0 && row[schedStartDetailsIdx] != null && row[schedStartDetailsIdx] !== '') {
        const val = Number(row[schedStartDetailsIdx])
        if (!isNaN(val)) workroom.schedStartDetails = val
      }
      if (startDocsSubDetailsIdx >= 0 && row[startDocsSubDetailsIdx] != null && row[startDocsSubDetailsIdx] !== '') {
        const val = Number(row[startDocsSubDetailsIdx])
        if (!isNaN(val)) workroom.startDocsSubDetails = val
      }
      if (detailsCycleTimeIdx >= 0 && row[detailsCycleTimeIdx] != null && row[detailsCycleTimeIdx] !== '') {
        const val = Number(row[detailsCycleTimeIdx])
        if (!isNaN(val)) workroom.detailsCycleTime = val
      }
      if (totalDetailCycleTimeIdx >= 0 && row[totalDetailCycleTimeIdx] != null && row[totalDetailCycleTimeIdx] !== '') {
        const val = Number(row[totalDetailCycleTimeIdx])
        if (!isNaN(val)) workroom.totalDetailCycleTime = val
      }
      if (rtsSchedJobsIdx >= 0 && row[rtsSchedJobsIdx] != null && row[rtsSchedJobsIdx] !== '') {
        const val = Number(row[rtsSchedJobsIdx])
        if (!isNaN(val)) workroom.rtsSchedJobs = val
      }
      if (schedStartJobsIdx >= 0 && row[schedStartJobsIdx] != null && row[schedStartJobsIdx] !== '') {
        const val = Number(row[schedStartJobsIdx])
        if (!isNaN(val)) workroom.schedStartJobs = val
      }
      if (startCompleteJobsIdx >= 0 && row[startCompleteJobsIdx] != null && row[startCompleteJobsIdx] !== '') {
        const val = Number(row[startCompleteJobsIdx])
        if (!isNaN(val)) workroom.startCompleteJobs = val
      }
      if (jobsWorkCycleTimeIdx >= 0 && row[jobsWorkCycleTimeIdx] != null && row[jobsWorkCycleTimeIdx] !== '') {
        const val = Number(row[jobsWorkCycleTimeIdx])
        if (!isNaN(val)) workroom.jobsWorkCycleTime = val
      }
      if (workOrderStage1Idx >= 0 && row[workOrderStage1Idx] != null && row[workOrderStage1Idx] !== '') {
        const val = Number(row[workOrderStage1Idx])
        if (!isNaN(val)) workroom.workOrderStage1 = val
      }
      if (workOrderStage2Idx >= 0 && row[workOrderStage2Idx] != null && row[workOrderStage2Idx] !== '') {
        const val = Number(row[workOrderStage2Idx])
        if (!isNaN(val)) workroom.workOrderStage2 = val
      }
      if (workOrderStage3Idx >= 0 && row[workOrderStage3Idx] != null && row[workOrderStage3Idx] !== '') {
        const val = Number(row[workOrderStage3Idx])
        if (!isNaN(val)) workroom.workOrderStage3 = val
      }
      if (totalWorkOrderCycleTimeIdx >= 0 && row[totalWorkOrderCycleTimeIdx] != null && row[totalWorkOrderCycleTimeIdx] !== '') {
        const val = Number(row[totalWorkOrderCycleTimeIdx])
        if (!isNaN(val)) workroom.totalWorkOrderCycleTime = val
      }

      if (rescheduleRateIdx >= 0 && row[rescheduleRateIdx] != null && row[rescheduleRateIdx] !== '') {
        const rescheduleRateValue = Number(row[rescheduleRateIdx])
        // Store the value even if it's 0 or 0.1 (we want to include all values in the average)
        if (!isNaN(rescheduleRateValue)) {
          workroom.rescheduleRate = rescheduleRateValue
        }
      }
      if (rescheduleRateLYIdx >= 0 && row[rescheduleRateLYIdx] != null && row[rescheduleRateLYIdx] !== '') {
        const val = Number(row[rescheduleRateLYIdx])
        if (!isNaN(val)) workroom.rescheduleRateLY = val
      }
      if (detailRateIdx >= 0 && row[detailRateIdx] != null && row[detailRateIdx] !== '') {
        const val = Number(row[detailRateIdx])
        if (!isNaN(val)) workroom.detailRate = val
      }
      if (jobRateIdx >= 0 && row[jobRateIdx] != null && row[jobRateIdx] !== '') {
        const val = Number(row[jobRateIdx])
        if (!isNaN(val)) workroom.jobRate = val
      }
      if (workOrderRateIdx >= 0 && row[workOrderRateIdx] != null && row[workOrderRateIdx] !== '') {
        const val = Number(row[workOrderRateIdx])
        if (!isNaN(val)) workroom.workOrderRate = val
      }

      if (getItRightIdx >= 0 && row[getItRightIdx] != null && row[getItRightIdx] !== '') {
        const getItRightValue = Number(row[getItRightIdx])
        if (!isNaN(getItRightValue)) {
          workroom.getItRight = getItRightValue
        }
      }
      if (getItRightLYIdx >= 0 && row[getItRightLYIdx] != null && row[getItRightLYIdx] !== '') {
        const val = Number(row[getItRightLYIdx])
        if (!isNaN(val)) workroom.getItRightLY = val
      }

      if (detailsCycleTimeIdx >= 0 && row[detailsCycleTimeIdx] != null && row[detailsCycleTimeIdx] !== '') {
        const detailsCycleTimeValue = Number(row[detailsCycleTimeIdx])
        if (!isNaN(detailsCycleTimeValue)) {
          workroom.detailsCycleTime = detailsCycleTimeValue
        }
      }

      workrooms.push(workroom)
    }

    return workrooms
  }

  // Helper function to parse survey data (survey scores, LTR, Craft, Prof, survey dates, etc.)
  // Returns records, total row count, and raw Excel data
  const parseSurveyData = async (file: File): Promise<{
    records: Partial<WorkroomData>[]
    totalRows: number
    rawColumnL: number[]
    rawCraft: number[]
    rawProf: number[]
    rawLaborCategories: string[]
    rawCompanyValues: string[]
    rawInstallerNames: string[]
  }> => {
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

    // Map headers for survey data
    const workroomIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('workroom'))
    let locationIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('location #') || lowerH === 'location'
    })
    if (locationIdx === -1 && headers.length > 4) {
      locationIdx = 4
    }

    const storeIdx = headers.findIndex(
      (h) => typeof h === 'string' && h.includes('store') && !h.includes('store name')
    )

    const surveyDateIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('survey date')
    })

    const surveyCommentIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('survey comment')
    })

    const laborCategoryIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('labor category') || lowerH.includes('category')
    })

    // Use column T (index 19) for Company
    // Column T is the 20th column (A=0, B=1, ..., T=19)
    // ALWAYS use index 19 for column T, don't search by header
    const companyColumnIdx = headers.length > 19 ? 19 : -1
    
    // Find column U by header "INSTALLER NAME" or use index 20
    // Column U is the 21st column (A=0, B=1, ..., U=20)
    const installerNameHeaderIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('installer name') || lowerH === 'installer name'
    })
    const installerNameColumnIdx = installerNameHeaderIdx >= 0 ? installerNameHeaderIdx : (headers.length > 20 ? 20 : -1) // Fallback to index 20 if header not found

    // Use column J (index 9) for PO Number in survey files
    // Column J is the 10th column (A=0, B=1, ..., J=9)
    const poNumberIdx = 9
    
    // Use column L (index 11) for LTR Score in survey files
    // Column L is the 12th column (A=0, B=1, ..., L=11)
    // ALWAYS use index 11 for column L, don't fall back to header search
    const ltrScoreIdx = 11
    const craftScoreIdx = headers.findIndex(
      (h) => typeof h === 'string' && (h.includes('craft score') || h === 'craft')
    )
    const profScoreIdx = headers.findIndex(
      (h) =>
        typeof h === 'string' &&
        (h.includes('prof score') || h.includes('professional score'))
    )

    const reliableHomeImprovementScoreIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('reliable home improvement') || lowerH.includes('rhis')
    })

    const timeTakenToCompleteIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('time taken') || lowerH.includes('time to complete')
    })

    const projectValueScoreIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('project value') || lowerH.includes('prs')
    })

    const installerKnowledgeScoreIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('installer knowledge') || lowerH.includes('iks')
    })

    const surveyRecords: Partial<WorkroomData>[] = []
    const columnLValues: number[] = [] // Track all column L values from Excel
    const craftValues: number[] = [] // Track all Craft scores from Excel
    const profValues: number[] = [] // Track all Prof scores from Excel
    const laborCategories: string[] = [] // Track all Labor Categories from Excel
    const companyValues: string[] = [] // Track all Company values from column T
    const installerNames: string[] = [] // Track all Installer Name values from column U

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const locationValue = locationIdx >= 0 ? String(row[locationIdx] || '').trim() : ''
      const storeSource = storeIdx >= 0 ? String(row[storeIdx] || '').trim() : locationValue
      const storeNumber = Number(storeSource || locationValue)

      const mapped = workroomStoreData.find((r) => r.store === storeNumber)

      const nameSource =
        workroomIdx >= 0
          ? row[workroomIdx]
          : mapped?.workroom || storeSource || `Record ${i + 1}`

      let workroomName = mapped?.workroom || String(nameSource || '').trim()
      // Normalize workroom names
      if (workroomName === 'Panama Cit') {
        workroomName = 'Panama City'
      }

      // Read column L (index 11) - include ALL rows, even if column L is empty
      // We want to capture every row from the survey file
      let columnLValue: number | null = null
      if (row.length > 11) {
        const rawValue = row[11]
        if (rawValue != null && rawValue !== '') {
          const numValue = Number(rawValue)
          if (!isNaN(numValue)) {
            columnLValue = numValue
            columnLValues.push(numValue) // Debug: track all valid column L values
          }
        }
      }

      // Include ALL rows from survey file - don't filter
      // Create record even if column L is empty (for other survey fields)
      const surveyRecord: Partial<WorkroomData> = {
        name: workroomName,
        store: mapped?.store ?? storeSource ?? '',
      }

      // Read column J (index 9) for PO Number
      if (row.length > 9) {
        const rawPoNumber = row[9]
        if (rawPoNumber != null && rawPoNumber !== '') {
          surveyRecord.poNumber = String(rawPoNumber).trim()
        }
      }

      // Only set ltrScore if column L has a valid value
      if (columnLValue !== null) {
        surveyRecord.ltrScore = columnLValue
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
        laborCategories.push(categoryValue) // Track raw Labor Category from Excel
      }

      // Read column T (index 19) for Company
      if (companyColumnIdx >= 0 && row.length > companyColumnIdx) {
        const rawCompanyValue = row[companyColumnIdx]
        // Check if value exists and is not empty/null/undefined
        if (rawCompanyValue != null && rawCompanyValue !== '' && rawCompanyValue !== undefined) {
          const companyValue = String(rawCompanyValue).trim()
          // Only set if it's a valid non-empty string
          if (companyValue && companyValue !== 'undefined' && companyValue !== 'null' && companyValue.length > 0) {
            surveyRecord.company = companyValue
            companyValues.push(companyValue)
            // Debug: Log first few company values to verify column T
            if (companyValues.length <= 3) {
              console.log(`[Survey Parsing] Company from column (index ${companyColumnIdx}, header: "${headers[companyColumnIdx]}"):`, companyValue)
            }
          } else if (companyValues.length <= 3) {
            console.log(`[Survey Parsing] Company value found but empty/invalid at index ${companyColumnIdx}:`, rawCompanyValue)
          }
        } else if (i < 3) {
          console.log(`[Survey Parsing] No company value at index ${companyColumnIdx} for row ${i}, raw value:`, rawCompanyValue)
        }
      } else if (i < 3) {
        console.log(`[Survey Parsing] Company column index ${companyColumnIdx} is invalid or row too short (length: ${row.length}), headers length: ${headers.length}`)
      }

      // Read column U (index 20) for Installer Name (header "INSTALLER NAME")
      if (installerNameColumnIdx >= 0 && row.length > installerNameColumnIdx) {
        const rawInstallerNameValue = row[installerNameColumnIdx]
        // Check if value exists and is not empty/null/undefined
        if (rawInstallerNameValue != null && rawInstallerNameValue !== '' && rawInstallerNameValue !== undefined) {
          const installerNameValue = String(rawInstallerNameValue).trim()
          // Only set if it's a valid non-empty string
          if (installerNameValue && installerNameValue !== 'undefined' && installerNameValue !== 'null' && installerNameValue.length > 0) {
            surveyRecord.installerName = installerNameValue
            installerNames.push(installerNameValue)
            // Debug: Log first few installer name values to verify column U
            if (installerNames.length <= 3) {
              console.log(`[Survey Parsing] Installer Name from column U (index ${installerNameColumnIdx}):`, installerNameValue)
            }
          }
        }
      }
      if (craftScoreIdx >= 0 && row[craftScoreIdx] != null && row[craftScoreIdx] !== '') {
        const craftValue = Number(row[craftScoreIdx])
        if (!isNaN(craftValue)) {
          surveyRecord.craftScore = craftValue
          craftValues.push(craftValue) // Track raw Craft value from Excel
        }
      }
      if (profScoreIdx >= 0 && row[profScoreIdx] != null && row[profScoreIdx] !== '') {
        const profValue = Number(row[profScoreIdx])
        if (!isNaN(profValue)) {
          surveyRecord.profScore = profValue
          surveyRecord.professionalScore = profValue
          profValues.push(profValue) // Track raw Prof value from Excel
        }
      }

      if (
        reliableHomeImprovementScoreIdx >= 0 &&
        row[reliableHomeImprovementScoreIdx] != null &&
        row[reliableHomeImprovementScoreIdx] !== ''
      ) {
        const score = Number(row[reliableHomeImprovementScoreIdx]) || null
        surveyRecord.reliableHomeImprovementScore = score
        surveyRecord.reliableHomeImprovement = score
      }

      if (
        timeTakenToCompleteIdx >= 0 &&
        row[timeTakenToCompleteIdx] != null &&
        row[timeTakenToCompleteIdx] !== ''
      ) {
        const time = Number(row[timeTakenToCompleteIdx]) || null
        surveyRecord.timeTakenToComplete = time
        surveyRecord.timeToComplete = time
      }

      if (
        projectValueScoreIdx >= 0 &&
        row[projectValueScoreIdx] != null &&
        row[projectValueScoreIdx] !== ''
      ) {
        const score = Number(row[projectValueScoreIdx]) || null
        surveyRecord.projectValueScore = score
        surveyRecord.projectValue = score
      }

      if (
        installerKnowledgeScoreIdx >= 0 &&
        row[installerKnowledgeScoreIdx] != null &&
        row[installerKnowledgeScoreIdx] !== ''
      ) {
        const score = Number(row[installerKnowledgeScoreIdx]) || null
        surveyRecord.installerKnowledgeScore = score
        surveyRecord.installerKnowledge = score
      }

      surveyRecords.push(surveyRecord)
    }

    // Debug: log parsing results
    const totalRowsFromFile = rows.length // Actual total rows from Excel file
    console.log('Survey File Parsing:', {
      totalRows: totalRowsFromFile,
      recordsCreated: surveyRecords.length,
      columnLValuesFound: columnLValues.length,
      craftValuesFound: craftValues.length,
      profValuesFound: profValues.length,
      laborCategoriesFound: laborCategories.length
    })

    return {
      records: surveyRecords,
      totalRows: totalRowsFromFile,
      rawColumnL: columnLValues,
      rawCraft: craftValues,
      rawProf: profValues,
      rawLaborCategories: laborCategories,
      rawCompanyValues: companyValues,
      rawInstallerNames: installerNames
    }
  }

  // Smart merge function: combines visual data with survey data by matching store number and workroom name
  const mergeData = (
    visualData: WorkroomData[],
    surveyData: Partial<WorkroomData>[]
  ): WorkroomData[] => {
    // Create a map of existing workrooms from visual data
    const workroomMap = new Map<string, WorkroomData>()

    // Index visual data by store + workroom key
    visualData.forEach((wr) => {
      const key = `${String(wr.store || '')}|||${wr.name || ''}`
      if (!workroomMap.has(key)) {
        workroomMap.set(key, { ...wr })
      } else {
        // If duplicate, merge sales/labor/vendor data (sum them)
        const existing = workroomMap.get(key)!
        existing.sales = (existing.sales || 0) + (wr.sales || 0)
        existing.laborPO = (existing.laborPO || 0) + (wr.laborPO || 0)
        existing.vendorDebit = (existing.vendorDebit || 0) + (wr.vendorDebit || 0)
      }
    })

    // Merge survey data into visual data
    surveyData.forEach((survey) => {
      const store = String(survey.store || '')
      const workroom = survey.name || ''
      const key = `${store}|||${workroom}`

      if (workroomMap.has(key)) {
        // Merge survey data into existing visual record
        const existing = workroomMap.get(key)!
        Object.assign(existing, survey)
      } else {
        // Create new record from survey data (with minimal visual data)
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

  const handleVisualDataUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingVisual(true)
    setVisualFileName(null)

    try {
      const visualData = await parseVisualData(file)
      setVisualFileName(file.name)

      // DON'T merge - keep visual data separate from survey data
      // Keep existing survey data and add all visual records separately
      const existingSurveyData: WorkroomData[] = data.workrooms.filter(
        (w) => w.ltrScore != null || w.craftScore != null || w.profScore != null
      )

      // Combine: survey data + all visual records (no merging)
      setData({ workrooms: [...existingSurveyData, ...visualData] })
      showNotification(
        `Successfully uploaded ${visualData.length} visual data records! ${
          existingSurveyData.length > 0
            ? `Kept ${existingSurveyData.length} existing survey records separate.`
            : ''
        }`,
        'success'
      )
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

  const handleSurveyDataUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingSurvey(true)
    setSurveyFileName(null)

    try {
      const { 
        records: surveyData, 
        totalRows: excelFileTotalRows,
        rawColumnL,
        rawCraft,
        rawProf,
        rawLaborCategories,
        rawCompanyValues,
        rawInstallerNames
      } = await parseSurveyData(file)
      setSurveyFileName(file.name)

      // DON'T merge - keep survey data separate from visual data
      // Keep existing visual data and add all survey records separately
      const existingVisualData: WorkroomData[] = data.workrooms.filter(
        (w) => w.sales != null || w.laborPO != null || w.vendorDebit != null
      )

      // Convert survey data to full WorkroomData records (each row = one record)
      const surveyRecords: WorkroomData[] = surveyData.map((survey, index) => ({
        id: `survey-${Date.now()}-${index}`,
        name: survey.name || 'Unknown',
        store: survey.store || '',
        sales: 0,
        laborPO: 0,
        vendorDebit: 0,
        ...survey,
      }))

      // Combine: visual data + all survey records (no merging)
      // Store ALL raw values directly from Excel file for dashboard use
      setData({ 
        workrooms: [...existingVisualData, ...surveyRecords],
        rawColumnLValues: rawColumnL,
        rawCraftValues: rawCraft,
        rawProfValues: rawProf,
        rawLaborCategories: rawLaborCategories,
        rawCompanyValues: rawCompanyValues,
        rawInstallerNames: rawInstallerNames,
        excelFileTotalRows: excelFileTotalRows
      })
      showNotification(
        `Successfully uploaded ${surveyData.length} survey data records! ${
          existingVisualData.length > 0
            ? `Kept ${existingVisualData.length} existing visual records separate.`
            : ''
        }`,
        'success'
      )
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

  return (
    <div className="space-y-3">
      {/* Visual Data Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Visual Data
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Sales, Total Sales, Vendor Debit, Cycle Time, Workroom/Store info
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={visualFileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.json"
            onChange={handleVisualDataUpload}
            disabled={isUploadingVisual}
            className="hidden"
            id="visual-upload-input"
          />
          <label
            htmlFor="visual-upload-input"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
              isUploadingVisual
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isUploadingVisual ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload Visual Data</span>
              </>
            )}
          </label>
        </div>
        {visualFileName && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="truncate">{visualFileName}</span>
          </div>
        )}
      </div>

      {/* Survey Data Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Survey Data
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Survey Scores (LTR, Craft, Prof), Survey Dates, Comments, Labor Category
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={surveyFileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.json"
            onChange={handleSurveyDataUpload}
            disabled={isUploadingSurvey}
            className="hidden"
            id="survey-upload-input"
          />
          <label
            htmlFor="survey-upload-input"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
              isUploadingSurvey
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isUploadingSurvey ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload Survey Data</span>
              </>
            )}
          </label>
        </div>
        {surveyFileName && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="truncate">{surveyFileName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

