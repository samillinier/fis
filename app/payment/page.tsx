'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthContext'
import { PaymentProvider } from '@/components/PaymentProvider'
import { YearlyPaymentProvider } from '@/context/YearlyPaymentContext'
import {
  PaymentShellContext,
  type PaymentPageTab,
  type PaymentViewMode,
} from '@/context/PaymentShellContext'
import PaymentView from '@/components/PaymentView'
import PaymentExecutiveSummary from '@/components/PaymentExecutiveSummary'
import PaymentCategorySummary from '@/components/PaymentCategorySummary'
import PaymentWorkroomCategory from '@/components/PaymentWorkroomCategory'
import PaymentScheduledThisWeek from '@/components/PaymentScheduledThisWeek'
import PaymentScheduledNextWeek from '@/components/PaymentScheduledNextWeek'
import { ScheduledJobProvider } from '@/components/ScheduledJobProvider'
import { useScheduledJobData } from '@/context/ScheduledJobContext'
import { useActivePaymentData } from '@/lib/useActivePaymentData'

function PaymentPageInner({
  mode,
  setMode,
  year,
  setYear,
  tab,
  setTab,
}: {
  mode: PaymentViewMode
  setMode: (mode: PaymentViewMode) => void
  year: number
  setYear: (year: number) => void
  tab: PaymentPageTab
  setTab: (tab: PaymentPageTab) => void
}) {
  const { data } = useActivePaymentData()
  const { mergedJobs, isLoading: scheduledLoading } = useScheduledJobData()

  const yearOptions = useMemo(() => {
    const end = new Date().getFullYear()
    const start = end - 10
    const years: number[] = []
    for (let y = end; y >= start; y--) years.push(y)
    return years
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payment Tracking</h1>
          <p className="text-gray-600 mt-1">
            {mode === 'monthly'
              ? 'Current monthly payment file and live job exports (Install, Measure, Work Order).'
              : `Yearly archive for ${year} — payment file and job exports stored separately from monthly.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as PaymentViewMode)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="monthly">Monthly (Current)</option>
            <option value="yearly">Yearly Archive</option>
          </select>
          {mode === 'yearly' && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab('executive')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'executive'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Executive Summary
        </button>
        <button
          type="button"
          onClick={() => setTab('category')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'category'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Category Summary
        </button>
        <button
          type="button"
          onClick={() => setTab('workroomCategory')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'workroomCategory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Workroom × Category
        </button>
        {mode === 'monthly' && (
          <>
            <button
              type="button"
              onClick={() => setTab('scheduled')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === 'scheduled'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Scheduled This Week
            </button>
            <button
              type="button"
              onClick={() => setTab('nextWeek')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === 'nextWeek'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Scheduled Next Week
            </button>
          </>
        )}
      </div>

      {tab === 'overview' && <PaymentView />}
      {tab === 'executive' && <PaymentExecutiveSummary payments={data.payments} />}
      {tab === 'category' && <PaymentCategorySummary payments={data.payments} />}
      {tab === 'workroomCategory' && <PaymentWorkroomCategory payments={data.payments} />}
      {mode === 'monthly' && tab === 'scheduled' && (
        <PaymentScheduledThisWeek jobs={mergedJobs} isLoading={scheduledLoading} />
      )}
      {mode === 'monthly' && tab === 'nextWeek' && (
        <PaymentScheduledNextWeek jobs={mergedJobs} isLoading={scheduledLoading} />
      )}
    </div>
  )
}

function PaymentPageWithProviders() {
  const [mode, setMode] = useState<PaymentViewMode>('monthly')
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [tab, setTab] = useState<PaymentPageTab>('overview')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const rawMode = window.localStorage.getItem('fis-payment-view-mode')
      if (rawMode === 'monthly' || rawMode === 'yearly') setMode(rawMode)
      const rawYear = window.localStorage.getItem('fis-payment-selected-year')
      const parsed = rawYear ? Number(rawYear) : NaN
      if (!Number.isNaN(parsed)) setYear(parsed)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('fis-payment-view-mode', mode)
      window.localStorage.setItem('fis-payment-selected-year', String(year))
    } catch {
      // ignore
    }
  }, [mode, year])

  useEffect(() => {
    if (mode === 'yearly' && (tab === 'scheduled' || tab === 'nextWeek')) {
      setTab('overview')
    }
  }, [mode, tab])

  const shellValue = useMemo(() => ({ mode, year, activeTab: tab, setActiveTab: setTab }), [mode, year, tab])

  if (mode === 'yearly') {
    return (
      <PaymentShellContext.Provider value={shellValue}>
        <YearlyPaymentProvider year={year}>
          <ScheduledJobProvider mode="yearly" year={year}>
            <Layout>
              <PaymentPageInner
                mode={mode}
                setMode={setMode}
                year={year}
                setYear={setYear}
                tab={tab}
                setTab={setTab}
              />
            </Layout>
          </ScheduledJobProvider>
        </YearlyPaymentProvider>
      </PaymentShellContext.Provider>
    )
  }

  return (
    <PaymentShellContext.Provider value={shellValue}>
      <PaymentProvider>
        <ScheduledJobProvider mode="monthly">
          <Layout>
            <PaymentPageInner
              mode={mode}
              setMode={setMode}
              year={year}
              setYear={setYear}
              tab={tab}
              setTab={setTab}
            />
          </Layout>
        </ScheduledJobProvider>
      </PaymentProvider>
    </PaymentShellContext.Provider>
  )
}

export default function PaymentPage() {
  const { isAuthenticated, isLoading, isAdmin, isOwner } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    if (!isAdmin && !isOwner) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, isAdmin, isOwner, router])

  if (isLoading || !isAuthenticated || (!isAdmin && !isOwner)) {
    return null
  }

  return (
    <ProtectedRoute>
      <PaymentPageWithProviders />
    </ProtectedRoute>
  )
}
