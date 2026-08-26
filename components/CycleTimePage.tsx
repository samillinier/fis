'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import CycleTimeBreakdown from '@/components/CycleTimeBreakdown'
import { useAuth } from '@/components/AuthContext'
import {
  clearCycleTimeDataset,
  loadCycleTimeDataset,
  parseCycleTimeWorkbook,
  saveCycleTimeDataset,
  type CycleTimeStoreRecord,
  type CycleTimeVariant,
} from '@/lib/cycleTimeData'
import {
  clearCycleTimeData,
  fetchCycleTimeData,
  saveCycleTimeData,
} from '@/lib/database'
import { Upload, Trash2, FileSpreadsheet } from 'lucide-react'

interface CycleTimePageProps {
  variant: CycleTimeVariant
  emptyHint?: string
}

export default function CycleTimePage({
  variant,
  emptyHint = 'Upload a cycle time report to see heatmap visualization.',
}: CycleTimePageProps) {
  const { isAuthenticated, isLoading, isAdmin, isOwner } = useAuth()
  const router = useRouter()
  const canAccess = isAdmin || isOwner

  const [records, setRecords] = useState<CycleTimeStoreRecord[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadedAt, setUploadedAt] = useState<string | null>(null)
  const [selectedWorkroom, setSelectedWorkroom] = useState('all')
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        const cloud = await fetchCycleTimeData(variant)
        if (cancelled) return

        if (cloud.records.length > 0) {
          setRecords(cloud.records as CycleTimeStoreRecord[])
          setFileName(cloud.fileName)
          setUploadedAt(cloud.uploadedAt)
          // Keep local cache in sync for faster reloads
          if (cloud.fileName) {
            saveCycleTimeDataset(cloud.records as CycleTimeStoreRecord[], cloud.fileName, variant)
          }
        } else {
          const local = loadCycleTimeDataset(variant)
          setRecords(local.records)
          setFileName(local.fileName)
          setUploadedAt(local.uploadedAt)
          // If local has data but cloud is empty, push local up once
          if (local.records.length > 0 && local.fileName) {
            await saveCycleTimeData(variant, local.records, local.fileName)
          }
        }
      } catch (err) {
        if (!cancelled) {
          const local = loadCycleTimeDataset(variant)
          setRecords(local.records)
          setFileName(local.fileName)
          setUploadedAt(local.uploadedAt)
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
  }, [variant, canAccess, isLoading, isAuthenticated])

  const workrooms = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.workroom).filter(Boolean))).sort()
  }, [records])

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseCycleTimeWorkbook(buffer)
      saveCycleTimeDataset(parsed, file.name, variant)

      const savedCloud = await saveCycleTimeData(variant, parsed, file.name)
      if (!savedCloud) {
        throw new Error('Saved locally, but cloud upload failed. Check admin access / database table.')
      }

      const cloud = await fetchCycleTimeData(variant)
      setRecords((cloud.records.length > 0 ? cloud.records : parsed) as CycleTimeStoreRecord[])
      setFileName(cloud.fileName || file.name)
      setUploadedAt(cloud.uploadedAt || new Date().toISOString())
      setSelectedWorkroom('all')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClear = async () => {
    setError(null)
    clearCycleTimeDataset(variant)
    const cleared = await clearCycleTimeData(variant)
    if (!cleared) {
      setError('Failed to clear cloud data')
      return
    }
    setRecords([])
    setFileName(null)
    setUploadedAt(null)
    setSelectedWorkroom('all')
  }

  if (isLoading || !isAuthenticated || !canAccess) {
    return null
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex flex-wrap items-center gap-3">
              {workrooms.length > 0 && (
                <select
                  value={selectedWorkroom}
                  onChange={(e) => setSelectedWorkroom(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-2 text-sm bg-white"
                >
                  <option value="all">All workrooms</option>
                  {workrooms.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              )}

              {(fileName || uploadedAt) && (
                <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-600">
                  <FileSpreadsheet size={14} />
                  <span className="font-medium text-gray-800 max-w-[160px] truncate">{fileName || 'Uploaded'}</span>
                  {uploadedAt && <span className="text-gray-400">{new Date(uploadedAt).toLocaleDateString()}</span>}
                  <span className="text-gray-400">· cloud</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                }}
              />

              <button
                type="button"
                disabled={isUploading || isLoadingData}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
              >
                <Upload size={16} />
                {isUploading ? 'Uploading…' : 'Upload'}
              </button>

              {records.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleClear()}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-2 text-gray-600 hover:bg-gray-50"
                  title="Clear uploaded data"
                >
                  <Trash2 size={16} />
                </button>
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
              <div className="compact-chart-container" style={{ minHeight: '240px', padding: '1rem' }}>
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
                  Loading cycle time data…
                </div>
              </div>
            </section>
          ) : records.length === 0 ? (
            <section className="compact-section">
              <div className="compact-chart-container" style={{ minHeight: '300px', padding: '1rem' }}>
                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
                  <div>{emptyHint}</div>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    <Upload size={16} />
                    Upload Excel
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <CycleTimeBreakdown records={records} selectedWorkroom={selectedWorkroom} />
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
