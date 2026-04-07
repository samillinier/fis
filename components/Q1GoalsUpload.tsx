'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import { Upload, CheckCircle2, XCircle, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function Q1GoalsUpload() {
  const { user, isAdmin, isOwner } = useAuth()
  const { showNotification } = useNotification()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseExcelFile = async (file: File): Promise<any[]> => {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][]

    if (jsonData.length < 4) {
      throw new Error('Excel file must have at least 4 rows (header rows + data)')
    }

    // Excel file structure:
    // Row 0: Empty or title row
    // Row 1: "Provider Job Count Goals" with week numbers (1-13, Q1)
    // Row 2: Headers - Provider (col 1), District (col 2), then categories (CARPET, HSF, TILE, TOTAL) repeated for each week
    // Row 3: Sub-headers - Plan/Comp repeated for each category/week
    // Row 4+: Data rows with actual values

    const goals: any[] = []
    const dataRows = jsonData.slice(4) // Skip header rows (0-3)

    // Column structure:
    // Column 0: Provider name with suffix (e.g., "FLOOR INTERIOR SERVICES CORP_868")
    // Column 1: Provider name (e.g., "FLOOR INTERIOR SERVICES CORP")
    // Column 2: District number (e.g., 868, 1222, etc.) or "Total"
    // Column 3+: For each week (1-13), 8 columns per week:
    //   - CARPET Plan, CARPET Comp
    //   - HSF Plan, HSF Comp
    //   - TILE Plan, TILE Comp
    //   - TOTAL Plan, TOTAL Comp

    const providerIdx = 1
    const districtIdx = 2
    const firstWeekStartCol = 3
    const categories = ['CARPET', 'HSF', 'TILE', 'TOTAL']
    const columnsPerWeek = 8 // 2 columns (Plan/Comp) × 4 categories

    // Parse each data row
    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx]
      if (!row || row.length === 0) continue

      const provider = String(row[providerIdx] || '').trim()
      let district = String(row[districtIdx] || '').trim()

      // Skip total rows and empty districts
      if (!district || district === 'Total' || district.toLowerCase() === 'total') {
        continue
      }

      // Normalize district: remove "District" prefix if present, keep just the number
      district = district.replace(/^district\s*/i, '').trim()
      
      // Validate district is a number
      if (!/^\d+$/.test(district)) {
        console.warn(`Skipping row ${rowIdx + 4}: Invalid district "${district}"`)
        continue
      }

      // Parse weeks - each week has 8 columns starting from column 3
      // Week 1: columns 3-10, Week 2: columns 11-18, etc.
      for (let weekNumber = 1; weekNumber <= 13; weekNumber++) {
        const weekStartCol = firstWeekStartCol + (weekNumber - 1) * columnsPerWeek
        
        // Check if we have enough columns for this week
        if (weekStartCol + columnsPerWeek - 1 >= row.length) {
          // No more weeks available
          break
        }

        // Extract planned and comparable counts for each category
        // For each category, Plan is at even offset, Comp is at odd offset
        for (let catIdx = 0; catIdx < categories.length; catIdx++) {
          const planCol = weekStartCol + (catIdx * 2) // Plan is first column for each category
          const compCol = weekStartCol + (catIdx * 2) + 1 // Comp is second column for each category
          
          const plannedValue = row[planCol]
          const compValue = row[compCol]
          
          // Process planned count
          let plannedCount = 0
          if (plannedValue != null && plannedValue !== '' && plannedValue !== '-') {
            plannedCount = typeof plannedValue === 'number' 
              ? Math.round(plannedValue)
              : parseInt(String(plannedValue).replace(/[^\d-]/g, '')) || 0
          }
          
          // Process comparable count
          let compCount = 0
          if (compValue != null && compValue !== '' && compValue !== '-') {
            compCount = typeof compValue === 'number' 
              ? Math.round(compValue)
              : parseInt(String(compValue).replace(/[^\d-]/g, '')) || 0
          }
          
          // Save if we have at least a planned count (comp can be 0)
          if (plannedCount > 0 || compCount > 0) {
            goals.push({
              district: district,
              provider: provider || null,
              week_number: weekNumber,
              category: categories[catIdx],
              planned_count: plannedCount,
              comparable_count: compCount
            })
          }
        }
      }
    }

    if (goals.length === 0) {
      throw new Error('No valid goals found in Excel file. Please check the file format.')
    }

    return goals
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAdmin) {
      showNotification('Only admin users can upload goals', 'error')
      return
    }

    setIsUploading(true)
    try {
      const goals = await parseExcelFile(file)
      
      if (goals.length === 0) {
        showNotification('No goals found in the Excel file', 'error')
        return
      }

      // Upload to API
      const authHeader = user?.email || ''
      const response = await fetch('/api/lowes-q1-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authHeader}`,
        },
        body: JSON.stringify({ goals }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to upload goals'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setUploadedFileName(file.name)
      showNotification(
        `Successfully uploaded ${result.count} goal records`,
        'success'
      )
    } catch (error: any) {
      console.error('Error uploading goals:', error)
      showNotification(
        error.message || 'Failed to upload goals file',
        'error'
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!isAdmin && !isOwner) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Q1 2026 Goals</h3>
        </div>
        {uploadedFileName && (
          <CheckCircle2 size={16} className="text-green-600" />
        )}
      </div>
      
      <div className="space-y-2">
        {isAdmin ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="q1-goals-upload"
            />
            <label
              htmlFor="q1-goals-upload"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] cursor-pointer transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>{uploadedFileName ? 'Re-upload Goals' : 'Upload Goals File'}</span>
                </>
              )}
            </label>
          </>
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
            Read Only
          </div>
        )}
        {uploadedFileName && (
          <p className="text-xs text-gray-600 text-center">
            Last uploaded: {uploadedFileName}
          </p>
        )}
        <p className="text-xs text-gray-500 text-center">
          Upload the "Q1 2026 Goals FIS.xlsx" file
        </p>
      </div>
    </div>
  )
}
