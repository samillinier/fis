'use client'

import { useMemo } from 'react'
import { useData } from '@/context/DataContext'

interface StoreRow {
  store: string | number
  workroom: string
  sales: number
  laborPO: number
  vendorDebit: number
}

export default function StoreOverview() {
  const { data } = useData()

  const rows = useMemo<StoreRow[]>(() => {
    const byStore = new Map<string | number, StoreRow>()

    data.workrooms.forEach((w) => {
      const key = w.store || 'Unknown'
      const existing = byStore.get(key) || {
        store: key,
        workroom: w.name || 'Unknown',
        sales: 0,
        laborPO: 0,
        vendorDebit: 0,
      }

      byStore.set(key, {
        store: key,
        workroom: existing.workroom,
        sales: existing.sales + (w.sales || 0),
        laborPO: existing.laborPO + (w.laborPO || 0),
        vendorDebit: existing.vendorDebit + (w.vendorDebit || 0),
      })
    })

    return Array.from(byStore.values()).sort((a, b) => b.sales - a.sales)
  }, [data.workrooms])

  const formatCurrency = (value: number) =>
    value === 0 ? '$0' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-1">Store Overview</h2>
        <p className="text-sm text-gray-600">
          Aggregated sales and cost by store, with primary workroom assignment.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Store #</th>
                <th className="px-4 py-3 text-left font-semibold">Workroom</th>
                <th className="px-4 py-3 text-right font-semibold">Sales</th>
                <th className="px-4 py-3 text-right font-semibold">Labor PO</th>
                <th className="px-4 py-3 text-right font-semibold">Vendor Debit</th>
                <th className="px-4 py-3 text-right font-semibold">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const totalCost = row.laborPO + row.vendorDebit
                const margin = row.sales - totalCost
                const marginRate = totalCost > 0 ? margin / totalCost : 0

                let badgeClass = 'badge-neutral'
                if (marginRate > 0.4) badgeClass = 'badge-positive'
                else if (marginRate < 0.15) badgeClass = 'badge-warning'

                return (
                  <tr key={row.store} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{row.store}</td>
                    <td className="px-4 py-2">{row.workroom}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.sales)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.laborPO)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.vendorDebit)}</td>
                    <td className="px-4 py-2 text-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <span>{formatCurrency(totalCost)}</span>
                        <span className={`badge-pill ${badgeClass}`}>
                          {totalCost > 0 ? `${(marginRate * 100).toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                    Upload a T1/T2 scorecard to see store-level analytics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


