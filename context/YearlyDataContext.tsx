'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { DashboardData } from '@/context/DataContext'
import { initialData } from '@/data/mockData'
import { fetchYearlyDashboardData, saveYearlyDashboardData, clearYearlyDashboardData } from '@/lib/database'

const STORAGE_KEY_PREFIX = 'fis-yearly-dashboard-data:'

interface YearlyDataContextType {
  year: number
  data: DashboardData
  setData: (data: DashboardData) => Promise<void>
  resetData: () => Promise<void>
  isHydrated: boolean
}

export const YearlyDataContext = createContext<YearlyDataContextType | undefined>(undefined)

export function useYearlyData() {
  const context = useContext(YearlyDataContext)
  if (!context) {
    throw new Error('useYearlyData must be used within YearlyDataProvider')
  }
  return context
}

function getStorageKey(year: number) {
  return `${STORAGE_KEY_PREFIX}${year}`
}

export function YearlyDataProvider({ year, children }: { year: number; children: React.ReactNode }) {
  const [data, setDataState] = useState<DashboardData>(initialData)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const load = async () => {
      try {
        const fromDb = await fetchYearlyDashboardData(year)
        setDataState(fromDb)
      } catch {
        setDataState(initialData)
      } finally {
        setIsHydrated(true)
      }
    }

    load()
  }, [year])

  const persist = useCallback((next: DashboardData) => {
    if (typeof window === 'undefined') return
    // localStorage backup (non-authoritative)
    try {
      window.localStorage.setItem(getStorageKey(year), JSON.stringify(next))
    } catch {}
  }, [year])

  const setData = useCallback(async (next: DashboardData) => {
    setDataState(next)
    persist(next)
    await saveYearlyDashboardData(year, next)
  }, [persist, year])

  const resetData = useCallback(async () => {
    setDataState(initialData)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(getStorageKey(year))
      } catch {
        // ignore
      }
    }
    await clearYearlyDashboardData(year)
  }, [year])

  const value = useMemo<YearlyDataContextType>(
    () => ({ year, data, setData, resetData, isHydrated }),
    [year, data, setData, resetData, isHydrated]
  )

  return <YearlyDataContext.Provider value={value}>{children}</YearlyDataContext.Provider>
}

