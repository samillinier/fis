'use client'

import { useRef, useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import { usePaymentData } from '@/context/PaymentContext'
import { savePaymentFileName } from '@/lib/database'
import { parsePaymentRows } from '@/lib/paymentParser'
import { PAYMENT_DATA_UPDATED_EVENT } from '@/lib/dashboardEvents'
import * as XLSX from 'xlsx'

const PAYMENT_UPLOAD_DATE_KEY = 'fis-payment-upload-date'
const LABEL = 'Payment Data (monthly)'

function saveStoredUploadDate(value: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (value) localStorage.setItem(PAYMENT_UPLOAD_DATE_KEY, value)
    else localStorage.removeItem(PAYMENT_UPLOAD_DATE_KEY)
  } catch {
    // ignore
  }
}

export default function PaymentFileUpload() {
  const { isAdmin, isOwner } = useAuth()
  const canViewUploadArea = isAdmin || isOwner
  const canEditUploads = isAdmin
  const { showNotification } = useNotification()
  const { data, setData, resetData } = usePaymentData()

  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const paymentCount = data.payments.length

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })
      const payments = parsePaymentRows(jsonData)

      if (payments.length === 0) {
        throw new Error('No payment records found in file')
      }

      const uploadedAtIso = new Date().toISOString()

      await setData({
        payments,
        fileName: file.name,
        uploadDate: uploadedAtIso,
      })

      await savePaymentFileName(file.name)
      saveStoredUploadDate(uploadedAtIso)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(PAYMENT_DATA_UPDATED_EVENT))
      }

      showNotification(
        `Successfully uploaded ${payments.length} payment records to cloud!`,
        'success'
      )
    } catch (error: any) {
      console.error('Payment upload error:', error)
      showNotification(`Error uploading payment data: ${error.message}`, 'error')
      await savePaymentFileName(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete all monthly payment data from the database?')) return

    setIsDeleting(true)
    try {
      await resetData()
      await savePaymentFileName(null)
      saveStoredUploadDate(null)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(PAYMENT_DATA_UPDATED_EVENT))
      }

      showNotification('Monthly payment data deleted', 'info')
    } catch (error: any) {
      console.error('Payment delete error:', error)
      showNotification(`Error deleting payment data: ${error.message}`, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!canViewUploadArea) return null

  return (
    <div className="border border-gray-200 rounded-md p-1.5 mb-1.5 bg-white">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-gray-800">{LABEL}</span>
        <div className="flex items-center gap-1.5">
          {paymentCount > 0 && (
            <span className="text-xs text-green-700">{paymentCount.toLocaleString()} rows</span>
          )}
          {canEditUploads && paymentCount > 0 && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="p-0.5 rounded text-red-600 hover:bg-red-50 disabled:opacity-40"
              title="Delete payment data"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleUpload}
        disabled={!canEditUploads || isUploading}
        className="hidden"
        id="payment-upload-input"
      />

      {canEditUploads ? (
        <label
          htmlFor="payment-upload-input"
          className={`block text-center text-xs py-1 px-2 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {isUploading ? 'Uploading...' : paymentCount > 0 ? 'Replace' : 'Upload Payment'}
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
