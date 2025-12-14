'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataContext } from '@/context/DataContext'
import { initialData } from '@/data/mockData'
import type { DashboardData } from '@/context/DataContext'
import { FilterProvider } from '@/components/FilterContext'
import { NotificationProvider } from '@/components/NotificationContext'
import { WorkroomNotificationProvider } from '@/components/WorkroomNotificationContext'
import { AuthProvider, useAuth } from '@/components/AuthContext'
import { fetchDashboardData, saveDashboardData } from '@/lib/database'

// Inner component that has access to AuthContext
function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [data, setDataState] = useState<DashboardData>(initialData)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from Supabase workroom_data table on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      // Wait a bit to ensure user is fully loaded
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setIsLoading(true)
      try {
        console.log('🔄 [DataProvider] Loading data from Supabase (visual_data + survey_data tables) for user:', user?.email || 'no user')
        
        // Load from separate visual_data and survey_data tables
        const dataFromSupabase = await fetchDashboardData()
        
        // If we have data, use it. Otherwise, use empty data.
        if (dataFromSupabase && dataFromSupabase.workrooms && dataFromSupabase.workrooms.length > 0) {
          setDataState(dataFromSupabase)
          const visualCount = dataFromSupabase.workrooms.filter(w => w.sales != null || w.laborPO != null).length
          const surveyCount = dataFromSupabase.workrooms.filter(w => w.ltrScore != null || w.craftScore != null).length
          console.log(`✅ [DataProvider] Loaded ${dataFromSupabase.workrooms.length} workrooms from Supabase (${visualCount} visual + ${surveyCount} survey)`)
        } else {
          setDataState(initialData)
          console.log('⚠️ [DataProvider] No data in Supabase, showing empty dashboard')
        }
      } catch (error) {
        console.error('❌ [DataProvider] Error loading from Supabase:', error)
        setDataState(initialData)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (typeof window !== 'undefined') {
      loadData()
    }
  }, [user]) // Reload when user changes (logs in/out)

  // When data is uploaded: Update state and save to Supabase
  // Supabase will: DELETE old data → INSERT new data
  const setData = useCallback(async (newData: DashboardData) => {
    console.log('💾 Saving', newData.workrooms?.length || 0, 'workrooms to Supabase...')
    
    // Update UI immediately
    setDataState(newData)
    
    // Save to Supabase (deletes old, saves new)
    await saveDashboardData(newData)
  }, [])

  return (
    <DataContext.Provider value={{ data, setData }}>
      <NotificationProvider>
        <WorkroomNotificationProvider>
          <FilterProvider>
            {children}
          </FilterProvider>
        </WorkroomNotificationProvider>
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

