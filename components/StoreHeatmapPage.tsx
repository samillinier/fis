'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import StoreHeatmap from '@/components/StoreHeatmap'
import { useAuth } from '@/components/AuthContext'
import {
  loadCycleTimeDataset,
  type CycleTimeStoreRecord,
  type CycleTimeVariant,
} from '@/lib/cycleTimeData'
import { fetchCycleTimeData } from '@/lib/database'
import Link from 'next/link'

export default function StoreHeatmapPage() {
  const { isAuthenticated, isLoading, isAdmin, isOwner } = useAuth()
  const router = useRouter()
  const canAccess = isAdmin || isOwner

  const [variant, setVariant] = useState<CycleTimeVariant>('ytd')
  const [ytdRecords, setYtdRecords] = useState<CycleTimeStoreRecord[]>([])
  const [lyRecords, setLyRecords] = useState<CycleTimeStoreRecord[]>([])
  const [ytdMeta, setYtdMeta] = useState<{ fileName: string | null; uploadedAt: string | null }>({
    fileName: null,
    uploadedAt: null,
  })
  const [lyMeta, setLyMeta] = useState<{ fileName: string | null; uploadedAt: string | null }>({
    fileName: null,
    uploadedAt: null,
  })
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    if (!canAccess) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, canAccess, router])

  useEffect(() => {
    if (!canAccess || isLoading || !isAuthenticated) return

    let cancelled = false
    const load = async () => {
      setIsLoadingData(true)
      setError(null)
      try {
        const [ytdCloud, lyCloud] = await Promise.all([
          fetchCycleTimeData('ytd'),
          fetchCycleTimeData('ly'),
        ])
        if (cancelled) return

        const ytdLocal = loadCycleTimeDataset('ytd')
        const lyLocal = loadCycleTimeDataset('ly')

        const ytd =
          ytdCloud.records.length > 0
            ? (ytdCloud.records as CycleTimeStoreRecord[])
            : ytdLocal.records
        const ly =
          lyCloud.records.length > 0
            ? (lyCloud.records as CycleTimeStoreRecord[])
            : lyLocal.records

        setYtdRecords(ytd)
        setLyRecords(ly)
        setYtdMeta({
          fileName: ytdCloud.fileName || ytdLocal.fileName,
          uploadedAt: ytdCloud.uploadedAt || ytdLocal.uploadedAt,
        })
        setLyMeta({
          fileName: lyCloud.fileName || lyLocal.fileName,
          uploadedAt: lyCloud.uploadedAt || lyLocal.uploadedAt,
        })
      } catch (err) {
        if (!cancelled) {
          const ytdLocal = loadCycleTimeDataset('ytd')
          const lyLocal = loadCycleTimeDataset('ly')
          setYtdRecords(ytdLocal.records)
          setLyRecords(lyLocal.records)
          setYtdMeta({ fileName: ytdLocal.fileName, uploadedAt: ytdLocal.uploadedAt })
          setLyMeta({ fileName: lyLocal.fileName, uploadedAt: lyLocal.uploadedAt })
          setError(err instanceof Error ? err.message : 'Failed to load cycle time data')
        }
      } finally {
        if (!cancelled) setIsLoadingData(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [canAccess, isLoading, isAuthenticated])

  if (isLoading || !isAuthenticated || !canAccess) {
    return null
  }

  const activeRecords = variant === 'ytd' ? ytdRecords : lyRecords
  const compareRecords = variant === 'ytd' ? lyRecords : ytdRecords
  const activeMeta = variant === 'ytd' ? ytdMeta : lyMeta
  const periodLabel = variant === 'ytd' ? 'Cycle Time YTD' : 'Cycle Time LY'
  const compareLabel = variant === 'ytd' ? 'LY' : 'YTD'

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Store Heatmap
              </h1>
              <p style={{ margin: '0.35rem 0 0', fontSize: 13, color: '#6b7280', maxWidth: 560 }}>
                73 Lowe&apos;s stores in 13 estimator clusters — detail volume, cycle times, and
                estimator needs. Uses Cycle Time uploads (not workroom POD data).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-md border border-gray-200 bg-white p-0.5"
                role="tablist"
              >
                {([
                  { id: 'ytd' as const, label: 'YTD', count: ytdRecords.length },
                  { id: 'ly' as const, label: 'LY', count: lyRecords.length },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={variant === tab.id}
                    onClick={() => setVariant(tab.id)}
                    className="rounded px-3 py-1.5 text-sm font-medium"
                    style={{
                      background: variant === tab.id ? '#111827' : 'transparent',
                      color: variant === tab.id ? '#fff' : '#4b5563',
                    }}
                  >
                    {tab.label}
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        opacity: 0.75,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {activeMeta.fileName && (
                <div className="text-xs text-gray-500 border border-gray-200 rounded-md px-2 py-1.5 bg-white max-w-[200px] truncate">
                  {activeMeta.fileName}
                  {activeMeta.uploadedAt && (
                    <span className="text-gray-400">
                      {' '}
                      · {new Date(activeMeta.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoadingData ? (
            <section className="compact-section">
              <div
                style={{
                  minHeight: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: 14,
                }}
              >
                Loading store heatmap…
              </div>
            </section>
          ) : activeRecords.length === 0 ? (
            <section className="compact-section">
              <div
                style={{
                  minHeight: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: '#6b7280',
                  fontSize: 14,
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <div>
                  No {periodLabel} data yet. Upload the cycle time file on the Cycle Time page
                  first.
                </div>
                <Link
                  href={variant === 'ytd' ? '/cycle-time' : '/cycle-time-ly'}
                  className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Open {periodLabel}
                </Link>
              </div>
            </section>
          ) : (
            <StoreHeatmap
              records={activeRecords}
              compareRecords={compareRecords}
              periodLabel={periodLabel}
              compareLabel={compareLabel}
              variant={variant}
            />
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
