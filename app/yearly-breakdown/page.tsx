'use client'

import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import VisualBreakdown from '@/components/VisualBreakdown'
import SurveyMisc from '@/components/SurveyMisc'
import { YearlyDataProvider } from '@/context/YearlyDataContext'
import YearlyDataBridgeProvider from '@/components/YearlyDataBridgeProvider'
import { useFilters } from '@/components/FilterContext'
import { Star } from 'lucide-react'

type Tab = 'visual' | 'survey'

export default function YearlyBreakdownPage() {
  const { selectedWorkroom } = useFilters()
  const [tab, setTab] = useState<Tab>('visual')
  const currentYear = new Date().getFullYear()
  const maxSelectableYear = 2025
  const fallbackYear = Math.min(currentYear, maxSelectableYear)
  const yearOptions = useMemo(() => {
    const end = maxSelectableYear
    const start = end - 10
    const years: number[] = []
    for (let y = end; y >= start; y--) years.push(y)
    return years
  }, [maxSelectableYear])

  const [year, setYear] = useState<number>(() => {
    // Initialize from localStorage so the correct year shows instantly (no flicker).
    if (typeof window === 'undefined') return fallbackYear
    try {
      const defaultRaw = window.localStorage.getItem('fis-yearly-default-year')
      const defaultParsed = defaultRaw ? Number(defaultRaw) : NaN
      if (!isNaN(defaultParsed) && defaultParsed <= maxSelectableYear) return defaultParsed

      const raw = window.localStorage.getItem('fis-yearly-selected-year')
      const parsed = raw ? Number(raw) : NaN
      if (!isNaN(parsed) && parsed <= maxSelectableYear) return parsed
    } catch {
      // ignore
    }
    return fallbackYear
  })

  const [defaultYear, setDefaultYear] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem('fis-yearly-default-year')
      const parsed = raw ? Number(raw) : NaN
      return !isNaN(parsed) && parsed <= maxSelectableYear ? parsed : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('fis-yearly-selected-year', String(year))
    } catch {
      // ignore
    }
  }, [year])

  return (
    <ProtectedRoute>
      <YearlyDataProvider year={year}>
        <YearlyDataBridgeProvider>
          <Layout>
            <div className="space-y-6">
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-2 py-2 text-sm bg-white"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          window.localStorage.setItem('fis-yearly-default-year', String(year))
                        } catch {
                          // ignore
                        }
                        setDefaultYear(year)
                      }}
                      className={`inline-flex items-center justify-center rounded-md border px-2 py-2 transition-colors ${
                        defaultYear === year
                          ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      title={defaultYear === year ? 'Default year' : 'Set as default year'}
                      aria-label={defaultYear === year ? 'Default year' : 'Set as default year'}
                    >
                      <Star size={16} fill={defaultYear === year ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setTab('visual')}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        tab === 'visual' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('survey')}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        tab === 'survey' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Survey
                    </button>
                  </div>
                </div>
              </div>

              {tab === 'visual' ? (
                <VisualBreakdown selectedWorkroom={selectedWorkroom} hiddenWorkrooms={['197', '998']} />
              ) : (
                <SurveyMisc />
              )}
            </div>
          </Layout>
        </YearlyDataBridgeProvider>
      </YearlyDataProvider>
    </ProtectedRoute>
  )
}

