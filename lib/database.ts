// Data Storage - Vercel Postgres with localStorage Fallback
// Uses API routes (connected to Vercel Postgres) with localStorage fallback

import type { DashboardData, WorkroomData } from '@/context/DataContext'
import type { PaymentData } from '@/context/PaymentContext'
import {
  type ScheduledJobData,
  type ScheduledJobSourceBundle,
  type ScheduledJobSourceType,
} from '@/context/ScheduledJobContext'
import {
  loadScheduledJobDataLocal,
  saveScheduledJobDataLocal,
  saveScheduledJobSourceLocal,
  type ScheduledJobStorageMode,
} from '@/lib/scheduledJobStorage'
import type { HistoricalDataEntry } from '@/data/historicalDataStorage'
import { recordActivity } from '@/lib/activityLog'

// Get user ID from auth
function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('fis-user')
  if (!userStr) return null
  try {
    const user = JSON.parse(userStr)
    return user.email || null
  } catch {
    return null
  }
}

// Get auth header for API requests
function getAuthHeader(): string | null {
  const userId = getUserId()
  return userId ? `Bearer ${userId}` : null
}

// Main Dashboard Data - Try API first, fallback to localStorage
// Fetch data from Supabase (visual_data + survey_data tables)
export async function fetchDashboardData(): Promise<DashboardData> {
  const authHeader = getAuthHeader()
  
  // If no auth, return empty data
  if (!authHeader) {
    console.log('⚠️ [fetchDashboardData] No user logged in, returning empty data')
    return { workrooms: [] }
  }

  const userEmail = authHeader.replace('Bearer ', '')
  console.log('📡 [fetchDashboardData] Fetching data for user:', userEmail)
  console.log('📡 [fetchDashboardData] Auth header exists:', !!authHeader)

  try {
    const response = await fetch('/api/data', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    console.log('📡 [fetchDashboardData] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [fetchDashboardData] Failed to fetch:', response.status, errorText)
      return { workrooms: [] }
    }

    const data = await response.json()
    console.log('✅ [fetchDashboardData] Fetched', data.workrooms?.length || 0, 'workrooms from Supabase')
    
    if (data.workrooms && data.workrooms.length > 0) {
      console.log('📊 [fetchDashboardData] First workroom:', {
        id: data.workrooms[0].id,
        name: data.workrooms[0].name,
        hasSales: data.workrooms[0].sales != null,
        hasLtrScore: data.workrooms[0].ltrScore != null
      })
    }
    
    // Return data from Supabase (or empty if none)
    return {
      workrooms: data.workrooms || [],
      ...(data.rawColumnLValues && { rawColumnLValues: data.rawColumnLValues }),
      ...(data.rawCraftValues && { rawCraftValues: data.rawCraftValues }),
      ...(data.rawProfValues && { rawProfValues: data.rawProfValues }),
      ...(data.rawLaborCategories && { rawLaborCategories: data.rawLaborCategories }),
      ...(data.rawCompanyValues && { rawCompanyValues: data.rawCompanyValues }),
      ...(data.rawInstallerNames && { rawInstallerNames: data.rawInstallerNames }),
      ...(data.excelFileTotalRows && { excelFileTotalRows: data.excelFileTotalRows }),
    } as DashboardData
  } catch (error: any) {
    console.error('❌ [fetchDashboardData] Error:', error)
    return { workrooms: [] }
  }
}

// ============================================================================
// Yearly Breakdown Data (Supabase via API routes)
// ============================================================================
export async function fetchYearlyDashboardData(year: number): Promise<DashboardData> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    return { workrooms: [] }
  }

  try {
    const response = await fetch(`/api/yearly-data?year=${encodeURIComponent(String(year))}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [fetchYearlyDashboardData] Failed to fetch:', response.status, errorText)
      return { workrooms: [] }
    }

    const data = await response.json()
    return {
      workrooms: data.workrooms || [],
      ...(data.rawColumnLValues && { rawColumnLValues: data.rawColumnLValues }),
      ...(data.rawCraftValues && { rawCraftValues: data.rawCraftValues }),
      ...(data.rawProfValues && { rawProfValues: data.rawProfValues }),
      ...(data.rawLaborCategories && { rawLaborCategories: data.rawLaborCategories }),
      ...(data.rawCompanyValues && { rawCompanyValues: data.rawCompanyValues }),
      ...(data.rawInstallerNames && { rawInstallerNames: data.rawInstallerNames }),
      ...(data.excelFileTotalRows && { excelFileTotalRows: data.excelFileTotalRows }),
    } as DashboardData
  } catch (error: any) {
    console.error('❌ [fetchYearlyDashboardData] Error:', error)
    return { workrooms: [] }
  }
}

export async function saveYearlyDashboardData(year: number, data: DashboardData): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    console.error('❌ [saveYearlyDashboardData] No user logged in. Cannot save.')
    return false
  }

  try {
    const response = await fetch(`/api/yearly-data?year=${encodeURIComponent(String(year))}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [saveYearlyDashboardData] Failed to save:', response.status, errorText)
      return false
    }

    return true
  } catch (error: any) {
    console.error('❌ [saveYearlyDashboardData] Error saving:', error)
    return false
  }
}

export async function clearYearlyDashboardData(year: number): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch(`/api/yearly-data?year=${encodeURIComponent(String(year))}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('⚠️ [clearYearlyDashboardData] Failed to clear:', response.status, errorText)
      return false
    }
    return true
  } catch (error: any) {
    console.error('❌ [clearYearlyDashboardData] Error:', error)
    return false
  }
}

export async function saveYearlyFileNames(
  year: number,
  visualFileName: string | null,
  surveyFileName: string | null
): Promise<boolean> {
  // localStorage backup
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`fis-yearly-visual-file-name:${year}`, visualFileName || '')
      localStorage.setItem(`fis-yearly-survey-file-name:${year}`, surveyFileName || '')
    } catch {
      // ignore
    }
  }

  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch(`/api/yearly-file-names?year=${encodeURIComponent(String(year))}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visualFileName, surveyFileName }),
    })
    if (!response.ok) return true
    return true
  } catch (error) {
    console.error('Error saving yearly file names:', error)
    return true
  }
}

export async function loadYearlyFileNames(year: number): Promise<{ visualFileName: string | null; surveyFileName: string | null }> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    if (typeof window === 'undefined') return { visualFileName: null, surveyFileName: null }
    return {
      visualFileName: localStorage.getItem(`fis-yearly-visual-file-name:${year}`) || null,
      surveyFileName: localStorage.getItem(`fis-yearly-survey-file-name:${year}`) || null,
    }
  }

  try {
    const response = await fetch(`/api/yearly-file-names?year=${encodeURIComponent(String(year))}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      return { visualFileName: null, surveyFileName: null }
    }
    const data = await response.json()
    return {
      visualFileName: data.visualFileName || null,
      surveyFileName: data.surveyFileName || null,
    }
  } catch (error: any) {
    console.error('Error fetching yearly file names:', error)
    return { visualFileName: null, surveyFileName: null }
  }
}

// Save data to Supabase (visual_data + survey_data tables)
export async function saveDashboardData(data: DashboardData): Promise<boolean> {
  console.log('💾 [saveDashboardData] Called with', data.workrooms?.length || 0, 'workrooms')
  console.log('💾 [saveDashboardData] Data structure:', {
    hasWorkrooms: !!data.workrooms,
    isArray: Array.isArray(data.workrooms),
    length: data.workrooms?.length || 0,
    firstWorkroom: data.workrooms?.[0] ? {
      name: data.workrooms[0].name,
      hasSales: data.workrooms[0].sales != null,
      hasLtrScore: data.workrooms[0].ltrScore != null
    } : null
  })

  const authHeader = getAuthHeader()
  if (!authHeader) {
    console.error('❌ [saveDashboardData] No user logged in. Cannot save to Supabase.')
    return false
  }
  
  const userEmail = authHeader.replace('Bearer ', '')
  console.log('📧 [saveDashboardData] User email:', userEmail)

  try {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    console.log('📡 [saveDashboardData] API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      
      console.error('❌ [saveDashboardData] FAILED TO SAVE:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || errorText,
        details: errorData.details,
        hint: errorData.hint,
        code: errorData.code,
        workroomsCount: data.workrooms?.length || 0,
        fullErrorResponse: errorText
      })
      
      // Show user-friendly error
      alert(`Failed to save data: ${errorData.error || errorText}\n\nCheck browser console for details.`)
      
      return false
    }

    const result = await response.json()
    console.log('✅ [saveDashboardData] Saved to Supabase successfully:', {
      count: result.count,
      visualCount: result.visualCount,
      surveyCount: result.surveyCount
    })
    return true
  } catch (error: any) {
    console.error('❌ [saveDashboardData] Error saving to Supabase:', {
      error: error.message,
      stack: error.stack,
      workroomsCount: data.workrooms?.length || 0
    })
    return false
  }
}

// File Names - Save and Load
export async function saveFileNames(visualFileName: string | null, surveyFileName: string | null): Promise<boolean> {
  // Always save to localStorage as backup
  if (typeof window !== 'undefined') {
    if (visualFileName) {
      localStorage.setItem('fis-visual-file-name', visualFileName)
    } else {
      localStorage.removeItem('fis-visual-file-name')
    }
    if (surveyFileName) {
      localStorage.setItem('fis-survey-file-name', surveyFileName)
    } else {
      localStorage.removeItem('fis-survey-file-name')
    }
  }

  const authHeader = getAuthHeader()
  if (!authHeader) {
    // No auth - localStorage only
    return true
  }

  try {
    const response = await fetch('/api/file-names', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visualFileName, surveyFileName }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || response.statusText
      console.warn('⚠️ Error saving file names to database:', errorMessage)
      // Still saved to localStorage, so return true
      return true
    }

    return true
  } catch (error) {
    console.error('Error saving file names to database:', error)
    // Still saved to localStorage, so return true
    return true
  }
}

export async function loadFileNames(): Promise<{ visualFileName: string | null; surveyFileName: string | null }> {
  const authHeader = getAuthHeader()
  
  // If no auth, use localStorage
  if (!authHeader) {
    return loadFileNamesFromLocalStorage()
  }

  try {
    const response = await fetch('/api/file-names', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // API error - fallback to localStorage
      console.warn('Database API error for file names, using localStorage fallback')
      return loadFileNamesFromLocalStorage()
    }

    const data = await response.json()
    // Save to localStorage as backup
    if (typeof window !== 'undefined') {
      if (data.visualFileName) {
        localStorage.setItem('fis-visual-file-name', data.visualFileName)
      } else {
        localStorage.removeItem('fis-visual-file-name')
      }
      if (data.surveyFileName) {
        localStorage.setItem('fis-survey-file-name', data.surveyFileName)
      } else {
        localStorage.removeItem('fis-survey-file-name')
      }
    }
    return {
      visualFileName: data.visualFileName || null,
      surveyFileName: data.surveyFileName || null,
    }
  } catch (error: any) {
    console.error('Error fetching file names from database:', error)
    // Fallback to localStorage
    return loadFileNamesFromLocalStorage()
  }
}

function loadFileNamesFromLocalStorage(): { visualFileName: string | null; surveyFileName: string | null } {
  if (typeof window === 'undefined') {
    return { visualFileName: null, surveyFileName: null }
  }
  try {
    return {
      visualFileName: localStorage.getItem('fis-visual-file-name'),
      surveyFileName: localStorage.getItem('fis-survey-file-name'),
    }
  } catch (error) {
    console.error('Error loading file names from localStorage:', error)
    return { visualFileName: null, surveyFileName: null }
  }
}

export async function clearDashboardData(): Promise<boolean> {
  // Always clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fis-dashboard-data')
    // Also clear file names
    localStorage.removeItem('fis-visual-file-name')
    localStorage.removeItem('fis-survey-file-name')
  }

  // Record clear action
  recordActivity('Cleared dashboard data')

  const authHeader = getAuthHeader()
  
  // Clear file names from database
  if (authHeader) {
    try {
      await fetch('/api/file-names', {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Error clearing file names from database:', error)
    }
  }

  if (!authHeader) {
    return true
  }

  try {
    const response = await fetch('/api/data', {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error clearing data from database:', error)
    return true // localStorage already cleared
  }
}

// Historical Data - Try API first, fallback to localStorage
export async function fetchHistoricalData(
  period?: 'weekly' | 'monthly' | 'yearly',
  month?: string,
  year?: string
): Promise<HistoricalDataEntry[]> {
  const authHeader = getAuthHeader()
  
  // If no auth, use localStorage
  if (!authHeader) {
    return loadHistoricalFromLocalStorage()
  }

  try {
    const params = new URLSearchParams()
    if (period) params.append('period', period)
    if (month) params.append('month', month)
    if (year) params.append('year', year)

    const response = await fetch(`/api/historical?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const entries = await response.json()
    return entries as HistoricalDataEntry[]
  } catch (error: any) {
    console.error('Error fetching historical data from database:', error)
    // Fallback to localStorage
    return loadHistoricalFromLocalStorage()
  }
}

export async function saveHistoricalData(
  data: DashboardData,
  customDate?: Date | string
): Promise<HistoricalDataEntry | null> {
  const dateObj = customDate
    ? typeof customDate === 'string' ? new Date(customDate) : customDate
    : new Date()

  const timestamp = dateObj.getTime()
  const uploadDate = dateObj.toISOString().split('T')[0]
  const year = dateObj.getFullYear().toString()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  
  // Calculate week
  const week = getISOWeek(dateObj)
  const weekKey = `${year}-W${week.padStart(2, '0')}`

  const entry: HistoricalDataEntry = {
    id: `temp-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    uploadDate,
    week: weekKey,
    month: `${year}-${month}`,
    year,
    data,
    timestamp,
  }

  // Always save to localStorage as backup
  saveHistoricalToLocalStorage(entry)

  // Record snapshot save
  recordActivity('Saved historical snapshot')

  const authHeader = getAuthHeader()
  if (!authHeader) {
    return entry
  }

  try {
    const response = await fetch('/api/historical', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadDate,
        week: weekKey,
        month: `${year}-${month}`,
        year,
        data,
        timestamp,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const savedEntry = await response.json()
    // Update localStorage with saved entry (has real ID)
    if (savedEntry.id) {
      entry.id = savedEntry.id
      const all = loadHistoricalFromLocalStorage()
      const index = all.findIndex(e => e.id.startsWith(`temp-${timestamp}`))
      if (index >= 0) {
        all[index] = entry
        localStorage.setItem('fis-historical-data', JSON.stringify(all))
      }
    }
    return savedEntry as HistoricalDataEntry
  } catch (error) {
    console.error('Error saving historical data to database:', error)
    // Still saved to localStorage
    return entry
  }
}

export async function deleteHistoricalData(id: string): Promise<boolean> {
  // Always delete from localStorage
  if (typeof window !== 'undefined') {
    try {
      const all = loadHistoricalFromLocalStorage()
      const filtered = all.filter(entry => entry.id !== id)
      localStorage.setItem('fis-historical-data', JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting from localStorage:', error)
    }
  }

  // Record deletion
  recordActivity('Deleted historical entry', `id=${id}`)

  const authHeader = getAuthHeader()
  if (!authHeader) {
    return true
  }

  try {
    const response = await fetch(`/api/historical?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error deleting historical data from database:', error)
    return true // localStorage already updated
  }
}

export async function clearAllHistoricalData(): Promise<boolean> {
  // Always clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fis-historical-data')
  }

  // Record clear all
  recordActivity('Cleared all historical data')

  const authHeader = getAuthHeader()
  if (!authHeader) {
    return true
  }

  try {
    const response = await fetch('/api/historical?clearAll=true', {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error clearing historical data from database:', error)
    return true // localStorage already cleared
  }
}

// Helper functions for localStorage fallback
function loadFromLocalStorage(): DashboardData {
  if (typeof window === 'undefined') return { workrooms: [] }
  try {
    const stored = localStorage.getItem('fis-dashboard-data')
    if (stored) {
      const parsed = JSON.parse(stored)
      console.log('📦 Loaded from localStorage:', parsed.workrooms?.length || 0, 'workrooms')
      return parsed
    }
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error)
  }
  console.log('⚠️ No data in localStorage, returning empty')
  return { workrooms: [] }
}

function saveToLocalStorage(data: DashboardData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('fis-dashboard-data', JSON.stringify(data))
    console.log('💾 Saved to localStorage:', data.workrooms?.length || 0, 'workrooms')
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error)
  }
}

function loadHistoricalFromLocalStorage(): HistoricalDataEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('fis-historical-data')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading historical from localStorage:', error)
  }
  return []
}

function saveHistoricalToLocalStorage(entry: HistoricalDataEntry): void {
  if (typeof window === 'undefined') return
  try {
    const all = loadHistoricalFromLocalStorage()
    all.push(entry)
    all.sort((a, b) => b.timestamp - a.timestamp)
    localStorage.setItem('fis-historical-data', JSON.stringify(all))
  } catch (error) {
    console.error('Error saving historical to localStorage:', error)
  }
}

// ============================================================================
// Payment Data (Supabase via API routes)
// ============================================================================

const emptyPaymentData = (): PaymentData => ({ payments: [] })

export async function fetchPaymentData(): Promise<PaymentData> {
  const authHeader = getAuthHeader()
  if (!authHeader) return emptyPaymentData()

  try {
    const response = await fetch('/api/payment-data', {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return emptyPaymentData()
    }

    const data = await response.json()
    return {
      payments: data.payments || [],
      fileName: data.fileName || undefined,
      uploadDate: data.uploadDate || undefined,
    }
  } catch (error) {
    console.error('❌ [fetchPaymentData] Error:', error)
    return emptyPaymentData()
  }
}

export async function clearPaymentData(): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch('/api/payment-data', {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })
    return response.ok
  } catch (error) {
    console.error('❌ [clearPaymentData] Error:', error)
    return false
  }
}

export async function savePaymentData(data: PaymentData): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    console.error('❌ [savePaymentData] No user logged in')
    return false
  }

  try {
    const response = await fetch('/api/payment-data', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payments: data.payments,
        fileName: data.fileName || null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [savePaymentData] Failed:', response.status, errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ [savePaymentData] Error:', error)
    return false
  }
}

export async function fetchYearlyPaymentData(year: number): Promise<PaymentData> {
  const authHeader = getAuthHeader()
  if (!authHeader) return emptyPaymentData()

  try {
    const response = await fetch(`/api/yearly-payment-data?year=${encodeURIComponent(String(year))}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return emptyPaymentData()
    }

    const data = await response.json()
    return {
      payments: data.payments || [],
      fileName: data.fileName || undefined,
      uploadDate: data.uploadDate || undefined,
    }
  } catch (error) {
    console.error('❌ [fetchYearlyPaymentData] Error:', error)
    return emptyPaymentData()
  }
}

export async function saveYearlyPaymentData(year: number, data: PaymentData): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return false

  try {
    const response = await fetch(`/api/yearly-payment-data?year=${encodeURIComponent(String(year))}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payments: data.payments,
        fileName: data.fileName || null,
        year,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [saveYearlyPaymentData] Failed:', response.status, errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ [saveYearlyPaymentData] Error:', error)
    return false
  }
}

export async function clearYearlyPaymentData(year: number): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch(`/api/yearly-payment-data?year=${encodeURIComponent(String(year))}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })
    return response.ok
  } catch (error) {
    console.error('❌ [clearYearlyPaymentData] Error:', error)
    return false
  }
}

export async function savePaymentFileName(paymentFileName: string | null): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      if (paymentFileName) {
        localStorage.setItem('fis-payment-file-name', paymentFileName)
      } else {
        localStorage.removeItem('fis-payment-file-name')
      }
    } catch {
      // ignore
    }
  }

  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch('/api/payment-file-names', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentFileName }),
    })
    return response.ok
  } catch (error) {
    console.error('Error saving payment file name:', error)
    return true
  }
}

export async function loadPaymentFileName(): Promise<string | null> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('fis-payment-file-name') || null
  }

  try {
    const response = await fetch('/api/payment-file-names', {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return localStorage.getItem('fis-payment-file-name') || null
    }

    const data = await response.json()
    return data.paymentFileName || null
  } catch (error) {
    console.error('Error loading payment file name:', error)
    return localStorage.getItem('fis-payment-file-name') || null
  }
}

export async function saveYearlyPaymentFileName(year: number, paymentFileName: string | null): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const key = `fis-yearly-payment-file-name:${year}`
      if (paymentFileName) {
        localStorage.setItem(key, paymentFileName)
      } else {
        localStorage.removeItem(key)
      }
    } catch {
      // ignore
    }
  }

  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch(`/api/yearly-payment-file-names?year=${encodeURIComponent(String(year))}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentFileName }),
    })
    return response.ok
  } catch (error) {
    console.error('Error saving yearly payment file name:', error)
    return true
  }
}

export async function loadYearlyPaymentFileName(year: number): Promise<string | null> {
  const authHeader = getAuthHeader()
  const localKey = `fis-yearly-payment-file-name:${year}`

  if (!authHeader) {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(localKey) || null
  }

  try {
    const response = await fetch(`/api/yearly-payment-file-names?year=${encodeURIComponent(String(year))}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return localStorage.getItem(localKey) || null
    }

    const data = await response.json()
    return data.paymentFileName || null
  } catch (error) {
    console.error('Error loading yearly payment file name:', error)
    return localStorage.getItem(localKey) || null
  }
}

// Helper function for week calculation
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return String(Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7))
}

// ============================================================================
// Scheduled Job Data — local IndexedDB only (browser storage, no cloud)
// ============================================================================

export async function fetchScheduledJobData(mode: ScheduledJobStorageMode = 'monthly'): Promise<ScheduledJobData> {
  return loadScheduledJobDataLocal(mode)
}

export async function saveScheduledJobSource(
  source: ScheduledJobSourceType,
  bundle: ScheduledJobSourceBundle,
  mode: ScheduledJobStorageMode = 'monthly'
): Promise<boolean> {
  return saveScheduledJobSourceLocal(mode, source, bundle)
}

export async function saveScheduledJobData(
  data: ScheduledJobData,
  mode: ScheduledJobStorageMode = 'monthly'
): Promise<boolean> {
  return saveScheduledJobDataLocal(mode, data)
}

export async function saveScheduledJobFileName(scheduledJobFileName: string | null): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      if (scheduledJobFileName) {
        localStorage.setItem('fis-scheduled-job-file-name', scheduledJobFileName)
      } else {
        localStorage.removeItem('fis-scheduled-job-file-name')
      }
    } catch {
      // ignore
    }
  }

  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch('/api/scheduled-job-file-names', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scheduledJobFileName }),
    })
    return response.ok
  } catch (error) {
    console.error('Error saving scheduled job file name:', error)
    return true
  }
}

export async function loadScheduledJobFileName(): Promise<string | null> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('fis-scheduled-job-file-name') || null
  }

  try {
    const response = await fetch('/api/scheduled-job-file-names', {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return localStorage.getItem('fis-scheduled-job-file-name') || null
    }

    const data = await response.json()
    return data.scheduledJobFileName || null
  } catch (error) {
    console.error('Error loading scheduled job file name:', error)
    return localStorage.getItem('fis-scheduled-job-file-name') || null
  }
}

export type CycleTimeCloudVariant = 'ytd' | 'ly'

export interface CycleTimeCloudDataset {
  records: any[]
  fileName: string | null
  uploadedAt: string | null
}

export async function fetchCycleTimeData(variant: CycleTimeCloudVariant): Promise<CycleTimeCloudDataset> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    return { records: [], fileName: null, uploadedAt: null }
  }

  try {
    const response = await fetch(`/api/cycle-time-data?variant=${encodeURIComponent(variant)}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { records: [], fileName: null, uploadedAt: null }
    }

    const data = await response.json()
    return {
      records: Array.isArray(data.records) ? data.records : [],
      fileName: data.fileName || null,
      uploadedAt: data.uploadedAt || null,
    }
  } catch (error) {
    console.error('❌ [fetchCycleTimeData] Error:', error)
    return { records: [], fileName: null, uploadedAt: null }
  }
}

export async function saveCycleTimeData(
  variant: CycleTimeCloudVariant,
  records: any[],
  fileName: string | null
): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    console.error('❌ [saveCycleTimeData] No user logged in')
    return false
  }

  try {
    const response = await fetch(`/api/cycle-time-data?variant=${encodeURIComponent(variant)}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variant,
        records,
        fileName,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [saveCycleTimeData] Failed:', response.status, errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ [saveCycleTimeData] Error:', error)
    return false
  }
}

export async function clearCycleTimeData(variant: CycleTimeCloudVariant): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return true

  try {
    const response = await fetch(`/api/cycle-time-data?variant=${encodeURIComponent(variant)}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })
    return response.ok
  } catch (error) {
    console.error('❌ [clearCycleTimeData] Error:', error)
    return false
  }
}
