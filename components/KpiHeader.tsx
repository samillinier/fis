'use client'

import { useMemo } from 'react'
import { useData } from '@/context/DataContext'

export default function KpiHeader() {
  const { data } = useData()

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

  const kpis = useMemo(() => {
    const byWorkroom = new Map<
      string,
      { sales: number; cost: number; performanceIndex?: number; count: number }
    >()

    data.workrooms
      .filter((w) => isValidWorkroomName(w.name || ''))
      .forEach((w) => {
      const key = w.name || 'Unknown'
      const existing = byWorkroom.get(key) || {
        sales: 0,
        cost: 0,
        performanceIndex: undefined,
        count: 0,
      }

      const labor = typeof w.laborPO === 'number' ? w.laborPO : 0
      const vendor = typeof w.vendorDebit === 'number' ? w.vendorDebit : 0
      const cost = labor + vendor

      byWorkroom.set(key, {
        sales: existing.sales + (w.sales || 0),
        cost: existing.cost + cost,
        performanceIndex:
          typeof w.performanceIndex === 'number' ? w.performanceIndex : existing.performanceIndex,
        count: existing.count + 1,
      })
    })

    const rows = Array.from(byWorkroom.entries()).map(([name, v]) => ({
      name,
      sales: v.sales,
      cost: v.cost,
      margin: v.sales - v.cost,
      marginRate: v.cost > 0 ? (v.sales - v.cost) / v.cost : 0,
      performanceIndex: v.performanceIndex,
    }))

    const totalSales = rows.reduce((sum, r) => sum + r.sales, 0)
    const totalCost = rows.reduce((sum, r) => sum + r.cost, 0)
    const overallMarginRate = totalCost > 0 ? (totalSales - totalCost) / totalCost : 0

    const topBySales = [...rows].sort((a, b) => b.sales - a.sales)[0]
    const bestMargin = [...rows].sort((a, b) => b.marginRate - a.marginRate)[0]

    return {
      totalSales,
      totalCost,
      overallMarginRate,
      topBySales,
      bestMargin,
    }
  }, [data.workrooms])

  const formatCurrencyShort = (value: number) => {
    if (!value) return '$0'
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}k`
    }
    return `$${value.toLocaleString()}`
  }

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Portfolio Sales</div>
          <div className="kpi-value">{formatCurrencyShort(kpis.totalSales)}</div>
          <div className="kpi-sub">Total sales across all workrooms</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Cost (Labor + Vendor)</div>
          <div className="kpi-value">{formatCurrencyShort(kpis.totalCost)}</div>
          <div className="kpi-sub">Combined labor PO and vendor debits</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Overall Margin</div>
          <div className="kpi-value">
            {kpis.totalCost > 0 ? formatPercent(kpis.overallMarginRate) : '—'}
          </div>
          <div className="kpi-sub">
            <span className="badge-pill badge-positive">Health</span>{' '}
            {(kpis.topBySales?.name && `Top: ${kpis.topBySales.name}`) || 'No data yet'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Best Margin Workroom</div>
          <div className="kpi-value">
            {kpis.bestMargin?.name || '—'}
          </div>
          <div className="kpi-sub">
            {kpis.bestMargin
              ? `Margin ${formatPercent(kpis.bestMargin.marginRate)}`
              : 'Upload data to calculate'}
          </div>
        </div>
      </div>
    </section>
  )
}


