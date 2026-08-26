'use client'

import { useMemo } from 'react'
import type { PaymentRecord } from '@/context/PaymentContext'
import { useScheduledJobData } from '@/context/ScheduledJobContext'
import { usePaymentShell } from '@/context/PaymentShellContext'
import CountUpNumber from '@/components/CountUpNumber'
import {
  computeExecutiveSummary,
  computeWorkroomExecutiveSummary,
  EXECUTIVE_SUMMARY_METRICS,
  executiveSummaryPercent,
  type ExecutiveSummaryMetricConfig,
} from '@/lib/paymentExecutiveSummary'
import {
  computeExecutiveSummaryFromScheduledJobBundles,
  computeJobExportVolumeSummary,
  computeWorkroomExecutiveSummaryFromScheduledJobBundles,
  hasScheduledJobExportDataFromBundles,
} from '@/lib/scheduledJobExecutiveSummary'
import { formatPaymentCurrency } from '@/lib/paymentParser'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLOR_CLASSES: Record<ExecutiveSummaryMetricConfig['color'], { bg: string; border: string; text: string; bar: string }> = {
  blue: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-900', bar: '#3b82f6' },
  green: { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-900', bar: '#10b981' },
  purple: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-900', bar: '#8b5cf6' },
  orange: { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-900', bar: '#f97316' },
  amber: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', text: 'text-amber-900', bar: '#f59e0b' },
  teal: { bg: 'from-teal-50 to-teal-100', border: 'border-teal-200', text: 'text-teal-900', bar: '#14b8a6' },
  rose: { bg: 'from-rose-50 to-rose-100', border: 'border-rose-200', text: 'text-rose-900', bar: '#f43f5e' },
  slate: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-900', bar: '#64748b' },
}

const WORKROOM_CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b', '#f97316']

const JOB_EXPORT_VOLUME_CARDS = [
  {
    key: 'measureRows' as const,
    label: 'Measure',
    description: 'Rows in the Measure export file',
    color: 'teal' as const,
  },
  {
    key: 'installRows' as const,
    label: 'Install',
    description: 'Rows in the Install export file',
    color: 'blue' as const,
  },
  {
    key: 'workorderRows' as const,
    label: 'Work Order',
    description: 'Rows in the Work Order export file',
    color: 'purple' as const,
  },
]

function exportStatusDescription(key: ExecutiveSummaryMetricConfig['key']): string {
  switch (key) {
    case 'scheduled':
      return 'Export rows with Job Status = Scheduled'
    case 'closed':
      return 'Export rows with Job Status = Closed'
    case 'waitingForProduct':
      return 'Export rows with Job Status = Waiting for Product'
    case 'readyToSchedule':
      return 'Export rows with Job Status = Ready to Schedule'
    case 'workComplete':
      return 'Export rows with Job Status = Work Complete'
    case 'refunded':
      return 'Export rows with Job Status = Refunded'
    default:
      return ''
  }
}

function MetricCard({
  label,
  value,
  description,
  color,
  subtext,
}: {
  label: string
  value: number
  description: string
  color: ExecutiveSummaryMetricConfig['color']
  subtext?: string
}) {
  const colors = COLOR_CLASSES[color]
  return (
    <div
      className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg shadow-sm px-4 py-4 h-full flex flex-col min-h-[8.5rem]`}
    >
      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${colors.text} opacity-80`}>
        {label}
      </div>
      <div className={`text-3xl font-bold ${colors.text} mb-1 tabular-nums`}>
        <CountUpNumber value={value} duration={1.2} decimals={0} />
      </div>
      <div className="text-xs text-gray-600 mb-1 min-h-[1rem]">{subtext ?? '\u00A0'}</div>
      <div className="text-xs text-gray-500 leading-snug mt-auto">{description}</div>
    </div>
  )
}

interface PaymentExecutiveSummaryProps {
  payments: PaymentRecord[]
}

export default function PaymentExecutiveSummary({ payments }: PaymentExecutiveSummaryProps) {
  const { data: scheduledJobData, isLoading: scheduledLoading } = useScheduledJobData()
  const { mode, year } = usePaymentShell()
  const useJobExports = hasScheduledJobExportDataFromBundles(scheduledJobData)
  const periodLabel = mode === 'yearly' ? `Yearly ${year}` : 'Monthly'

  const metrics = useMemo(() => {
    if (useJobExports) return computeExecutiveSummaryFromScheduledJobBundles(scheduledJobData)
    return computeExecutiveSummary(payments)
  }, [useJobExports, scheduledJobData, payments])

  const volumeSummary = useMemo(() => {
    if (!useJobExports) return null
    return computeJobExportVolumeSummary(scheduledJobData)
  }, [useJobExports, scheduledJobData])

  const statusMetrics = useMemo(() => {
    return EXECUTIVE_SUMMARY_METRICS.filter(m => m.key !== 'totalJobs')
  }, [])

  const workroomRows = useMemo(() => {
    if (useJobExports) return computeWorkroomExecutiveSummaryFromScheduledJobBundles(scheduledJobData)
    return computeWorkroomExecutiveSummary(payments)
  }, [useJobExports, scheduledJobData, payments])

  const workroomTotals = useMemo(() => {
    return workroomRows.reduce(
      (acc, row) => ({
        jobs: acc.jobs + row.jobs,
        labourValue: acc.labourValue + row.labourValue,
        openJobs: acc.openJobs + row.openJobs,
        openLabor: acc.openLabor + row.openLabor,
      }),
      { jobs: 0, labourValue: 0, openJobs: 0, openLabor: 0 }
    )
  }, [workroomRows])

  const chartData = useMemo(() => {
    return statusMetrics.map(config => ({
      name: config.label,
      count: metrics[config.key],
      color: COLOR_CLASSES[config.color].bar,
    }))
  }, [metrics, statusMetrics])

  const workroomChartData = useMemo(() => {
    return workroomRows.map((row, index) => ({
      name: row.workroom,
      labourValue: row.labourValue,
      color: WORKROOM_CHART_COLORS[index % WORKROOM_CHART_COLORS.length],
    }))
  }, [workroomRows])

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
              <strong>{periodLabel}</strong> job exports. Status cards count rows by{' '}
              <strong>Job Status</strong> from each file (Measure, Install, Work Order).
            </>
          ) : (
            <>
              Job counts are based on unique <strong>Associated Job Id</strong> values from your{' '}
              <strong>{mode === 'yearly' ? `yearly ${year}` : 'monthly'}</strong> payment file.
              Status buckets are detected from Description, Status, and Type fields.
            </>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {useJobExports && volumeSummary
            ? `${volumeSummary.totalExportRows.toLocaleString()} total export rows`
            : `${metrics.totalInvoices} invoice rows · ${metrics.totalJobs} unique jobs`}
        </p>
      </div>

      {useJobExports && volumeSummary && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Export files</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {JOB_EXPORT_VOLUME_CARDS.map(card => (
              <MetricCard
                key={card.key}
                label={card.label}
                value={volumeSummary[card.key]}
                description={card.description}
                color={card.color}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {useJobExports ? 'Job status' : 'Summary'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!useJobExports &&
            EXECUTIVE_SUMMARY_METRICS.filter(m => m.key === 'totalJobs').map(config => (
              <MetricCard
                key={config.key}
                label={config.label}
                value={metrics[config.key]}
                description={config.description}
                color={config.color}
              />
            ))}
          {statusMetrics.map(config => {
            const showPct = !useJobExports && metrics.totalJobs > 0
            const description = useJobExports
              ? exportStatusDescription(config.key) || config.description
              : config.description

            return (
              <MetricCard
                key={config.key}
                label={config.label}
                value={metrics[config.key]}
                description={description}
                color={config.color}
                subtext={
                  showPct ? `${executiveSummaryPercent(metrics[config.key], metrics.totalJobs)} of jobs` : undefined
                }
              />
            )
          })}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Job Status Breakdown</h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-25}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(value: number) => [value, 'Jobs']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">By Workroom</h3>
          <p className="text-xs text-gray-500 mt-1">
            {useJobExports
              ? 'Jobs exports grouped by workroom using your workroom–store mapping.'
              : 'Payment records are grouped by workroom using your workroom–store mapping.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Workroom
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Labour Value
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Avg Job Value
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Open Jobs
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Open Labor
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Share of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workroomRows.map((row, idx) => (
                <tr key={row.workroom} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                    {row.workroom}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.jobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.labourValue)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.avgJobValue)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.openJobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{formatPaymentCurrency(row.openLabor)}</td>
                  <td className="px-3 py-2 text-right text-gray-800">{row.shareOfTotal.toFixed(1)}%</td>
                </tr>
              ))}
              {workroomRows.length > 0 && (
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-3 py-2 text-gray-900">Total</td>
                  <td className="px-3 py-2 text-right">{workroomTotals.jobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{formatPaymentCurrency(workroomTotals.labourValue)}</td>
                  <td className="px-3 py-2 text-right">
                    {formatPaymentCurrency(
                      workroomTotals.jobs > 0 ? workroomTotals.labourValue / workroomTotals.jobs : 0
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{workroomTotals.openJobs.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{formatPaymentCurrency(workroomTotals.openLabor)}</td>
                  <td className="px-3 py-2 text-right">100.0%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {workroomRows.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No workroom data to display.</div>
        )}
      </section>

      {workroomChartData.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Labour Value by Workroom</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workroomChartData} margin={{ top: 10, right: 20, bottom: 60, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(value: number) => [formatPaymentCurrency(value), 'Labour Value']} />
                <Bar dataKey="labourValue" radius={[4, 4, 0, 0]}>
                  {workroomChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}
