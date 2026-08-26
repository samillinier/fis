'use client'

import { useMemo } from 'react'
import type { PaymentRecord } from '@/context/PaymentContext'
import { useScheduledJobData } from '@/context/ScheduledJobContext'
import { usePaymentShell } from '@/context/PaymentShellContext'
import {
  computeCategoryExecutiveSummary,
  computeStatusExecutiveSummary,
} from '@/lib/paymentExecutiveSummary'
import {
  computeCategoryExecutiveSummaryFromScheduledJobBundles,
  computeStatusExecutiveSummaryFromScheduledJobBundles,
  hasScheduledJobExportDataFromBundles,
} from '@/lib/scheduledJobExecutiveSummary'
import { formatPaymentCurrency } from '@/lib/paymentParser'

interface PaymentCategorySummaryProps {
  payments: PaymentRecord[]
}

export default function PaymentCategorySummary({ payments }: PaymentCategorySummaryProps) {
  const { data: scheduledJobData, isLoading: scheduledLoading } = useScheduledJobData()
  const { mode, year } = usePaymentShell()
  const useJobExports = hasScheduledJobExportDataFromBundles(scheduledJobData)
  const periodLabel = mode === 'yearly' ? `Yearly ${year}` : 'Monthly'

  const categoryRows = useMemo(() => {
    if (useJobExports) return computeCategoryExecutiveSummaryFromScheduledJobBundles(scheduledJobData)
    return computeCategoryExecutiveSummary(payments)
  }, [useJobExports, scheduledJobData, payments])

  const statusRows = useMemo(() => {
    if (useJobExports) return computeStatusExecutiveSummaryFromScheduledJobBundles(scheduledJobData)
    return computeStatusExecutiveSummary(payments)
  }, [useJobExports, scheduledJobData, payments])

  const statusTotals = useMemo(() => {
    return statusRows.reduce(
      (acc, row) => ({
        jobs: acc.jobs + row.jobs,
        labourValue: acc.labourValue + row.labourValue,
      }),
      { jobs: 0, labourValue: 0 }
    )
  }, [statusRows])

  const totals = useMemo(() => {
    return categoryRows.reduce(
      (acc, row) => ({
        jobs: acc.jobs + row.jobs,
        labourValue: acc.labourValue + row.labourValue,
        closed: acc.closed + row.closed,
        scheduled: acc.scheduled + row.scheduled,
        waitingForProduct: acc.waitingForProduct + row.waitingForProduct,
        readyToSchedule: acc.readyToSchedule + row.readyToSchedule,
        workComplete: acc.workComplete + row.workComplete,
        openJobs: acc.openJobs + row.openJobs,
        openLabor: acc.openLabor + row.openLabor,
      }),
      {
        jobs: 0,
        labourValue: 0,
        closed: 0,
        scheduled: 0,
        waitingForProduct: 0,
        readyToSchedule: 0,
        workComplete: 0,
        openJobs: 0,
        openLabor: 0,
      }
    )
  }, [categoryRows])

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
              <strong>{periodLabel}</strong> job exports (
              {scheduledJobData.measure.jobs.length.toLocaleString()} measure,{' '}
              {scheduledJobData.install.jobs.length.toLocaleString()} install,{' '}
              {scheduledJobData.workorder.jobs.length.toLocaleString()} work order rows). Status columns
              use each file&apos;s Job Status (Scheduled, WFP, Closed, etc.).
            </>
          ) : (
            <>
              Jobs are grouped by <strong>Labour Category</strong> from your payment file. Upload jobs exports for
              pipeline statuses (Scheduled, WFP, RTS).
            </>
          )}
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">By Job Category</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Category
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Jobs
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Labour Value
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Avg Job Value
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Closed
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Scheduled
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Waiting Product
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  RTS
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Work Complete
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Open Jobs
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Open Labor
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categoryRows.map((row, idx) => (
                <tr key={row.category} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.category}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.jobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.labourValue)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.avgJobValue)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.closed.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.scheduled.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.waitingForProduct.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.readyToSchedule.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.workComplete.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.openJobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.openLabor)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.shareOfTotal.toFixed(1)}%</td>
                </tr>
              ))}
              {categoryRows.length > 0 && (
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-3 py-2 text-gray-900">Total</td>
                  <td className="px-3 py-2 text-right">{totals.jobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{formatPaymentCurrency(totals.labourValue)}</td>
                  <td className="px-3 py-2 text-right">
                    {formatPaymentCurrency(totals.jobs > 0 ? totals.labourValue / totals.jobs : 0)}
                  </td>
                  <td className="px-3 py-2 text-right">{totals.closed.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{totals.scheduled.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{totals.waitingForProduct.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{totals.readyToSchedule.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{totals.workComplete.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{totals.openJobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{formatPaymentCurrency(totals.openLabor)}</td>
                  <td className="px-3 py-2 text-right">100.0%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {categoryRows.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No category data to display.</div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Status Summary</h3>
          <p className="text-xs text-gray-500 mt-1">
            {useJobExports
              ? 'Counts each measure / install / work order row by its Job Status from the export files.'
              : 'Each job is assigned one primary status so labour share totals 100%.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Jobs
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Labour Value
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Avg Job Value
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statusRows.map((row, idx) => (
                <tr key={row.status} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.label}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.jobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.labourValue)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.avgJobValue)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.shareOfTotal.toFixed(1)}%</td>
                </tr>
              ))}
              {statusRows.length > 0 && (
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-3 py-2 text-gray-900">Total</td>
                  <td className="px-3 py-2 text-right">{statusTotals.jobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{formatPaymentCurrency(statusTotals.labourValue)}</td>
                  <td className="px-3 py-2 text-right">
                    {formatPaymentCurrency(
                      statusTotals.jobs > 0 ? statusTotals.labourValue / statusTotals.jobs : 0
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">100.0%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
