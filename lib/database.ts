// Data Storage - localStorage Only (No Database)
// Simplified for Vercel deployment - no database setup needed!

import type { DashboardData } from '@/context/DataContext'
import type { HistoricalDataEntry } from '@/data/historicalDataStorage'

// Main Dashboard Data - localStorage only
export async function fetchDashboardData(): Promise<DashboardData> {
  return loadFromLocalStorage()
}

export async function saveDashboardData(data: DashboardData): Promise<boolean> {
  saveToLocalStorage(data)
  return true
}

export async function clearDashboardData(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fis-dashboard-data')
  }
  return true
}

// Historical Data - localStorage only
export async function fetchHistoricalData(
  period?: 'weekly' | 'monthly' | 'yearly',
  month?: string,
  year?: string
): Promise<HistoricalDataEntry[]> {
  let allData = loadHistoricalFromLocalStorage()
  
  // Filter by period if needed
  if (month) {
    allData = allData.filter(entry => entry.month === month)
  }
  if (year) {
    allData = allData.filter(entry => entry.year === year)
  }
  
  return allData.sort((a, b) => b.timestamp - a.timestamp)
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
    id: `local-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    uploadDate,
    week: weekKey,
    month: `${year}-${month}`,
    year,
    data,
    timestamp,
  }

  saveHistoricalToLocalStorage(entry)
  return entry
}

export async function deleteHistoricalData(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const all = loadHistoricalFromLocalStorage()
    const filtered = all.filter(entry => entry.id !== id)
    localStorage.setItem('fis-historical-data', JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting historical data:', error)
    return false
  }
}

export async function clearAllHistoricalData(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fis-historical-data')
  }
  return true
}

// Helper functions for localStorage
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
