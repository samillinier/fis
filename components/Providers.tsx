'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataContext } from '@/context/DataContext'
import { initialData } from '@/data/mockData'
import type { DashboardData } from '@/context/DataContext'
import { FilterProvider } from '@/components/FilterContext'
import { NotificationProvider } from '@/components/NotificationContext'
import { AuthProvider } from '@/components/AuthContext'

const DATA_STORAGE_KEY = 'fis-dashboard-data'

// Load data from localStorage or return empty data
function loadPersistedData(): DashboardData {
  if (typeof window === 'undefined') {
    return initialData
  }

  try {
    const stored = localStorage.getItem(DATA_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate that it has the expected structure
      if (parsed && Array.isArray(parsed.workrooms)) {
        return parsed as DashboardData
      }
    }
  } catch (error) {
    console.error('Error loading persisted data:', error)
  }

  // Return empty data instead of initial mock data
  return { workrooms: [] }
}

// Save data to localStorage
function savePersistedData(data: DashboardData) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving persisted data:', error)
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Always start with initialData to match server-side rendering
  const [data, setDataState] = useState<DashboardData>(initialData)
  const [isClient, setIsClient] = useState(false)

  // Load data from localStorage on mount (client-side only)
  useEffect(() => {
    setIsClient(true)
    const persistedData = loadPersistedData()
    // Only update if the persisted data is different from initial data
    if (JSON.stringify(persistedData) !== JSON.stringify(initialData)) {
      setDataState(persistedData)
    }
  }, [])

  // Custom setData that also persists to localStorage
  const setData = useCallback((newData: DashboardData) => {
    setDataState(newData)
    if (typeof window !== 'undefined') {
      savePersistedData(newData)
    }
  }, [])

      return (
        <AuthProvider>
          <DataContext.Provider value={{ data, setData }}>
            <NotificationProvider>
              <FilterProvider>
                {children}
              </FilterProvider>
            </NotificationProvider>
          </DataContext.Provider>
        </AuthProvider>
      )
}

