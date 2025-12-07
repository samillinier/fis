// Data Storage - Vercel Postgres with localStorage Fallback
// Uses API routes (connected to Vercel Postgres) with localStorage fallback

import type { DashboardData, WorkroomData } from '@/context/DataContext'
import type { HistoricalDataEntry } from '@/data/historicalDataStorage'

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
export async function fetchDashboardData(): Promise<DashboardData> {
  const authHeader = getAuthHeader()
  
  // If no auth, use localStorage
  if (!authHeader) {
    return loadFromLocalStorage()
  }

  try {
    const response = await fetch('/api/data', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // API error - fallback to localStorage
      console.warn('Database API error, using localStorage fallback')
      return loadFromLocalStorage()
    }

    const data = await response.json()
    // Save to localStorage as backup
    if (data.workrooms) {
      saveToLocalStorage(data)
    }
    return data as DashboardData
  } catch (error: any) {
    console.error('Error fetching data from database:', error)
    // Fallback to localStorage
    return loadFromLocalStorage()
  }
}

export async function saveDashboardData(data: DashboardData): Promise<boolean> {
  // Always save to localStorage as backup
  saveToLocalStorage(data)

  const authHeader = getAuthHeader()
  if (!authHeader) {
    // No auth - localStorage only
    console.warn('⚠️ No user logged in. Data saved to localStorage only. Please sign in to save to database.')
    return true
  }

  try {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || response.statusText
      
      if (response.status === 401) {
        console.warn('⚠️ Unauthorized. Data saved to localStorage only. Please sign in.')
      } else if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        console.error('❌ Database tables not found. Please run database/vercel-postgres-schema.sql in Vercel Postgres SQL Editor.')
      } else {
        console.error('❌ Error saving to database:', errorMessage)
        console.warn('⚠️ Data saved to localStorage as fallback. Check database connection.')
      }
      throw new Error(errorMessage)
    }

    console.log('✅ Data saved to database successfully')
    return true
  } catch (error) {
    console.error('Error saving data to database:', error)
    // Data still saved to localStorage, so return true
    return true
  }
}

export async function clearDashboardData(): Promise<boolean> {
  // Always clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fis-dashboard-data')
  }

  const authHeader = getAuthHeader()
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
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
  return { workrooms: [] }
}

function saveToLocalStorage(data: DashboardData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('fis-dashboard-data', JSON.stringify(data))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
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

// Helper function for week calculation
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return String(Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7))
}
