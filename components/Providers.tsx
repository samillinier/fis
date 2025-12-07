'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataContext } from '@/context/DataContext'
import { initialData } from '@/data/mockData'
import type { DashboardData } from '@/context/DataContext'
import { FilterProvider } from '@/components/FilterContext'
import { NotificationProvider } from '@/components/NotificationContext'
import { AuthProvider } from '@/components/AuthContext'
import { fetchDashboardData, saveDashboardData } from '@/lib/database'

export function Providers({ children }: { children: React.ReactNode }) {
  // Always start with initialData to match server-side rendering
  const [data, setDataState] = useState<DashboardData>(initialData)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from database on mount (client-side only)
  useEffect(() => {
    setIsClient(true)
    const loadData = async () => {
      try {
        const persistedData = await fetchDashboardData()
        // Only update if the persisted data is different from initial data
        if (JSON.stringify(persistedData) !== JSON.stringify(initialData)) {
          setDataState(persistedData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Custom setData that also persists to database
  const setData = useCallback(async (newData: DashboardData) => {
    setDataState(newData)
    // Save to database (with localStorage fallback)
    await saveDashboardData(newData)
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

