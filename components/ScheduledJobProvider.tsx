'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScheduledJobContext } from '@/context/ScheduledJobContext'
import type {
  ScheduledJobData,
  ScheduledJobSourceBundle,
  ScheduledJobSourceType,
} from '@/context/ScheduledJobContext'
import { emptyScheduledJobData } from '@/context/ScheduledJobContext'
import type { PaymentViewMode } from '@/context/PaymentShellContext'
import { mergeScheduledJobSources } from '@/lib/scheduledJobMerge'
import {
  loadScheduledJobDataLocal,
  saveScheduledJobDataLocal,
  saveScheduledJobSourceLocal,
} from '@/lib/scheduledJobStorage'

export function ScheduledJobProvider({
  mode,
  year,
  children,
}: {
  mode: PaymentViewMode
  year?: number
  children: React.ReactNode
}) {
  const [data, setDataState] = useState<ScheduledJobData>(emptyScheduledJobData())
  const [isLoading, setIsLoading] = useState(true)
  const storageYear = mode === 'yearly' ? year : undefined

  const mergedJobs = useMemo(() => mergeScheduledJobSources(data), [data])

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setIsLoading(true)
      try {
        const local = await loadScheduledJobDataLocal(mode, storageYear)
        if (!cancelled) setDataState(local)
      } catch (error) {
        console.error('Error loading scheduled job data:', error)
        if (!cancelled) setDataState(emptyScheduledJobData())
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      loadData()
    }

    return () => {
      cancelled = true
    }
  }, [mode, storageYear])

  const setData = useCallback(
    async (newData: ScheduledJobData) => {
      setDataState(newData)
      await saveScheduledJobDataLocal(mode, newData, storageYear)
    },
    [mode, storageYear]
  )

  const updateSource = useCallback(
    async (source: ScheduledJobSourceType, bundle: ScheduledJobSourceBundle) => {
      setDataState(prev => ({ ...prev, [source]: bundle }))
      return saveScheduledJobSourceLocal(mode, source, bundle, storageYear)
    },
    [mode, storageYear]
  )

  return (
    <ScheduledJobContext.Provider value={{ data, setData, updateSource, mergedJobs, isLoading }}>
      {children}
    </ScheduledJobContext.Provider>
  )
}
