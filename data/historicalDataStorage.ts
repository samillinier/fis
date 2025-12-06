// Historical Data Storage System
// Stores weekly uploads separately from main dashboard data

import type { DashboardData } from '@/context/DataContext'

export interface HistoricalDataEntry {
  id: string
  uploadDate: string // ISO date string
  week: string // Format: "YYYY-WW" (e.g., "2024-01")
  month: string // Format: "YYYY-MM" (e.g., "2024-01")
  year: string // Format: "YYYY" (e.g., "2024")
  data: DashboardData
  timestamp: number // Unix timestamp for sorting
}

const HISTORICAL_STORAGE_KEY = 'fis-historical-data'

// Get all historical data entries (client-side only)
export function getAllHistoricalData(): HistoricalDataEntry[] {
  if (typeof window === 'undefined') {
    // Return empty array during SSR to prevent hydration mismatch
    return []
  }

  try {
    const stored = localStorage.getItem(HISTORICAL_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as HistoricalDataEntry[]
    }
  } catch (error) {
    console.error('Error loading historical data:', error)
  }

  return []
}

// Save historical data entry with optional custom date
export function saveHistoricalData(data: DashboardData, customDate?: Date | string): HistoricalDataEntry {
  // Use custom date if provided, otherwise use current date
  const dateObj = customDate 
    ? (typeof customDate === 'string' ? new Date(customDate) : customDate)
    : new Date()
  
  const timestamp = dateObj.getTime()
  const uploadDate = dateObj.toISOString()
  
  // Calculate week number (ISO week) based on the provided date
  const weekStart = getWeekStart(dateObj)
  const year = dateObj.getFullYear().toString()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const week = getISOWeek(dateObj)
  const weekKey = `${year}-W${week.padStart(2, '0')}`

  const entry: HistoricalDataEntry = {
    id: `historical-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    uploadDate,
    week: weekKey,
    month: `${year}-${month}`,
    year,
    data,
    timestamp,
  }

  const allData = getAllHistoricalData()
  allData.push(entry)
  
  // Sort by timestamp (newest first)
  allData.sort((a, b) => b.timestamp - a.timestamp)

  try {
    localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(allData))
  } catch (error) {
    console.error('Error saving historical data:', error)
  }

  return entry
}

// Get data filtered by time period
export function getHistoricalDataByPeriod(
  period: 'weekly' | 'monthly' | 'yearly',
  selectedMonth?: string,
  selectedYear?: string
): HistoricalDataEntry[] {
  const allData = getAllHistoricalData()
  
  let filtered = allData

  // Filter by selected month if provided (format: "YYYY-MM")
  if (selectedMonth) {
    filtered = filtered.filter((entry) => entry.month === selectedMonth)
  }

  // Filter by selected year if provided (format: "YYYY")
  if (selectedYear) {
    filtered = filtered.filter((entry) => entry.year === selectedYear)
  }
  
  if (period === 'yearly') {
    // User uploads weekly TI/T2 data every week
    // Yearly view: return ALL weekly entries for the selected year (will be aggregated in UI)
    // If year is selected, filtered already contains only that year's entries
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  if (period === 'monthly') {
    // User uploads weekly TI/T2 data every week
    // Monthly view: return ALL weekly entries for the selected month (will be aggregated in UI)
    // If month is selected, filtered already contains only that month's entries
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Weekly: return all filtered entries (individual weekly snapshots)
  return filtered.sort((a, b) => b.timestamp - a.timestamp)
}

// Get unique months from historical data
export function getAvailableMonths(): string[] {
  const allData = getAllHistoricalData()
  const months = new Set<string>()
  allData.forEach((entry) => {
    months.add(entry.month)
  })
  return Array.from(months).sort().reverse() // Most recent first
}

// Get unique years from historical data
export function getAvailableYears(): string[] {
  const allData = getAllHistoricalData()
  const years = new Set<string>()
  allData.forEach((entry) => {
    years.add(entry.year)
  })
  return Array.from(years).sort().reverse() // Most recent first
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

// Delete historical data entry
export function deleteHistoricalData(id: string): void {
  const allData = getAllHistoricalData()
  const filtered = allData.filter((entry) => entry.id !== id)
  
  try {
    localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting historical data:', error)
  }
}

// Clear all historical data
export function clearAllHistoricalData(): void {
  try {
    localStorage.removeItem(HISTORICAL_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing historical data:', error)
  }
}

