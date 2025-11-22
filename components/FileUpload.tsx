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
          (h) => typeof h === 'string' && h.includes('location #')
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
        const cycleTimeIdx = headers.findIndex(
          (h) => typeof h === 'string' && h.includes('cycle time')
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

          const workroom: any = {
            id,
            name: mapped?.workroom || String(nameSource || '').trim(),
            store: mapped?.store ?? storeSource ?? '',
            sales: salesValue,
            laborPO: laborPOIdx >= 0 ? Number(row[laborPOIdx] || 0) : 0,
            vendorDebit: vendorDebitIdx >= 0 ? Number(row[vendorDebitIdx] || 0) : 0,
          }

          if (cycleTimeIdx >= 0 && row[cycleTimeIdx] != null && row[cycleTimeIdx] !== '') {
            workroom.cycleTime = Number(row[cycleTimeIdx]) || 0
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
          (h) => typeof h === 'string' && (h.includes('store') || h.includes('location'))
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
        const cycleTimeIdx = headers.findIndex(
          (h) => typeof h === 'string' && (h.includes('cycle time') || h.includes('cycle'))
        )

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim())

          const rawName =
            workroomIdx >= 0 ? values[workroomIdx] || `Workroom ${i}` : values[0] || `Workroom ${i}`
          const rawStore = storeIdx >= 0 ? values[storeIdx] || '' : ''

          const storeNumber = Number(rawStore || rawName)
          const mapped = workroomStoreData.find((r) => r.store === storeNumber)
          const workroom: any = {
            id: `workroom-${i}-${Date.now()}`,
            name: mapped?.workroom || rawName,
            store: mapped?.store ?? rawStore,
            sales: 0,
            laborPO: laborPOIdx >= 0 ? Number(values[laborPOIdx] || 0) : 0,
            vendorDebit: vendorDebitIdx >= 0 ? Number(values[vendorDebitIdx] || 0) : 0,
          }

          if (cycleTimeIdx >= 0 && values[cycleTimeIdx]) {
            workroom.cycleTime = Number(values[cycleTimeIdx]) || 0
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


