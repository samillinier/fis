// Database API client functions
// These replace localStorage functions and call the API routes

import type { DashboardData, WorkroomData } from '@/context/DataContext'
import type { HistoricalDataEntry } from '@/data/historicalDataStorage'

// Get user ID from auth (you'll need to implement this based on your auth system)
function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('fis-user')
  if (!userStr) return null
  try {
    const user = JSON.parse(userStr)
    // For now, use email as user ID. In production, use actual user ID from auth
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

// Main Dashboard Data API
export async function fetchDashboardData(): Promise<DashboardData> {
  const authHeader = getAuthHeader()
  if (!authHeader) {
    // Fallback to localStorage if no auth
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
      // Always fallback to localStorage on API errors
      console.warn('Database API error, using localStorage fallback')
      return loadFromLocalStorage()
    }

    const data = await response.json()
    return data as DashboardData
  } catch (error: any) {
    console.error('Error fetching data from database:', error)
    // Fallback to localStorage
    return loadFromLocalStorage()
  }
}

export async function saveDashboardData(data: DashboardData): Promise<boolean> {
  const authHeader = getAuthHeader()
  
  // Always save to localStorage as backup
  saveToLocalStorage(data)

  if (!authHeader) {
    console.warn('No auth header, data saved to localStorage only')
    return false
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
      throw new Error(`API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error saving data to database:', error)
    return false
  }
}

export async function clearDashboardData(): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return false

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

    // Also clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fis-dashboard-data')
    }

    return true
  } catch (error) {
    console.error('Error clearing data from database:', error)
    return false
  }
}

// Historical Data API
export async function fetchHistoricalData(
  period?: 'weekly' | 'monthly' | 'yearly',
  month?: string,
  year?: string
): Promise<HistoricalDataEntry[]> {
  const authHeader = getAuthHeader()
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

    return await response.json()
  } catch (error) {
    console.error('Error fetching historical data from database:', error)
    return loadHistoricalFromLocalStorage()
  }
}

export async function saveHistoricalData(
  data: DashboardData,
  customDate?: Date | string
): Promise<HistoricalDataEntry | null> {
  const authHeader = getAuthHeader()
  
  const dateObj = customDate
    ? typeof customDate === 'string' ? new Date(customDate) : customDate
    : new Date()

  const timestamp = dateObj.getTime()
  const uploadDate = dateObj.toISOString().split('T')[0]
  const year = dateObj.getFullYear().toString()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  
  // Calculate week
  const weekStart = getWeekStart(dateObj)
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

  // Save to localStorage as backup
  saveHistoricalToLocalStorage(entry)

  if (!authHeader) {
    console.warn('No auth header, historical data saved to localStorage only')
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

    return await response.json()
  } catch (error) {
    console.error('Error saving historical data to database:', error)
    return entry
  }
}

export async function deleteHistoricalData(id: string): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return false

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
    return false
  }
}

export async function clearAllHistoricalData(): Promise<boolean> {
  const authHeader = getAuthHeader()
  if (!authHeader) return false

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

    // Also clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fis-historical-data')
    }

    return true
  } catch (error) {
    console.error('Error clearing historical data from database:', error)
    return false
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

// Helper functions for week calculation
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return String(Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7))
}

