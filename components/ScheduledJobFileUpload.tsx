'use client'

import { useRef, useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import {
  useScheduledJobData,
  SCHEDULED_JOB_SOURCE_LABELS,
  type ScheduledJobSourceType,
} from '@/context/ScheduledJobContext'
import { getScheduledJobSyncSummary } from '@/lib/scheduledJobMerge'
import { parseScheduledJobRows } from '@/lib/scheduledJobParser'
import { usePaymentShell } from '@/context/PaymentShellContext'
import * as XLSX from 'xlsx'

const SOURCE_JOB_TYPE_HINT: Record<ScheduledJobSourceType, string> = {
  install: 'INSTALL',
  measure: 'MEASURE',
  workorder: 'WORK ORDER',
}

async function parseSingleFile(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })
  return parseScheduledJobRows(jsonData)
}

function SourceUploadSlot({
  source,
  label,
  jobCount,
  canEdit,
  isUploading,
  isDeleting,
  onUpload,
  onDelete,
}: {
  source: ScheduledJobSourceType
  label: string
  jobCount: number
  canEdit: boolean
  isUploading: boolean
  isDeleting: boolean
  onUpload: (source: ScheduledJobSourceType, file: File) => Promise<void>
  onDelete: (source: ScheduledJobSourceType) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = `scheduled-job-upload-${source}`

  return (
    <div className="border border-gray-200 rounded-md p-1.5 mb-1.5 bg-white">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-gray-800">{label}</span>
        <div className="flex items-center gap-1.5">
          {jobCount > 0 && (
            <span className="text-xs text-green-700">{jobCount.toLocaleString()} rows</span>
          )}
          {canEdit && jobCount > 0 && (
            <button
              type="button"
              onClick={() => onDelete(source)}
              disabled={isUploading || isDeleting}
              className="p-0.5 rounded text-red-600 hover:bg-red-50 disabled:opacity-40"
              title={`Delete ${label} data`}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={async e => {
          const file = e.target.files?.[0]
          if (!file) return
          await onUpload(source, file)
          if (inputRef.current) inputRef.current.value = ''
        }}
        disabled={!canEdit || isUploading}
        className="hidden"
        id={inputId}
      />

      {canEdit ? (
        <label
          htmlFor={inputId}
          className={`block text-center text-xs py-1 px-2 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {isUploading ? 'Uploading...' : jobCount > 0 ? 'Replace' : `Upload ${label}`}
        </label>
      ) : (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Lock size={12} />
          Admin only
        </div>
      )}
    </div>
  )
}

export default function ScheduledJobFileUpload() {
  const { isAdmin, isOwner } = useAuth()
  const canViewUploadArea = isAdmin || isOwner
  const canEditUploads = isAdmin
  const { showNotification } = useNotification()
  const { data, updateSource } = useScheduledJobData()
  const { mode, year } = usePaymentShell()
  const [uploadingSource, setUploadingSource] = useState<ScheduledJobSourceType | null>(null)
  const [deletingSource, setDeletingSource] = useState<ScheduledJobSourceType | null>(null)

  const summary = getScheduledJobSyncSummary(data)

  const handleUpload = async (source: ScheduledJobSourceType, file: File) => {
    setUploadingSource(source)
    try {
      let jobs = await parseSingleFile(file)
      jobs = jobs.map(job => ({
        ...job,
        jobType: job.jobType || SOURCE_JOB_TYPE_HINT[source],
      }))

      if (jobs.length === 0) {
        throw new Error(`No job records found in ${SCHEDULED_JOB_SOURCE_LABELS[source]} file`)
      }

      const uploadedAtIso = new Date().toISOString()
      const saved = await updateSource(source, {
        jobs,
        fileName: file.name,
        uploadDate: uploadedAtIso,
      })

      if (!saved) {
        throw new Error(`Could not save ${SCHEDULED_JOB_SOURCE_LABELS[source]} file locally. Try a smaller file or clear browser storage.`)
      }

      showNotification(
        `Saved ${jobs.length.toLocaleString()} ${SCHEDULED_JOB_SOURCE_LABELS[source]} jobs (${mode === 'yearly' ? `yearly ${year}` : 'monthly'})`,
        'success'
      )
    } catch (error: any) {
      showNotification(error?.message || 'Upload failed', 'error')
    } finally {
      setUploadingSource(null)
    }
  }

  const handleDelete = async (source: ScheduledJobSourceType) => {
    const label = SCHEDULED_JOB_SOURCE_LABELS[source]
    if (!confirm(`Delete all ${label} job data from local storage?`)) return

    setDeletingSource(source)
    try {
      const saved = await updateSource(source, { jobs: [] })
      if (!saved) {
        throw new Error(`Could not delete ${label} data`)
      }
      showNotification(`Deleted ${label} job data`, 'info')
    } catch (error: any) {
      showNotification(error?.message || 'Delete failed', 'error')
    } finally {
      setDeletingSource(null)
    }
  }

  if (!canViewUploadArea) return null

  return (
    <>
      {(summary.measure > 0 || summary.install > 0 || summary.workorder > 0) && (
        <div className="mb-1.5 px-1.5 py-1 bg-blue-50 border border-blue-100 rounded text-xs text-blue-900">
          {summary.mergedTotal.toLocaleString()} jobs synced
        </div>
      )}

      <SourceUploadSlot
        source="install"
        label={SCHEDULED_JOB_SOURCE_LABELS.install}
        jobCount={data.install.jobs.length}
        canEdit={canEditUploads}
        isUploading={uploadingSource === 'install'}
        isDeleting={deletingSource === 'install'}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />
      <SourceUploadSlot
        source="measure"
        label={SCHEDULED_JOB_SOURCE_LABELS.measure}
        jobCount={data.measure.jobs.length}
        canEdit={canEditUploads}
        isUploading={uploadingSource === 'measure'}
        isDeleting={deletingSource === 'measure'}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />
      <SourceUploadSlot
        source="workorder"
        label={SCHEDULED_JOB_SOURCE_LABELS.workorder}
        jobCount={data.workorder.jobs.length}
        canEdit={canEditUploads}
        isUploading={uploadingSource === 'workorder'}
        isDeleting={deletingSource === 'workorder'}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />
    </>
  )
}
