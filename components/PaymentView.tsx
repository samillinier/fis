'use client'

import { useMemo, useState } from 'react'
import { useActivePaymentData } from '@/lib/useActivePaymentData'
import {
  PAYMENT_COLUMNS,
  getPaymentAmount,
  formatPaymentCurrency,
  formatPaymentDate,
  type PaymentFieldKey,
} from '@/lib/paymentParser'

export default function PaymentView() {
  const { data, isLoading } = useActivePaymentData()
  const { payments } = data
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<PaymentFieldKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: PaymentFieldKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredPayments = useMemo(() => {
    let result = [...payments]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        Object.values(p).some(v => v != null && String(v).toLowerCase().includes(q))
      )
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey] ?? ''
        const bVal = b[sortKey] ?? ''
        let cmp = 0
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal
        } else {
          cmp = String(aVal).localeCompare(String(bVal))
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [payments, search, sortKey, sortDir])

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + getPaymentAmount(p), 0)
  }, [payments])

  const uniqueInstallers = useMemo(() => {
    return new Set(payments.map(p => p.installerName).filter(Boolean)).size
  }, [payments])

  const uniqueStores = useMemo(() => {
    return new Set(payments.map(p => p.store).filter(Boolean)).size
  }, [payments])

  const formatCell = (key: PaymentFieldKey, value: unknown): string => {
    if (value == null || value === '') return '—'
    if (key === 'amount' || key === 'checkAmount') {
      return formatPaymentCurrency(value)
    }
    if (key === 'checkDate' || key === 'createdOn') {
      return formatPaymentDate(value)
    }
    return String(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payment data from cloud...</div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg mb-2">No payment data available</p>
        <p className="text-gray-400 text-sm">
          Upload a payment debit details Excel file using the sidebar — data saves to Supabase cloud.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-sm px-4 py-4">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
            Total Invoices
          </div>
          <div className="text-3xl font-bold text-blue-900">{payments.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg shadow-sm px-4 py-4">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
            Total Amount Paid
          </div>
          <div className="text-3xl font-bold text-green-900">{formatPaymentCurrency(totalPaid)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg shadow-sm px-4 py-4">
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
            Installers
          </div>
          <div className="text-3xl font-bold text-purple-900">{uniqueInstallers}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg shadow-sm px-4 py-4">
          <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
            Stores
          </div>
          <div className="text-3xl font-bold text-orange-900">{uniqueStores}</div>
        </div>
      </div>

      {data.fileName && (
        <p className="text-xs text-gray-500">
          Cloud file: <span className="font-medium text-gray-700">{data.fileName}</span>
          {data.uploadDate && (
            <span className="ml-2">
              · Uploaded {new Date(data.uploadDate).toLocaleDateString()}
            </span>
          )}
        </p>
      )}

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by installer, customer, invoice..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-72"
        />
        <span className="text-sm text-gray-500">
          Showing {filteredPayments.length} of {payments.length} records
        </span>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {PAYMENT_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    title={`Column ${col.letter}`}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment, idx) => (
                <tr key={payment.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {PAYMENT_COLUMNS.map(col => (
                    <td
                      key={col.key}
                      className="px-2 py-1.5 whitespace-nowrap text-gray-700 max-w-[180px] truncate"
                    >
                      {formatCell(col.key, payment[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
