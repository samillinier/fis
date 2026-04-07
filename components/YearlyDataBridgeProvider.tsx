'use client'

import { useCallback, useMemo } from 'react'
import { DataContext } from '@/context/DataContext'
import { useYearlyData } from '@/context/YearlyDataContext'
import type { DashboardData } from '@/context/DataContext'

/**
 * Bridges the isolated Yearly dataset into the existing `useData()` consumers.
 * This lets us reuse `VisualBreakdown` + `SurveyMisc` without copy/paste.
 */
export default function YearlyDataBridgeProvider({ children }: { children: React.ReactNode }) {
  const { data, setData } = useYearlyData()

  const bridgedSetData = useCallback(async (next: DashboardData) => {
    await setData(next)
  }, [setData])

  const value = useMemo(() => ({ data, setData: bridgedSetData }), [data, bridgedSetData])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

