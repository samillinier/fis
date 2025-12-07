// Historical Data Storage System
// Now uses database API instead of localStorage

import type { DashboardData } from '@/context/DataContext'
import {
  fetchHistoricalData,
  saveHistoricalData as saveToDatabase,
  deleteHistoricalData as deleteFromDatabase,
  clearAllHistoricalData as clearAllFromDatabase,
} from '@/lib/database'

export interface HistoricalDataEntry {
  id: string
  uploadDate: string // ISO date string
  week: string // Format: "YYYY-WW" (e.g., "2024-01")
  month: string // Format: "YYYY-MM" (e.g., "2024-01")
  year: string // Format: "YYYY" (e.g., "2024")
  data: DashboardData
  timestamp: number // Unix timestamp for sorting
}

// Get all historical data entries (from database)
export async function getAllHistoricalData(): Promise<HistoricalDataEntry[]> {
  if (typeof window === 'undefined') {
    // Return empty array during SSR to prevent hydration mismatch
    return []
  }

  try {
    return await fetchHistoricalData()
  } catch (error) {
    console.error('Error loading historical data:', error)
    return []
  }
}

// Save historical data entry with optional custom date (to database)
export async function saveHistoricalData(
  data: DashboardData,
  customDate?: Date | string
): Promise<HistoricalDataEntry> {
  const entry = await saveToDatabase(data, customDate)
  if (!entry) {
    throw new Error('Failed to save historical data')
  }
  return entry
}

// Get data filtered by time period (from database)
export async function getHistoricalDataByPeriod(
  period: 'weekly' | 'monthly' | 'yearly',
  selectedMonth?: string,
  selectedYear?: string
): Promise<HistoricalDataEntry[]> {
  try {
    return await fetchHistoricalData(period, selectedMonth, selectedYear)
  } catch (error) {
    console.error('Error fetching historical data by period:', error)
    return []
  }
}

// Get unique months from historical data (from database)
export async function getAvailableMonths(): Promise<string[]> {
  try {
    const allData = await getAllHistoricalData()
    const months = new Set<string>()
    allData.forEach((entry) => {
      months.add(entry.month)
    })
    return Array.from(months).sort().reverse() // Most recent first
  } catch (error) {
    console.error('Error getting available months:', error)
    return []
  }
}

// Get unique years from historical data (from database)
export async function getAvailableYears(): Promise<string[]> {
  try {
    const allData = await getAllHistoricalData()
    const years = new Set<string>()
    allData.forEach((entry) => {
      years.add(entry.year)
    })
    return Array.from(years).sort().reverse() // Most recent first
  } catch (error) {
    console.error('Error getting available years:', error)
    return []
  }
}

// Helper functions
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return String(Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7))
}

// Delete historical data entry (from database)
export async function deleteHistoricalData(id: string): Promise<void> {
  try {
    await deleteFromDatabase(id)
  } catch (error) {
    console.error('Error deleting historical data:', error)
  }
}

// Clear all historical data (from database)
export async function clearAllHistoricalData(): Promise<void> {
  try {
    await clearAllFromDatabase()
  } catch (error) {
    console.error('Error clearing historical data:', error)
  }
}

