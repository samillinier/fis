'use client'

import { useMemo } from 'react'
import type { PaymentRecord } from '@/context/PaymentContext'
import { useScheduledJobData } from '@/context/ScheduledJobContext'
import { usePaymentShell } from '@/context/PaymentShellContext'
import {
  computeWorkroomCategoryPivot,
  computeWorkroomCategoryPivotFromScheduledJobBundles,
  sumWorkroomCategoryRows,
  type WorkroomCategoryRow,
} from '@/lib/paymentWorkroomCategory'
import { hasScheduledJobExportDataFromBundles } from '@/lib/scheduledJobExecutiveSummary'
import { formatPaymentCurrency } from '@/lib/paymentParser'

interface PaymentWorkroomCategoryProps {
  payments: PaymentRecord[]
}

function formatJobs(value: number): string {
  return value > 0 ? value.toLocaleString() : '—'
}

function formatLabour(value: number): string {
  return value > 0 ? formatPaymentCurrency(value) : '—'
}

function DataRow({
  row,
  bold,
  stripe,
}: {
  row: WorkroomCategoryRow
  bold?: boolean
  stripe?: boolean
}) {
  const cell = bold ? 'font-semibold text-gray-900' : 'text-gray-800'
  return (
    <tr className={bold ? 'bg-gray-100 font-semibold' : stripe ? 'bg-gray-50' : 'bg-white'}>
      <td className={`px-3 py-2 whitespace-nowrap ${bold ? 'text-gray-900' : 'font-medium text-gray-900'}`}>
        {row.workroom}
      </td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatJobs(row.vinylJobs)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatJobs(row.carpetJobs)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatJobs(row.hardwoodLaminateJobs)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatJobs(row.lprFlooringJobs)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatLabour(row.vinylLabour)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatLabour(row.carpetLabour)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatLabour(row.hardwoodLaminateLabour)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatLabour(row.ceramicTileLabour)}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{row.totalJobs.toLocaleString()}</td>
      <td className={`px-3 py-2 text-right ${cell}`}>{formatPaymentCurrency(row.totalLabour)}</td>
    </tr>
  )
}

export default function PaymentWorkroomCategory({ payments }: PaymentWorkroomCategoryProps) {
  const { data: scheduledJobData, isLoading: scheduledLoading } = useScheduledJobData()
  const { mode, year } = usePaymentShell()
  const useJobExports = hasScheduledJobExportDataFromBundles(scheduledJobData)
  const periodLabel = mode === 'yearly' ? `Yearly ${year}` : 'Monthly'

  const rows = useMemo(() => {
    if (useJobExports) return computeWorkroomCategoryPivotFromScheduledJobBundles(scheduledJobData)
    return computeWorkroomCategoryPivot(payments)
  }, [useJobExports, scheduledJobData, payments])

  const totals = useMemo(() => sumWorkroomCategoryRows(rows), [rows])

  if (scheduledLoading && !useJobExports && payments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center text-gray-500">
        Loading jobs export data…
      </div>
    )
  }

  if (!useJobExports && payments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center text-gray-500">
        Upload jobs exports (Install, Measure, Work Order) in the sidebar, or upload a payment file.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3">
        <p className="text-sm text-gray-600">
          {useJobExports ? (
            <>
              <strong>{periodLabel}</strong> job exports. Jobs and labour are grouped by{' '}
              <strong>workroom</strong> (from store mapping) and <strong>Labor Category</strong>.
            </>
          ) : (
            <>
              Jobs and labour are grouped by <strong>workroom</strong> (from store mapping) and{' '}
              <strong>Labour Category</strong> (column K). Job counts are unique Associated Job IDs.
            </>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Categories map from values like FLOOR - VINYL, FLOOR - CARPET, FLOOR - HWOOD/ LAMINATE, FLOOR - CERAMIC TILE.
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Workroom × Category</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th
                  rowSpan={2}
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-r border-gray-200"
                >
                  Workroom
                </th>
                <th
                  colSpan={4}
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                >
                  Jobs
                </th>
                <th
                  colSpan={4}
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                >
                  Labour Value
                </th>
                <th
                  colSpan={2}
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Totals
                </th>
              </tr>
              <tr>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Vinyl
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Carpet
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Hardwood / Laminate
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-r border-gray-200">
                  LPR Flooring
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Vinyl
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Carpet
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Hardwood / Laminate
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-r border-gray-200">
                  Ceramic Tile
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Total Jobs
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Total Labour
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => (
                <DataRow key={row.workroom} row={row} stripe={idx % 2 === 1} />
              ))}
              {rows.length > 0 && <DataRow row={totals} bold />}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No workroom × category data to display.</div>
        )}
      </section>
    </div>
  )
}
