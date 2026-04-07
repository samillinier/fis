'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import { Upload, CheckCircle2, XCircle, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import { getWorkroomsForDistrict } from '@/data/districtToWorkroom'
import { storeLocations } from '@/data/storeLocations'

export default function StoreWeeklyForecastUpload() {
  const { user, isAdmin, isOwner } = useAuth()
  const { showNotification } = useNotification()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseExcelFile = async (file: File): Promise<any[]> => {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Use the Store_Weekly_Wide sheet (or first sheet if not found)
    const sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('store') && name.toLowerCase().includes('wide')
    ) || workbook.SheetNames[0]
    
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][]

    if (jsonData.length < 2) {
      throw new Error('Excel file must have a header row and at least one data row')
    }

    // Excel file structure (Store_Weekly_Wide):
    // Row 0: Headers - District, Store, District_Q1_Jobs, Pct_of_District, Store_Q1_Job_Forecast, Wk1, Wk2, ..., Wk13
    // Row 1+: Data rows

    const headers = (jsonData[0] as any[]).map((h: any) =>
      String(h ?? '').trim()
    )

    const districtIdx = headers.findIndex(h => 
      h.toLowerCase().includes('district') && !h.toLowerCase().includes('q1')
    )
    const storeIdx = headers.findIndex(h => 
      h.toLowerCase().includes('store') && !h.toLowerCase().includes('q1') && !h.toLowerCase().includes('forecast')
    )
    const districtQ1JobsIdx = headers.findIndex(h => 
      h.toLowerCase().includes('district_q1_jobs') || h.toLowerCase().includes('district q1 jobs')
    )
    const pctOfDistrictIdx = headers.findIndex(h => 
      h.toLowerCase().includes('pct') || h.toLowerCase().includes('percent') || h.toLowerCase().includes('%')
    )
    const storeQ1ForecastIdx = headers.findIndex(h => 
      h.toLowerCase().includes('store_q1') || h.toLowerCase().includes('store q1')
    )

    if (districtIdx === -1 || storeIdx === -1) {
      throw new Error('Could not find District or Store columns in Excel file')
    }

    const forecasts: any[] = []
    const dataRows = jsonData.slice(1) // Skip header row

    // Find week columns (Wk1, Wk2, ..., Wk13)
    const weekColumns: { week: number; colIdx: number }[] = []
    for (let week = 1; week <= 13; week++) {
      const weekColIdx = headers.findIndex(h => {
        const hLower = h.toLowerCase()
        return hLower === `wk${week}` || hLower === `week ${week}` || hLower === `week${week}`
      })
      if (weekColIdx !== -1) {
        weekColumns.push({ week, colIdx: weekColIdx })
      }
    }

    if (weekColumns.length === 0) {
      throw new Error('Could not find week columns (Wk1-Wk13) in Excel file')
    }

    // Parse each data row
    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx]
      if (!row || row.length === 0) continue

      const district = String(row[districtIdx] || '').trim()
      const store = String(row[storeIdx] || '').trim()
      
      if (!district || !store) continue

      const districtQ1Jobs = districtQ1JobsIdx >= 0 ? parseInt(String(row[districtQ1JobsIdx] || 0)) : 0
      const pctOfDistrict = pctOfDistrictIdx >= 0 ? parseFloat(String(row[pctOfDistrictIdx] || 0)) : 0
      const storeQ1Forecast = storeQ1ForecastIdx >= 0 ? parseInt(String(row[storeQ1ForecastIdx] || 0)) : 0

      // Get workroom for this specific store using storeLocations data
      // First try to find exact match by store number (as string)
      let storeLocation = storeLocations.find(s => s.number === store)
      
      // If not found, try parsing the store number
      if (!storeLocation) {
        const storeNum = parseInt(store)
        if (!isNaN(storeNum)) {
          storeLocation = storeLocations.find(s => parseInt(s.number) === storeNum)
        }
      }
      
      let workroom: string | null = null
      
      if (storeLocation && storeLocation.workroom) {
        // Normalize workroom name to match districtToWorkroom format (uppercase)
        // Capitalize first letter of each word to match format (e.g., "Gainesville" -> "GAINESVILLE")
        workroom = storeLocation.workroom.toUpperCase()
      } else {
        // Fallback: use first workroom for district if store location not found
        const workrooms = getWorkroomsForDistrict(district)
        workroom = workrooms.length > 0 ? workrooms[0] : null
      }

      // Parse weekly data
      for (const { week, colIdx } of weekColumns) {
        const jobsNeeded = parseInt(String(row[colIdx] || 0)) || 0

        forecasts.push({
          district,
          store,
          district_q1_jobs: districtQ1Jobs,
          pct_of_district: pctOfDistrict,
          store_q1_job_forecast: storeQ1Forecast,
          week_number: week,
          jobs_needed: jobsNeeded,
          workroom,
        })
      }
    }

    if (forecasts.length === 0) {
      throw new Error('No valid forecast data found in Excel file. Please check the file format.')
    }

    return forecasts
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAdmin) {
      showNotification('Only admin users can upload forecasts', 'error')
      return
    }

    setIsUploading(true)
    try {
      const forecasts = await parseExcelFile(file)
      
      if (forecasts.length === 0) {
        showNotification('No forecasts found in the Excel file', 'error')
        return
      }

      // Upload to API
      const authHeader = user?.email || ''
      const response = await fetch('/api/lowes-store-weekly-forecasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authHeader}`,
        },
        body: JSON.stringify({ forecasts }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to upload forecasts'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setUploadedFileName(file.name)
      showNotification(
        `Successfully uploaded ${result.count} store weekly forecast records`,
        'success'
      )
      
      // Trigger page refresh to show new data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error('Error uploading forecasts:', error)
      showNotification(
        error.message || 'Failed to upload forecasts file',
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Store Weekly Forecast Upload
          </h3>
        </div>
        {uploadedFileName && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{uploadedFileName}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Upload the "Q1_Weekly_Store_Job_Forecast" Excel file to import store-level weekly job forecasts with district alignment and workroom mapping.
      </p>

      <div className="flex items-center gap-4">
        {isAdmin ? (
          <label className="flex items-center gap-2 px-4 py-2 bg-[#89ac44] text-white rounded-md cursor-pointer hover:bg-[#6d8a35] transition-colors">
            <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Read Only
          </div>
        )}
      </div>
    </div>
  )
}
