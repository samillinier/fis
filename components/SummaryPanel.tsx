'use client'

import { useMemo } from 'react'
import { useData } from '@/context/DataContext'

// Helper function to check if a workroom name is valid (not "Location #" or similar)
const isValidWorkroomName = (name: string): boolean => {
  const normalizedName = (name || '').toLowerCase().trim()
  return (
    normalizedName !== 'location #' &&
    normalizedName !== 'location' &&
    normalizedName !== '' &&
    !normalizedName.includes('location #')
  )
}

export default function SummaryPanel() {
  const { data } = useData()

  const summary = useMemo(() => {
    const validWorkrooms = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))
    const totalWorkrooms = validWorkrooms.length
    const uniqueStores = new Set(validWorkrooms.map((w) => w.store)).size

    let totalSales = 0
    let totalLaborPO = 0
    let totalVendorDebit = 0
    let cycleTimeSum = 0
    let cycleTimeCount = 0

    validWorkrooms.forEach((w) => {
      if (typeof w.sales === 'number') totalSales += w.sales
      if (typeof w.laborPO === 'number') totalLaborPO += w.laborPO
      if (typeof w.vendorDebit === 'number') totalVendorDebit += w.vendorDebit
      if (typeof w.cycleTime === 'number') {
        cycleTimeSum += w.cycleTime
        cycleTimeCount += 1
      }
    })

    const avgCycleTime = cycleTimeCount > 0 ? cycleTimeSum / cycleTimeCount : 0

    return {
      totalWorkrooms,
      uniqueStores,
      totalSales,
      totalLaborPO,
      totalVendorDebit,
      avgCycleTime,
    }
  }, [data.workrooms])

  const formatCurrency = (value: number) =>
    value === 0 ? '$0' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const formatNumber = (value: number, digits = 1) =>
    value.toLocaleString(undefined, { maximumFractionDigits: digits })

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        Overall Workroom Summary
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1rem',
          maxWidth: '100%',
        }}
      >
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Workrooms
          </div>
          <div className="mt-2 text-2xl font-bold">{summary.totalWorkrooms}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Different Stores
          </div>
          <div className="mt-2 text-2xl font-bold">{summary.uniqueStores}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Sales
          </div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(summary.totalLaborPO)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Vendor Debits
          </div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(summary.totalVendorDebit)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Sales
          </div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(summary.totalSales)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Avg Cycle Time (days)
          </div>
          <div className="mt-2 text-2xl font-bold">
            {summary.avgCycleTime ? formatNumber(summary.avgCycleTime) : '—'}
          </div>
        </div>
      </div>
    </section>
  )
}


