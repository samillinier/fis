'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle2, Lock, RotateCcw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { workroomStoreData } from '@/data/workroomStoreData'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import type { DashboardData, WorkroomData } from '@/context/DataContext'
import { useYearlyData } from '@/context/YearlyDataContext'
import { loadYearlyFileNames, saveYearlyFileNames } from '@/lib/database'

type FileNames = { visualFileName: string | null; surveyFileName: string | null }

export default function YearlyDualFileUpload() {
  const { isAdmin, isOwner } = useAuth()
  const canViewYearlyUploads = isAdmin || isOwner
  const canEditYearlyUploads = isAdmin
  const { showNotification } = useNotification()
  const { year, data, setData, resetData } = useYearlyData()

  const [isUploadingVisual, setIsUploadingVisual] = useState(false)
  const [isUploadingSurvey, setIsUploadingSurvey] = useState(false)
  const [visualFileName, setVisualFileName] = useState<string | null>(null)
  const [surveyFileName, setSurveyFileName] = useState<string | null>(null)

  const visualFileInputRef = useRef<HTMLInputElement>(null)
  const surveyFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const run = async () => {
      const names = await loadYearlyFileNames(year)
      const hasData = Array.isArray(data.workrooms) && data.workrooms.length > 0
      setVisualFileName(hasData ? names.visualFileName : null)
      setSurveyFileName(hasData ? names.surveyFileName : null)
    }
    run()
  }, [year, data.workrooms.length])

  const persistVisualFileName = (name: string | null) => {
    setVisualFileName(name)
    void saveYearlyFileNames(year, name, surveyFileName)
  }

  const persistSurveyFileName = (name: string | null) => {
    setSurveyFileName(name)
    void saveYearlyFileNames(year, visualFileName, name)
  }

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
    } else {
      throw new Error('Unsupported file type. Please upload .xlsx, .xls, .csv, or .json')
    }

    const workroomIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('workroom'))
    let locationIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('location #') || lowerH === 'location'
    })
    if (locationIdx === -1 && headers.length > 4) locationIdx = 4

    const storeIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('store') && !h.includes('store name'))
    const salesIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('sales') || lowerH.includes('revenue') || lowerH.includes('amount') || lowerH.includes('dollar') || lowerH.includes('$')
    })
    const laborPOIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('labor po') || h === 'labor po $'))
    const vendorDebitIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('vendor debits') || h.includes('vendor debit')))
    const cycleTimeIdx = headers.length > 28 ? 28 : headers.findIndex((h) => typeof h === 'string' && h.includes('cycle time'))
    // Match main uploader column mapping so operational metrics populate
    const completedIdx = headers.length > 19 ? 19 : -1 // Column T
    const detailsRtsSchedIdx = headers.length > 15 ? 15 : -1 // Column P
    const detailsSchedStartIdx = headers.length > 16 ? 16 : -1 // Column Q
    const detailsStartDocsSubIdx = headers.length > 17 ? 17 : -1 // Column R
    const detailsCycleTimeIdx = headers.length > 18 ? 18 : -1 // Column S
    const rtsSchedDetailsIdx = headers.length > 20 ? 20 : -1 // Column U
    const schedStartDetailsIdx = headers.length > 21 ? 21 : -1 // Column V
    const startDocsSubDetailsIdx = headers.length > 22 ? 22 : -1 // Column W
    const totalDetailCycleTimeIdx = headers.length > 23 ? 23 : -1 // Column X
    const jobsWorkCycleTimeIdx = headers.length > 23 ? 23 : -1 // Column X (used by app)
    const workOrderStage1Idx = headers.length > 25 ? 25 : -1 // Column Z
    const workOrderStage2Idx = headers.length > 26 ? 26 : -1 // Column AA
    const workOrderStage3Idx = headers.length > 27 ? 27 : -1 // Column AB
    const totalWorkOrderCycleTimeIdx = headers.length > 28 ? 28 : -1 // Column AC
    const rescheduleRateIdx = headers.length > 29 ? 29 : -1 // Column AD
    const rescheduleRateLYIdx = headers.length > 30 ? 30 : -1 // Column AE
    const detailRateIdx = headers.length > 31 ? 31 : -1 // Column AF
    const jobRateIdx = headers.length > 32 ? 32 : -1 // Column AG
    const workOrderRateIdx = headers.length > 33 ? 33 : -1 // Column AH
    const getItRightIdx = headers.length > 42 ? 42 : -1 // Column AQ
    const getItRightLYIdx = headers.length > 43 ? 43 : -1 // Column AR

    const workrooms: WorkroomData[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const locationValue = locationIdx >= 0 ? String(row[locationIdx] || '').trim() : ''
      const storeSource = storeIdx >= 0 ? String(row[storeIdx] || '').trim() : locationValue
      const storeNumber = Number(storeSource || locationValue)
      const mapped = workroomStoreData.find((r) => r.store === storeNumber)

      const nameSource =
        workroomIdx >= 0 ? row[workroomIdx] : mapped?.workroom || storeSource || `Record ${i + 1}`

      let salesValue = 0
      if (salesIdx >= 0 && row[salesIdx] != null) {
        const salesRaw = row[salesIdx]
        if (typeof salesRaw === 'number') salesValue = salesRaw
        else if (typeof salesRaw === 'string') {
          const cleaned = String(salesRaw).replace(/[$€£¥,\s]/g, '').trim()
          salesValue = Number(cleaned) || 0
        } else {
          salesValue = Number(salesRaw) || 0
        }
      }

      let workroomName = mapped?.workroom || String(nameSource || '').trim()
      if (workroomName === 'Panama Cit') workroomName = 'Panama City'

      const workroom: WorkroomData = {
        id: `yearly-visual-${i}-${Date.now()}`,
        name: workroomName,
        store: mapped?.store ?? storeSource ?? '',
        sales: salesValue,
        laborPO: laborPOIdx >= 0 ? Number(row[laborPOIdx] || 0) : 0,
        vendorDebit: vendorDebitIdx >= 0 ? Number(row[vendorDebitIdx] || 0) : 0,
      }

      if (cycleTimeIdx >= 0 && row[cycleTimeIdx] != null && row[cycleTimeIdx] !== '') {
        workroom.cycleTime = Number(row[cycleTimeIdx]) || 0
      }

      // Completed (Jobs Completed)
      if (completedIdx >= 0 && row[completedIdx] != null && row[completedIdx] !== '') {
        const val = Number(row[completedIdx])
        if (!isNaN(val)) workroom.completed = val
      }

      // Details cycle breakdown
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

      // Job cycle / detail fields used by UI
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
      if (totalDetailCycleTimeIdx >= 0 && row[totalDetailCycleTimeIdx] != null && row[totalDetailCycleTimeIdx] !== '') {
        const val = Number(row[totalDetailCycleTimeIdx])
        if (!isNaN(val)) workroom.totalDetailCycleTime = val
      }
      if (jobsWorkCycleTimeIdx >= 0 && row[jobsWorkCycleTimeIdx] != null && row[jobsWorkCycleTimeIdx] !== '') {
        const val = Number(row[jobsWorkCycleTimeIdx])
        if (!isNaN(val)) workroom.jobsWorkCycleTime = val
      }

      // Work order cycle breakdown
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

      // Reschedule rate (normalize fraction -> percent like main uploader)
      if (rescheduleRateIdx >= 0 && row[rescheduleRateIdx] != null && row[rescheduleRateIdx] !== '') {
        let val = Number(row[rescheduleRateIdx])
        if (!isNaN(val) && val > 0 && val <= 1) val = val * 100
        if (!isNaN(val)) workroom.rescheduleRate = val
      }
      if (rescheduleRateLYIdx >= 0 && row[rescheduleRateLYIdx] != null && row[rescheduleRateLYIdx] !== '') {
        let val = Number(row[rescheduleRateLYIdx])
        if (!isNaN(val) && val > 0 && val <= 1) val = val * 100
        if (!isNaN(val)) workroom.rescheduleRateLY = val
      }
      if (detailRateIdx >= 0 && row[detailRateIdx] != null && row[detailRateIdx] !== '') {
        let val = Number(row[detailRateIdx])
        if (!isNaN(val) && val > 0 && val <= 1) val = val * 100
        if (!isNaN(val)) workroom.detailRate = val
      }
      if (jobRateIdx >= 0 && row[jobRateIdx] != null && row[jobRateIdx] !== '') {
        let val = Number(row[jobRateIdx])
        if (!isNaN(val) && val > 0 && val <= 1) val = val * 100
        if (!isNaN(val)) workroom.jobRate = val
      }
      if (workOrderRateIdx >= 0 && row[workOrderRateIdx] != null && row[workOrderRateIdx] !== '') {
        let val = Number(row[workOrderRateIdx])
        if (!isNaN(val) && val > 0 && val <= 1) val = val * 100
        if (!isNaN(val)) workroom.workOrderRate = val
      }

      // Get It Right
      if (getItRightIdx >= 0 && row[getItRightIdx] != null && row[getItRightIdx] !== '') {
        const val = Number(row[getItRightIdx])
        if (!isNaN(val)) workroom.getItRight = val
      }
      if (getItRightLYIdx >= 0 && row[getItRightLYIdx] != null && row[getItRightLYIdx] !== '') {
        const val = Number(row[getItRightLYIdx])
        if (!isNaN(val)) workroom.getItRightLY = val
      }

      workrooms.push(workroom)
    }

    return workrooms
  }

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
    } else {
      throw new Error('Unsupported file type. Please upload .xlsx, .xls, .csv, or .json')
    }

    const workroomIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('workroom'))
    let locationIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('location #') || lowerH === 'location'
    })
    if (locationIdx === -1 && headers.length > 4) locationIdx = 4

    const storeIdx = headers.findIndex((h) => typeof h === 'string' && h.includes('store') && !h.includes('store name'))

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

    const companyColumnIdx = headers.length > 19 ? 19 : -1

    const installerNameHeaderIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('installer name') || lowerH === 'installer name'
    })
    const installerNameColumnIdx = installerNameHeaderIdx >= 0 ? installerNameHeaderIdx : (headers.length > 20 ? 20 : -1)

    const customerNameHeaderIdx = headers.findIndex((h) => {
      if (typeof h !== 'string') return false
      const lowerH = h.toLowerCase().trim()
      return lowerH.includes('customer name') || lowerH === 'customer' || lowerH.includes('customer')
    })
    const customerNameColumnIdx =
      customerNameHeaderIdx >= 0 ? customerNameHeaderIdx : headers.length > 21 ? 21 : -1

    const poNumberIdx = 9
    const ltrScoreIdx = 11
    const columnMIdx = 12
    const columnNIdx = 13
    const columnPIdx = 15
    const columnQIdx = 16

    const craftScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('craft score') || h === 'craft'))
    const profScoreIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes('prof score') || h.includes('professional score')))
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
    const columnLValues: number[] = []
    const craftValues: number[] = []
    const profValues: number[] = []
    const laborCategories: string[] = []
    const companyValues: string[] = []
    const installerNames: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const locationValue = locationIdx >= 0 ? String(row[locationIdx] || '').trim() : ''
      const storeSource = storeIdx >= 0 ? String(row[storeIdx] || '').trim() : locationValue
      const storeNumber = Number(storeSource || locationValue)
      const mapped = workroomStoreData.find((r) => r.store === storeNumber)

      const nameSource =
        workroomIdx >= 0 ? row[workroomIdx] : mapped?.workroom || storeSource || `Record ${i + 1}`

      let workroomName = mapped?.workroom || String(nameSource || '').trim()
      if (workroomName === 'Panama Cit') workroomName = 'Panama City'

      let columnLValue: number | null = null
      if (row.length > ltrScoreIdx) {
        const rawValue = row[ltrScoreIdx]
        if (rawValue != null && rawValue !== '') {
          const numValue = Number(rawValue)
          if (!isNaN(numValue)) {
            columnLValue = numValue
            columnLValues.push(numValue)
          }
        }
      }

      const surveyRecord: Partial<WorkroomData> = {
        name: workroomName,
        store: mapped?.store ?? storeSource ?? '',
      }

      if (row.length > poNumberIdx) {
        const rawPoNumber = row[poNumberIdx]
        if (rawPoNumber != null && rawPoNumber !== '') {
          surveyRecord.poNumber = String(rawPoNumber).trim()
        }
      }

      if (columnLValue !== null) surveyRecord.ltrScore = columnLValue

      if (row.length > columnMIdx) {
        const rawValue = row[columnMIdx]
        if (rawValue != null && rawValue !== '') {
          const numValue = Number(rawValue)
          if (!isNaN(numValue)) surveyRecord.columnM = numValue
        }
      }

      if (row.length > columnNIdx) {
        const rawValue = row[columnNIdx]
        if (rawValue != null && rawValue !== '') {
          const numValue = Number(rawValue)
          if (!isNaN(numValue)) surveyRecord.columnN = numValue
        }
      }

      if (row.length > columnPIdx) {
        const rawValue = row[columnPIdx]
        if (rawValue != null && rawValue !== '') {
          const numValue = Number(rawValue)
          if (!isNaN(numValue)) surveyRecord.columnP = numValue
        }
      }

      if (row.length > columnQIdx) {
        const rawValue = row[columnQIdx]
        if (rawValue != null && rawValue !== '') {
          const numValue = Number(rawValue)
          if (!isNaN(numValue)) surveyRecord.columnQ = numValue
        }
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
        laborCategories.push(categoryValue)
      }

      if (companyColumnIdx >= 0 && row.length > companyColumnIdx) {
        const rawCompanyValue = row[companyColumnIdx]
        if (rawCompanyValue != null && rawCompanyValue !== '') {
          const companyValue = String(rawCompanyValue).trim()
          if (companyValue) {
            surveyRecord.company = companyValue
            companyValues.push(companyValue)
          }
        }
      }

      if (installerNameColumnIdx >= 0 && row.length > installerNameColumnIdx) {
        const rawInstallerNameValue = row[installerNameColumnIdx]
        if (rawInstallerNameValue != null && rawInstallerNameValue !== '') {
          const installerNameValue = String(rawInstallerNameValue).trim()
          if (installerNameValue) {
            surveyRecord.installerName = installerNameValue
            installerNames.push(installerNameValue)
          }
        }
      }

      if (customerNameColumnIdx >= 0 && row.length > customerNameColumnIdx) {
        const rawCustomerValue = row[customerNameColumnIdx]
        if (rawCustomerValue != null && rawCustomerValue !== '') {
          const customerNameValue = String(rawCustomerValue).trim()
          if (customerNameValue) {
            surveyRecord.customerName = customerNameValue
          }
        }
      }

      if (craftScoreIdx >= 0 && row[craftScoreIdx] != null && row[craftScoreIdx] !== '') {
        const craftValue = Number(row[craftScoreIdx])
        if (!isNaN(craftValue)) {
          surveyRecord.craftScore = craftValue
          craftValues.push(craftValue)
        }
      }

      if (profScoreIdx >= 0 && row[profScoreIdx] != null && row[profScoreIdx] !== '') {
        const profValue = Number(row[profScoreIdx])
        if (!isNaN(profValue)) {
          surveyRecord.profScore = profValue
          surveyRecord.professionalScore = profValue
          profValues.push(profValue)
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

    return {
      records: surveyRecords,
      totalRows: rows.length,
      rawColumnL: columnLValues,
      rawCraft: craftValues,
      rawProf: profValues,
      rawLaborCategories: laborCategories,
      rawCompanyValues: companyValues,
      rawInstallerNames: installerNames,
    }
  }

  const handleVisualDataUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingVisual(true)
    persistVisualFileName(null)

    try {
      const visualData = await parseVisualData(file)
      persistVisualFileName(file.name)

      const existingSurveyData: WorkroomData[] = data.workrooms.filter(
        (w) => w.ltrScore != null || w.craftScore != null || w.profScore != null
      )

      const combinedData: DashboardData = { workrooms: [...existingSurveyData, ...visualData] }
      await setData(combinedData)

      showNotification(
        `Yearly Breakdown: uploaded ${visualData.length} visual records${
          existingSurveyData.length > 0 ? ` (kept ${existingSurveyData.length} survey records).` : '.'
        }`,
        'success'
      )
    } catch (error: any) {
      persistVisualFileName(null)
      showNotification(`Yearly Breakdown: visual upload failed: ${error.message}`, 'error')
    } finally {
      setIsUploadingVisual(false)
      if (visualFileInputRef.current) visualFileInputRef.current.value = ''
    }
  }

  const handleSurveyDataUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingSurvey(true)
    persistSurveyFileName(null)

    try {
      const {
        records: surveyData,
        totalRows: excelFileTotalRows,
        rawColumnL,
        rawCraft,
        rawProf,
        rawLaborCategories,
        rawCompanyValues,
        rawInstallerNames,
      } = await parseSurveyData(file)

      persistSurveyFileName(file.name)

      const existingVisualData: WorkroomData[] = data.workrooms.filter(
        (w) => w.sales != null || w.laborPO != null || w.vendorDebit != null
      )

      const surveyRecords: WorkroomData[] = surveyData.map((survey, index) => ({
        id: `yearly-survey-${Date.now()}-${index}`,
        name: survey.name || 'Unknown',
        store: survey.store || '',
        sales: 0,
        laborPO: 0,
        vendorDebit: 0,
        ...survey,
      }))

      const combinedData: DashboardData = {
        workrooms: [...existingVisualData, ...surveyRecords],
        rawColumnLValues: rawColumnL,
        rawCraftValues: rawCraft,
        rawProfValues: rawProf,
        rawLaborCategories: rawLaborCategories,
        rawCompanyValues: rawCompanyValues,
        rawInstallerNames: rawInstallerNames,
        excelFileTotalRows,
      }

      await setData(combinedData)

      showNotification(
        `Yearly Breakdown: uploaded ${surveyRecords.length} survey records${
          existingVisualData.length > 0 ? ` (kept ${existingVisualData.length} visual records).` : '.'
        }`,
        'success'
      )
    } catch (error: any) {
      persistSurveyFileName(null)
      showNotification(`Yearly Breakdown: survey upload failed: ${error.message}`, 'error')
    } finally {
      setIsUploadingSurvey(false)
      if (surveyFileInputRef.current) surveyFileInputRef.current.value = ''
    }
  }

  if (!canViewYearlyUploads) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Lock size={16} />
            <span className="text-sm font-medium">Yearly Breakdown data is admin-managed</span>
          </div>
          <p className="text-xs text-gray-500">
            Only admins can upload yearly files. This yearly dataset is isolated from the normal dashboard pages.
          </p>
          {(visualFileName || surveyFileName) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Current Yearly Files:</p>
              {visualFileName && (
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <CheckCircle2 size={12} className="text-green-600" />
                  <span className="truncate">Visual: {visualFileName}</span>
                </div>
              )}
              {surveyFileName && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={12} className="text-green-600" />
                  <span className="truncate">Survey: {surveyFileName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {canEditYearlyUploads ? (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={async () => {
              await resetData()
              await saveYearlyFileNames(year, null, null)
              setVisualFileName(null)
              setSurveyFileName(null)
              showNotification(`Yearly Breakdown: cleared ${year} data.`, 'success')
            }}
            className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            title={`Clear ${year} yearly dataset`}
          >
            <RotateCcw size={14} />
            Clear
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Read Only
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Visual Data (Yearly)
        </label>
        <p className="text-xs text-gray-500 mb-2">Sales, vendor debit, cycle time, workroom/store info</p>
        {canEditYearlyUploads ? (
          <>
            <input
              ref={visualFileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleVisualDataUpload}
              disabled={isUploadingVisual}
              className="hidden"
              id="yearly-visual-upload-input"
            />
            <label
              htmlFor="yearly-visual-upload-input"
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                isUploadingVisual ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          </>
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
            Visual yearly upload is admin-only.
          </div>
        )}
        {visualFileName && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="truncate">{visualFileName}</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Survey Data (Yearly)
        </label>
        <p className="text-xs text-gray-500 mb-2">Survey scores (LTR, Craft, Prof), labor category, installer/company</p>
        {canEditYearlyUploads ? (
          <>
            <input
              ref={surveyFileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleSurveyDataUpload}
              disabled={isUploadingSurvey}
              className="hidden"
              id="yearly-survey-upload-input"
            />
            <label
              htmlFor="yearly-survey-upload-input"
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                isUploadingSurvey ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          </>
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
            Survey yearly upload is admin-only.
          </div>
        )}
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

