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
          if (jobsWorkCycleTimeIdx >= 0 && row[jobsWorkCycleTimeIdx] != null && row[jobsWorkCycleTimeIdx] !== '') {
            const jobsWorkCycleTimeValue = Number(row[jobsWorkCycleTimeIdx])
            if (!isNaN(jobsWorkCycleTimeValue)) {
              workroom.jobsWorkCycleTime = jobsWorkCycleTimeValue
            }
          }
          if (rescheduleRateIdx >= 0 && row[rescheduleRateIdx] != null && row[rescheduleRateIdx] !== '') {
            const rescheduleRateValue = Number(row[rescheduleRateIdx])
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
        // Use column AD (index 29) for Reschedule Rate data in CSV files
        // Column AD is the 30th column (A=0, B=1, ..., AD=29)
        const rescheduleRateIdx = headers.length > 29 ? 29 : -1
        // Use column AQ (index 42) for Get it Right data in CSV files
        // Column AQ is the 43rd column (A=0, B=1, ..., AQ=42)
        const getItRightIdx = headers.length > 42 ? 42 : -1
        // Use column S (index 18) for Details Cycle Time data in CSV files
        // Column S is the 19th column (A=0, B=1, ..., S=18)
        const detailsCycleTimeIdx = headers.length > 18 ? 18 : -1
        
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
          if (getItRightIdx >= 0 && values[getItRightIdx] != null && values[getItRightIdx] !== '') {
            const getItRightValue = Number(values[getItRightIdx])
            if (!isNaN(getItRightValue)) {
              workroom.getItRight = getItRightValue
            }
          }
          if (detailsCycleTimeIdx >= 0 && values[detailsCycleTimeIdx] != null && values[detailsCycleTimeIdx] !== '') {
            const detailsCycleTimeValue = Number(values[detailsCycleTimeIdx])
            if (!isNaN(detailsCycleTimeValue)) {
              workroom.detailsCycleTime = detailsCycleTimeValue
            }
          }

          // Add survey data if available
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


