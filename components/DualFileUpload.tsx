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
    // Use column X (index 23) for Jobs Work Cycle Time data
    // Column X is the 24th column (A=0, B=1, ..., X=23)
    const jobsWorkCycleTimeIdx = headers.length > 23 ? 23 : -1
    // Use column AD (index 29) for Reschedule Rate data
    // Column AD is the 30th column (A=0, B=1, ..., AD=29)
    const rescheduleRateIdx = headers.length > 29 ? 29 : -1
    // Use column AQ (index 42) for Get it Right data
    // Column AQ is the 43rd column (A=0, B=1, ..., AQ=42)
    const getItRightIdx = headers.length > 42 ? 42 : -1
    // Use column S (index 18) for Details Cycle Time data
    // Column S is the 19th column (A=0, B=1, ..., S=18)
    const detailsCycleTimeIdx = headers.length > 18 ? 18 : -1

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

      if (jobsWorkCycleTimeIdx >= 0 && row[jobsWorkCycleTimeIdx] != null && row[jobsWorkCycleTimeIdx] !== '') {
        const jobsWorkCycleTimeValue = Number(row[jobsWorkCycleTimeIdx])
        if (!isNaN(jobsWorkCycleTimeValue)) {
          workroom.jobsWorkCycleTime = jobsWorkCycleTimeValue
        }
      }

      if (rescheduleRateIdx >= 0 && row[rescheduleRateIdx] != null && row[rescheduleRateIdx] !== '') {
        const rescheduleRateValue = Number(row[rescheduleRateIdx])
        // Store the value even if it's 0 or 0.1 (we want to include all values in the average)
        if (!isNaN(rescheduleRateValue)) {
          workroom.rescheduleRate = rescheduleRateValue
        }
      }

      if (getItRightIdx >= 0 && row[getItRightIdx] != null && row[getItRightIdx] !== '') {
        const getItRightValue = Number(row[getItRightIdx])
        if (!isNaN(getItRightValue)) {
          workroom.getItRight = getItRightValue
        }
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
      rawLaborCategories: laborCategories
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
        rawLaborCategories
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

