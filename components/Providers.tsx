'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataContext } from '@/context/DataContext'
import { initialData } from '@/data/mockData'
import type { DashboardData } from '@/context/DataContext'
import { FilterProvider } from '@/components/FilterContext'
import { NotificationProvider } from '@/components/NotificationContext'
import { AuthProvider, useAuth } from '@/components/AuthContext'
import { fetchDashboardData, saveDashboardData } from '@/lib/database'

// Inner component that has access to AuthContext
function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [data, setDataState] = useState<DashboardData>(initialData)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from database when user changes (logs in/out)
  useEffect(() => {
    const loadData = async () => {
      // Wait a bit to ensure user is fully loaded in localStorage
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setIsLoading(true)
      try {
        console.log('Loading data for user:', user?.email || 'no user')
        const persistedData = await fetchDashboardData()
        console.log('Loaded data:', persistedData.workrooms.length, 'workrooms')
        
        // Only update if the persisted data is different from initial data
        if (JSON.stringify(persistedData) !== JSON.stringify(initialData)) {
          setDataState(persistedData)
        } else {
          // If no data found, reset to initial
          setDataState(initialData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    // Only load data if we're on client side
    if (typeof window !== 'undefined') {
      loadData()
    }
  }, [user]) // Reload when user changes (logs in/out)

  // Custom setData that also persists to database
  const setData = useCallback(async (newData: DashboardData) => {
    setDataState(newData)
    // Save to database (with localStorage fallback)
    await saveDashboardData(newData)
  }, [])

  return (
    <DataContext.Provider value={{ data, setData }}>
      <NotificationProvider>
        <FilterProvider>
          {children}
        </FilterProvider>
      </NotificationProvider>
    </DataContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </AuthProvider>
  )
}

