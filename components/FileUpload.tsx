'use client'

import { useState, useRef } from 'react'
import { useData } from '@/context/DataContext'
import { useNotification } from '@/components/NotificationContext'
import { Upload } from 'lucide-react'
import type { DashboardData, WorkroomData } from '@/context/DataContext'
import * as XLSX from 'xlsx'
import { workroomStoreData } from '@/data/workroomStoreData'

export default function FileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const { setData } = useData()
  const { showNotification } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const fileName = file.name.toLowerCase()
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
      const isCSV = fileName.endsWith('.csv')
      const isJSON = fileName.endsWith('.json')

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        if (jsonData.length < 2) {
          throw new Error('Excel file must have a header row and at least one data row')
        }

        const headers = (jsonData[0] as any[]).map((h: any) =>
          String(h ?? '').trim().toLowerCase()
        )

        // Map Lowe's T1/T2 scorecard headers (defensively handle empty cells)
        const workroomIdx = headers.findIndex(
          (h) => typeof h === 'string' && h.includes('workroom')
        )
        const storeIdx = headers.findIndex(
          (h) => typeof h === 'string' && h.includes('store') && !h.includes('store name')
        )
        let locationIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('location #') || lowerH === 'location'
          }
        )
        // Fallback: in the Lowe's T1/T2 file, Location # is the 5th column (index 4)
        if (locationIdx === -1 && headers.length > 4) {
          locationIdx = 4
        }

        const salesIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return (
              lowerH.includes('sales') || 
              lowerH.includes('revenue') || 
              lowerH.includes('net sales') ||
              lowerH.includes('total sales') ||
              lowerH.includes('gross sales') ||
              lowerH.includes('amount') ||
              lowerH.includes('dollar') ||
              lowerH.includes('$') ||
              lowerH === 'sales $' ||
              lowerH === 'revenue $'
            )
          }
        )
        const laborPOIdx = headers.findIndex(
          (h) =>
            typeof h === 'string' &&
            (h.includes('labor po') || h === 'labor po $' || h.includes('labor po $'))
        )
        const vendorDebitIdx = headers.findIndex(
          (h) =>
            typeof h === 'string' &&
            (h.includes('vendor debits') || h.includes('vendor debit'))
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
        // U=20, V=21, W=22, X=23 (Jobs Work Cycle Time), Y=24 (Total Jobs)
        // Column S (index 18) for Details Cycle Time
        const rtsSchedDetailsIdx = headers.length > 20 ? 20 : -1
        const schedStartDetailsIdx = headers.length > 21 ? 21 : -1
        const startDocsSubDetailsIdx = headers.length > 22 ? 22 : -1
        const totalDetailCycleTimeIdx = headers.length > 23 ? 23 : -1 // Column X (also used for totalDetailCycleTime if needed)
        const rtsSchedJobsIdx = -1
        const schedStartJobsIdx = -1
        const startCompleteJobsIdx = -1
        const jobsWorkCycleTimeIdx = headers.length > 23 ? 23 : -1 // Column X - Job Cycle Count for heatmap
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
        // Survey-related columns
        const surveyDateIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('survey date') || lowerH.includes('survey date')
          }
        )
        const surveyCommentIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('survey comment') || lowerH.includes('comment')
          }
        )
        const laborCategoryIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('labor category') || lowerH.includes('labour category') || lowerH.includes('category')
          }
        )
        
        // Survey score columns
        const reliableHomeImprovementScoreIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('reliable home improvement score') || lowerH.includes('reliable home improvement')
          }
        )
        const timeTakenToCompleteIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('time taken to complete') || lowerH.includes('time to complete this project') || lowerH.includes('project completion time')
          }
        )
        const projectValueScoreIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('project value score') || lowerH.includes('project value')
          }
        )
        const installerKnowledgeScoreIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('installer knowledge score') || lowerH.includes('installer knowledge')
          }
        )
        
        // Additional survey score columns
        const ltrScoreIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('ltr score') || lowerH === 'ltr score'
          }
        )
        const craftScoreIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('craft score') || lowerH === 'craft score'
          }
        )
        const profScoreIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('prof score') || lowerH.includes('professional score') || lowerH === 'prof score'
          }
        )

        const workrooms: WorkroomData[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[]
          if (!row || row.length === 0) continue

          const id = `workroom-${i}-${Date.now()}`

          const nameSource =
            workroomIdx >= 0
              ? row[workroomIdx]
              : locationIdx >= 0
              ? row[locationIdx]
              : `Workroom ${i}`

          const storeSource =
            storeIdx >= 0
              ? row[storeIdx]
              : locationIdx >= 0
              ? row[locationIdx]
              : ''

          // Map store number to saved workroom name when possible
          const storeNumber = Number(storeSource || nameSource)
          const mapped = workroomStoreData.find((r) => r.store === storeNumber)

          // Parse sales value - handle various formats (currency, numbers, strings)
          let salesValue = 0
          if (salesIdx >= 0 && row[salesIdx] != null && row[salesIdx] !== '') {
            const salesRaw = row[salesIdx]
            if (typeof salesRaw === 'number') {
              salesValue = salesRaw
            } else if (typeof salesRaw === 'string') {
              // Remove currency symbols, commas, and whitespace, then parse
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

          const workroom: any = {
            id,
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

          // Read column J (index 9) for PO Number
          if (row.length > 9 && row[9] != null && row[9] !== '') {
            workroom.poNumber = String(row[9]).trim()
          }

          // Add survey data if available
          if (surveyDateIdx >= 0 && row[surveyDateIdx] != null && row[surveyDateIdx] !== '') {
            workroom.surveyDate = row[surveyDateIdx]
          }
          if (surveyCommentIdx >= 0 && row[surveyCommentIdx] != null && row[surveyCommentIdx] !== '') {
            workroom.surveyComment = String(row[surveyCommentIdx]).trim()
          }
          if (laborCategoryIdx >= 0 && row[laborCategoryIdx] != null && row[laborCategoryIdx] !== '') {
            const categoryValue = String(row[laborCategoryIdx]).trim()
            workroom.laborCategory = categoryValue
            workroom.category = categoryValue // Also set category for backward compatibility
          }

          // Add survey scores if available
          if (reliableHomeImprovementScoreIdx >= 0 && row[reliableHomeImprovementScoreIdx] != null && row[reliableHomeImprovementScoreIdx] !== '') {
            const score = Number(row[reliableHomeImprovementScoreIdx]) || null
            workroom.reliableHomeImprovementScore = score
            workroom.reliableHomeImprovement = score
          }
          if (timeTakenToCompleteIdx >= 0 && row[timeTakenToCompleteIdx] != null && row[timeTakenToCompleteIdx] !== '') {
            const time = Number(row[timeTakenToCompleteIdx]) || null
            workroom.timeTakenToComplete = time
            workroom.timeToComplete = time
          }
          if (projectValueScoreIdx >= 0 && row[projectValueScoreIdx] != null && row[projectValueScoreIdx] !== '') {
            const score = Number(row[projectValueScoreIdx]) || null
            workroom.projectValueScore = score
            workroom.projectValue = score
          }
          if (installerKnowledgeScoreIdx >= 0 && row[installerKnowledgeScoreIdx] != null && row[installerKnowledgeScoreIdx] !== '') {
            const score = Number(row[installerKnowledgeScoreIdx]) || null
            workroom.installerKnowledgeScore = score
            workroom.installerKnowledge = score
          }
          
          // Add additional survey scores if available
          if (ltrScoreIdx >= 0 && row[ltrScoreIdx] != null && row[ltrScoreIdx] !== '') {
            workroom.ltrScore = Number(row[ltrScoreIdx]) || null
          }
          if (craftScoreIdx >= 0 && row[craftScoreIdx] != null && row[craftScoreIdx] !== '') {
            workroom.craftScore = Number(row[craftScoreIdx]) || null
          }
          if (profScoreIdx >= 0 && row[profScoreIdx] != null && row[profScoreIdx] !== '') {
            const score = Number(row[profScoreIdx]) || null
            workroom.profScore = score
            workroom.professionalScore = score
          }

          workrooms.push(workroom as WorkroomData)
        }

        setData({ workrooms })
        showNotification(`Successfully uploaded ${workrooms.length} records from Excel file!`, 'success')
        return
      }

      if (isJSON) {
        const text = await file.text()
        const jsonData = JSON.parse(text)
        if (jsonData.workrooms && Array.isArray(jsonData.workrooms)) {
          setData(jsonData as DashboardData)
          showNotification(`Successfully uploaded ${jsonData.workrooms.length} records from JSON file!`, 'success')
          return
        }
      }

      if (isCSV) {
        const text = await file.text()
        const lines = text.split('\n').filter((line) => line.trim())
        if (lines.length < 2) {
          throw new Error('CSV file must have a header row and at least one data row')
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase() || '')
        const workrooms: WorkroomData[] = []

        const workroomIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('workroom') || h.includes('name'))
        )
        let storeIdx = headers.findIndex(
          (h) => {
            if (typeof h !== 'string') return false
            const lowerH = h.toLowerCase().trim()
            return lowerH.includes('store') || lowerH.includes('location #') || lowerH === 'location'
          }
        )
        if (storeIdx === -1 && headers.length > 4) {
          storeIdx = 4
        }
        const laborPOIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('labor') || h.includes('labor po'))
        )
        const vendorDebitIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('vendor') || h.includes('debit'))
        )
        // Use column AC (index 28) for Cycle Time data in CSV files
        // Column AC is the 29th column (A=0, B=1, ..., AC=28)
        const cycleTimeIdx = headers.length > 28 ? 28 : headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('cycle time') || h.includes('cycle'))
        )
        // Use column T (index 19) for Completed data in CSV files
        // Column T is the 20th column (A=0, B=1, ..., T=19)
        const completedIdx = headers.length > 19 ? 19 : -1
        // Use column X (index 23) for Jobs Work Cycle Time data in CSV files
        // Column X is the 24th column (A=0, B=1, ..., X=23)
        const jobsWorkCycleTimeIdx = headers.length > 23 ? 23 : -1
        // Reschedule Rate breakdown (columns AD–AH) for CSV files
        // AD=29, AE=30, AF=31, AG=32, AH=33 (0-based)
        const rescheduleRateIdx = headers.length > 29 ? 29 : -1 // Column AD - Reschedule Rate
        const rescheduleRateLYIdx = headers.length > 30 ? 30 : -1 // Column AE - Reschedule Rate Last Year
        const detailRateIdx = headers.length > 31 ? 31 : -1 // Column AF - Detail Reschedule Rate
        const jobRateIdx = headers.length > 32 ? 32 : -1 // Column AG - Job Reschedule Rate
        const workOrderRateIdx = headers.length > 33 ? 33 : -1 // Column AH - Work Order Reschedule Rate
        // Get it Right breakdown (columns AQ–AR) for CSV files
        // AQ=42, AR=43 (0-based)
        const getItRightIdx = headers.length > 42 ? 42 : -1 // Column AQ - Get it Right
        const getItRightLYIdx = headers.length > 43 ? 43 : -1 // Column AR - Get it Right Last Year
        // Details Cycle Time breakdown (columns P–T) for CSV files
        // P=15, Q=16, R=17, S=18 (Total Provider Cycle Time), T=19 (Completed)
        const detailsRtsSchedIdx = headers.length > 15 ? 15 : -1 // Column P - RTS - Sch (Details)
        const detailsSchedStartIdx = headers.length > 16 ? 16 : -1 // Column Q - Sch - Start (Details)
        const detailsStartDocsSubIdx = headers.length > 17 ? 17 : -1 // Column R - Start - Docs Sub (Details)
        const detailsCycleTimeIdx = headers.length > 18 ? 18 : -1 // Column S - Details Cycle Time (Total Provider Cycle Time)
        // completedIdx is Column T (index 19) - Completed
        // Work Order Cycle Time breakdown (columns Z–AC) for CSV files
        // Z=25, AA=26, AB=27, AC=28 (0-based)
        const workOrderStage1Idx = headers.length > 25 ? 25 : -1 // Column Z
        const workOrderStage2Idx = headers.length > 26 ? 26 : -1 // Column AA
        const workOrderStage3Idx = headers.length > 27 ? 27 : -1 // Column AB
        const totalWorkOrderCycleTimeIdx = headers.length > 28 ? 28 : -1 // Column AC
        
        // Survey-related columns for CSV
        const surveyDateIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('survey date'))
        )
        const surveyCommentIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('survey comment') || h.includes('comment'))
        )
        const laborCategoryIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('labor category') || h.includes('labour category') || h === 'category')
        )
        
        // Survey score columns for CSV
        const reliableHomeImprovementScoreIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('reliable home improvement score') || h.includes('reliable home improvement'))
        )
        const timeTakenToCompleteIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('time taken to complete') || h.includes('time to complete this project') || h.includes('project completion time'))
        )
        const projectValueScoreIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('project value score') || h.includes('project value'))
        )
        const installerKnowledgeScoreIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('installer knowledge score') || h.includes('installer knowledge'))
        )
        
        // Additional survey score columns for CSV
        const ltrScoreIdx = headers.findIndex(
          (h) => typeof h === 'string' && h.includes('ltr score')
        )
        const craftScoreIdx = headers.findIndex(
          (h) => typeof h === 'string' && h.includes('craft score')
        )
        const profScoreIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('prof score') || h.includes('professional score'))
        )

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim())

          const rawName =
            workroomIdx >= 0 ? values[workroomIdx] || `Workroom ${i}` : values[0] || `Workroom ${i}`
          const rawStore = storeIdx >= 0 ? values[storeIdx] || '' : ''

          const storeNumber = Number(rawStore || rawName)
          const mapped = workroomStoreData.find((r) => r.store === storeNumber)
          let workroomName = mapped?.workroom || rawName
          // Normalize workroom names
          if (workroomName === 'Panama Cit') {
            workroomName = 'Panama City'
          }

          const workroom: any = {
            id: `workroom-${i}-${Date.now()}`,
            name: workroomName,
            store: mapped?.store ?? rawStore,
            sales: 0,
            laborPO: laborPOIdx >= 0 ? Number(values[laborPOIdx] || 0) : 0,
            vendorDebit: vendorDebitIdx >= 0 ? Number(values[vendorDebitIdx] || 0) : 0,
          }

          if (cycleTimeIdx >= 0 && values[cycleTimeIdx]) {
            workroom.cycleTime = Number(values[cycleTimeIdx]) || 0
          }
          if (completedIdx >= 0 && values[completedIdx] != null && values[completedIdx] !== '') {
            const completedValue = Number(values[completedIdx])
            // Store the value even if it's 0.0 (we want to sum all values including zeros)
            if (!isNaN(completedValue)) {
              workroom.completed = completedValue
            }
          }
          // Details Cycle Time breakdown (columns P–S) for CSV
          if (detailsRtsSchedIdx >= 0 && values[detailsRtsSchedIdx] != null && values[detailsRtsSchedIdx] !== '') {
            const val = Number(values[detailsRtsSchedIdx])
            if (!isNaN(val)) workroom.detailsRtsSched = val
          }
          if (detailsSchedStartIdx >= 0 && values[detailsSchedStartIdx] != null && values[detailsSchedStartIdx] !== '') {
            const val = Number(values[detailsSchedStartIdx])
            if (!isNaN(val)) workroom.detailsSchedStart = val
          }
          if (detailsStartDocsSubIdx >= 0 && values[detailsStartDocsSubIdx] != null && values[detailsStartDocsSubIdx] !== '') {
            const val = Number(values[detailsStartDocsSubIdx])
            if (!isNaN(val)) workroom.detailsStartDocsSub = val
          }
          if (detailsCycleTimeIdx >= 0 && values[detailsCycleTimeIdx] != null && values[detailsCycleTimeIdx] !== '') {
            const val = Number(values[detailsCycleTimeIdx])
            if (!isNaN(val)) workroom.detailsCycleTime = val
          }
          if (jobsWorkCycleTimeIdx >= 0 && values[jobsWorkCycleTimeIdx] != null && values[jobsWorkCycleTimeIdx] !== '') {
            const jobsWorkCycleTimeValue = Number(values[jobsWorkCycleTimeIdx])
            if (!isNaN(jobsWorkCycleTimeValue)) {
              workroom.jobsWorkCycleTime = jobsWorkCycleTimeValue
            }
          }
          if (rescheduleRateIdx >= 0 && values[rescheduleRateIdx] != null && values[rescheduleRateIdx] !== '') {
            const rescheduleRateValue = Number(values[rescheduleRateIdx])
            if (!isNaN(rescheduleRateValue)) {
              workroom.rescheduleRate = rescheduleRateValue
            }
          }
          if (rescheduleRateLYIdx >= 0 && values[rescheduleRateLYIdx] != null && values[rescheduleRateLYIdx] !== '') {
            const val = Number(values[rescheduleRateLYIdx])
            if (!isNaN(val)) workroom.rescheduleRateLY = val
          }
          if (detailRateIdx >= 0 && values[detailRateIdx] != null && values[detailRateIdx] !== '') {
            const val = Number(values[detailRateIdx])
            if (!isNaN(val)) workroom.detailRate = val
          }
          if (jobRateIdx >= 0 && values[jobRateIdx] != null && values[jobRateIdx] !== '') {
            const val = Number(values[jobRateIdx])
            if (!isNaN(val)) workroom.jobRate = val
          }
          if (workOrderRateIdx >= 0 && values[workOrderRateIdx] != null && values[workOrderRateIdx] !== '') {
            const val = Number(values[workOrderRateIdx])
            if (!isNaN(val)) workroom.workOrderRate = val
          }
          if (getItRightIdx >= 0 && values[getItRightIdx] != null && values[getItRightIdx] !== '') {
            const getItRightValue = Number(values[getItRightIdx])
            if (!isNaN(getItRightValue)) {
              workroom.getItRight = getItRightValue
            }
          }
          if (getItRightLYIdx >= 0 && values[getItRightLYIdx] != null && values[getItRightLYIdx] !== '') {
            const val = Number(values[getItRightLYIdx])
            if (!isNaN(val)) workroom.getItRightLY = val
          }
          if (detailsCycleTimeIdx >= 0 && values[detailsCycleTimeIdx] != null && values[detailsCycleTimeIdx] !== '') {
            const detailsCycleTimeValue = Number(values[detailsCycleTimeIdx])
            if (!isNaN(detailsCycleTimeValue)) {
              workroom.detailsCycleTime = detailsCycleTimeValue
            }
          }
          if (workOrderStage1Idx >= 0 && values[workOrderStage1Idx] != null && values[workOrderStage1Idx] !== '') {
            const val = Number(values[workOrderStage1Idx])
            if (!isNaN(val)) workroom.workOrderStage1 = val
          }
          if (workOrderStage2Idx >= 0 && values[workOrderStage2Idx] != null && values[workOrderStage2Idx] !== '') {
            const val = Number(values[workOrderStage2Idx])
            if (!isNaN(val)) workroom.workOrderStage2 = val
          }
          if (workOrderStage3Idx >= 0 && values[workOrderStage3Idx] != null && values[workOrderStage3Idx] !== '') {
            const val = Number(values[workOrderStage3Idx])
            if (!isNaN(val)) workroom.workOrderStage3 = val
          }
          if (totalWorkOrderCycleTimeIdx >= 0 && values[totalWorkOrderCycleTimeIdx] != null && values[totalWorkOrderCycleTimeIdx] !== '') {
            const val = Number(values[totalWorkOrderCycleTimeIdx])
            if (!isNaN(val)) workroom.totalWorkOrderCycleTime = val
          }

          // Add survey data if available
          // Read column J (index 9) for PO Number in CSV
          if (values.length > 9 && values[9] != null && values[9] !== '') {
            workroom.poNumber = String(values[9]).trim()
          }

          if (surveyDateIdx >= 0 && values[surveyDateIdx]) {
            workroom.surveyDate = values[surveyDateIdx].trim()
          }
          if (surveyCommentIdx >= 0 && values[surveyCommentIdx]) {
            workroom.surveyComment = values[surveyCommentIdx].trim()
          }
          if (laborCategoryIdx >= 0 && values[laborCategoryIdx]) {
            const categoryValue = values[laborCategoryIdx].trim()
            workroom.laborCategory = categoryValue
            workroom.category = categoryValue // Also set category for backward compatibility
          }

          // Add survey scores if available
          if (reliableHomeImprovementScoreIdx >= 0 && values[reliableHomeImprovementScoreIdx]) {
            const score = Number(values[reliableHomeImprovementScoreIdx]) || null
            workroom.reliableHomeImprovementScore = score
            workroom.reliableHomeImprovement = score
          }
          if (timeTakenToCompleteIdx >= 0 && values[timeTakenToCompleteIdx]) {
            const time = Number(values[timeTakenToCompleteIdx]) || null
            workroom.timeTakenToComplete = time
            workroom.timeToComplete = time
          }
          if (projectValueScoreIdx >= 0 && values[projectValueScoreIdx]) {
            const score = Number(values[projectValueScoreIdx]) || null
            workroom.projectValueScore = score
            workroom.projectValue = score
          }
          if (installerKnowledgeScoreIdx >= 0 && values[installerKnowledgeScoreIdx]) {
            const score = Number(values[installerKnowledgeScoreIdx]) || null
            workroom.installerKnowledgeScore = score
            workroom.installerKnowledge = score
          }
          
          // Add additional survey scores if available
          if (ltrScoreIdx >= 0 && values[ltrScoreIdx]) {
            workroom.ltrScore = Number(values[ltrScoreIdx]) || null
          }
          if (craftScoreIdx >= 0 && values[craftScoreIdx]) {
            workroom.craftScore = Number(values[craftScoreIdx]) || null
          }
          if (profScoreIdx >= 0 && values[profScoreIdx]) {
            const score = Number(values[profScoreIdx]) || null
            workroom.profScore = score
            workroom.professionalScore = score
          }

          workrooms.push(workroom as WorkroomData)
        }

        setData({ workrooms })
        showNotification(`Successfully uploaded ${workrooms.length} records from CSV file!`, 'success')
        return
      }

      throw new Error('Unsupported file format. Please use .xlsx, .xls, .csv, or .json')
    } catch (error) {
      console.error('Error uploading file:', error)
      showNotification(
        `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
        6000
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        onChange={handleFileUpload}
        disabled={isUploading}
        className="absolute opacity-0 w-0 h-0 overflow-hidden"
        id="file-upload-input"
      />
      <label
        htmlFor="file-upload-input"
        className="cursor-pointer inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
      >
        <Upload size={18} />
        <span className="text-sm font-medium whitespace-nowrap">
          {isUploading ? 'Uploading...' : 'Upload File'}
        </span>
      </label>
    </div>
  )
}


