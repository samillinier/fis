'use client'

import { useMemo } from 'react'
import type { ScheduledJobRecord } from '@/context/ScheduledJobContext'
import {
  buildScheduledWeekRows,
  filterScheduledInWeek,
  getScheduledWeekLabel,
} from '@/lib/scheduledJobThisWeek'
import { formatPaymentCurrency } from '@/lib/paymentParser'

interface PaymentScheduledWeekProps {
  jobs: ScheduledJobRecord[]
  isLoading?: boolean
  weekOffset?: number
  title: string
  emptyMessage: string
  countLabel: string
}

function countScheduledStatusJobs(jobs: ScheduledJobRecord[]): number {
  return jobs.filter(job => {
    if (job.sourceSnapshots?.length) {
      return job.sourceSnapshots.some(
        s => String(s.jobStatus ?? '').trim().toLowerCase() === 'scheduled'
      )
    }
    return String(job.jobStatus ?? '').trim().toLowerCase() === 'scheduled'
  }).length
}

export default function PaymentScheduledWeek({
  jobs,
  isLoading,
  weekOffset = 0,
  title,
  emptyMessage,
  countLabel,
}: PaymentScheduledWeekProps) {
  const weekLabel = useMemo(() => getScheduledWeekLabel(new Date(), weekOffset), [weekOffset])
  const rows = useMemo(() => buildScheduledWeekRows(jobs, weekOffset), [jobs, weekOffset])

  const totals = useMemo(() => {
    const scheduled = filterScheduledInWeek(jobs, new Date(), weekOffset)
    return {
      count: scheduled.length,
      labor: scheduled.reduce((sum, job) => sum + (job.laborAmount ?? 0), 0),
    }
  }, [jobs, weekOffset])

  const totalScheduledInFile = useMemo(() => countScheduledStatusJobs(jobs), [jobs])

  const emptyDetail =
    jobs.length > 0 && totals.count === 0
      ? `Your file has ${totalScheduledInFile.toLocaleString()} jobs with status Scheduled, but none have a due date in ${weekLabel}.`
      : emptyMessage

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center text-gray-500">
        Loading scheduled jobs...
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center text-gray-500">
        Upload a jobs export file for Install, Measure, or Work Order from the sidebar. Files sync by job Id.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3">
        <p className="text-sm text-gray-600">
          Showing jobs with status <strong>Scheduled</strong> and due date in {countLabel} ({weekLabel}).
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {totals.count.toLocaleString()} scheduled jobs · {formatPaymentCurrency(totals.labor)} total labour
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Task Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Due Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Workroom
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Store
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  District
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Category
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Labour Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Job Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Customer Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Crew Lead
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Store Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{row.taskType}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{row.dueDate}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.workroom}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{row.store}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{row.district}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{row.category}</td>
                  <td className="px-3 py-2 text-right text-gray-800 whitespace-nowrap">{row.laborAmountDisplay}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{row.jobStatus}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{row.customerName}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{row.crewLead}</td>
                  <td className="px-3 py-2 text-gray-800 max-w-xs truncate" title={row.storeLocation}>
                    {row.storeLocation}
                  </td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-3 py-2 text-gray-900" colSpan={6}>
                    Total ({rows.length} jobs)
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">{formatPaymentCurrency(totals.labor)}</td>
                  <td className="px-3 py-2" colSpan={4} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">{emptyDetail}</div>
        )}
      </section>
    </div>
  )
}
