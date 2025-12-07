// Historical Data Storage System - localStorage Only
// No database dependency - works on Vercel without setup

import type { DashboardData } from '@/context/DataContext'
import {
  fetchHistoricalData,
  saveHistoricalData as saveToStorage,
  deleteHistoricalData as deleteFromStorage,
  clearAllHistoricalData as clearAllFromStorage,
} from '@/lib/database'

export interface HistoricalDataEntry {
  id: string
  uploadDate: string
  week: string
  month: string
  year: string
  data: DashboardData
  timestamp: number
}

// Get all historical data entries (from localStorage)
export async function getAllHistoricalData(): Promise<HistoricalDataEntry[]> {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    return await fetchHistoricalData()
  } catch (error) {
    console.error('Error loading historical data:', error)
    return []
  }
}

// Save historical data entry
export async function saveHistoricalData(
  data: DashboardData,
  customDate?: Date | string
): Promise<HistoricalDataEntry> {
  const entry = await saveToStorage(data, customDate)
  if (!entry) {
    throw new Error('Failed to save historical data')
  }
  return entry
}

// Get data filtered by time period
export async function getHistoricalDataByPeriod(
  period: 'weekly' | 'monthly' | 'yearly',
  selectedMonth?: string,
  selectedYear?: string
): Promise<HistoricalDataEntry[]> {
  try {
    let allData = await fetchHistoricalData(period, selectedMonth, selectedYear)
    
    // For weekly view with month/year selected, return only most recent
    if (period === 'weekly' && (selectedMonth || selectedYear)) {
      return allData.length > 0 ? [allData[0]] : []
    }
    
    return allData
  } catch (error) {
    console.error('Error fetching historical data by period:', error)
    return []
  }
}

// Get unique months from historical data
export async function getAvailableMonths(): Promise<string[]> {
  try {
    const allData = await getAllHistoricalData()
    const months = new Set<string>()
    allData.forEach((entry) => {
      months.add(entry.month)
    })
    return Array.from(months).sort().reverse()
  } catch (error) {
    console.error('Error getting available months:', error)
    return []
  }
}

// Get unique years from historical data
export async function getAvailableYears(): Promise<string[]> {
  try {
    const allData = await getAllHistoricalData()
    const years = new Set<string>()
    allData.forEach((entry) => {
      years.add(entry.year)
    })
    return Array.from(years).sort().reverse()
  } catch (error) {
    console.error('Error getting available years:', error)
    return []
  }
}

// Delete historical data entry
export async function deleteHistoricalData(id: string): Promise<void> {
  try {
    await deleteFromStorage(id)
  } catch (error) {
    console.error('Error deleting historical data:', error)
  }
}

// Clear all historical data
export async function clearAllHistoricalData(): Promise<void> {
  try {
    await clearAllFromStorage()
  } catch (error) {
    console.error('Error clearing historical data:', error)
  }
}
