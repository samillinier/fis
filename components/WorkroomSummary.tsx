'use client'

import { useMemo } from 'react'
import { useData } from '@/context/DataContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import CountUpNumber from '@/components/CountUpNumber'

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

export default function WorkroomSummary() {
  const { data } = useData()

  const workroomSummary = useMemo(() => {
    const validWorkrooms = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))
    
    const workroomMap = new Map<
      string,
      {
        name: string
        stores: Set<string>
        records: number
        sales: number
        laborPO: number
        vendorDebit: number
        cycleTime: number
        cycleTimeCount: number
      }
    >()

    validWorkrooms.forEach((w) => {
      const existing = workroomMap.get(w.name) || {
        name: w.name || '',
        stores: new Set<string>(),
        records: 0,
        sales: 0,
        laborPO: 0,
        vendorDebit: 0,
        cycleTime: 0,
        cycleTimeCount: 0,
      }

      existing.stores.add(String(w.store))
      existing.records += 1
      existing.sales += w.sales || 0
      existing.laborPO += w.laborPO || 0
      existing.vendorDebit += w.vendorDebit || 0
      if (w.cycleTime != null && w.cycleTime > 0) {
        existing.cycleTime += w.cycleTime
        existing.cycleTimeCount += 1
      }

      workroomMap.set(w.name, existing)
    })

    return Array.from(workroomMap.entries())
      .map(([name, w]) => {
        const totalCost = w.laborPO + w.vendorDebit
        const margin = w.sales - totalCost
        const marginRate = totalCost > 0 ? (margin / totalCost) * 100 : 0
        const avgCycleTime = w.cycleTimeCount > 0 ? w.cycleTime / w.cycleTimeCount : 0
        const ltrPercent = w.sales > 0 ? (w.laborPO / w.sales) * 100 : 0

        return {
          name,
          stores: Array.from(w.stores),
          storesCount: w.stores.size,
          records: w.records,
          sales: w.sales,
          laborPO: w.laborPO,
          vendorDebit: w.vendorDebit,
          totalCost,
          margin,
          marginRate,
          avgCycleTime,
          ltrPercent,
        }
      })
      .sort((a, b) => b.sales - a.sales)
  }, [data.workrooms])

  const formatCurrency = (value: number) =>
    value === 0 ? '$0' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  const chartData = workroomSummary
    .slice(0, 15)
    .map((w) => ({
      name: w.name.length > 15 ? w.name.substring(0, 15) + '...' : w.name,
      fullName: w.name,
      sales: w.sales,
      cost: w.totalCost,
      margin: w.margin,
    }))

  const totalSales = workroomSummary.reduce((sum, w) => sum + w.sales, 0)
  const totalLaborCost = workroomSummary.reduce((sum, w) => sum + w.laborPO, 0)
  const totalVendorCost = workroomSummary.reduce((sum, w) => sum + w.vendorDebit, 0)
  const totalCost = totalLaborCost + totalVendorCost
  const totalMargin = totalSales - totalCost
  const overallMarginRate = totalCost > 0 ? (totalMargin / totalCost) * 100 : 0
  const totalJobCount = workroomSummary.reduce((sum, w) => sum + w.records, 0)

  // Category breakdown
  const categoryBreakdown = [
    {
      name: 'Sales',
      value: totalSales,
      color: '#4f46e5',
    },
    {
      name: 'Labor Cost',
      value: totalLaborCost,
      color: '#0f766e',
    },
    {
      name: 'Vendor Cost',
      value: totalVendorCost,
      color: '#f97316',
    },
  ].filter((cat) => cat.value > 0)

  const COLORS = ['#4f46e5', '#0f766e', '#f97316']

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Workroom Summary</h2>
        <p className="text-gray-600">Comprehensive overview of all workrooms</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sales</div>
          <div className="mt-2 text-2xl font-bold">
            <CountUpNumber
              value={totalSales}
              duration={1500}
              formatter={(val) => formatCurrency(val)}
            />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Labor Cost</div>
          <div className="mt-2 text-2xl font-bold">
            <CountUpNumber
              value={totalLaborCost}
              duration={1500}
              formatter={(val) => formatCurrency(val)}
            />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor Cost</div>
          <div className="mt-2 text-2xl font-bold">
            <CountUpNumber
              value={totalVendorCost}
              duration={1500}
              formatter={(val) => formatCurrency(val)}
            />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profit Margin</div>
          <div className="mt-2 text-2xl font-bold">
            <CountUpNumber
              value={totalMargin}
              duration={1500}
              formatter={(val) => formatCurrency(val)}
            />
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <CountUpNumber
              value={overallMarginRate}
              duration={1500}
              decimals={1}
              suffix="%"
            />
          </div>
        </div>
      </div>

      {/* Job Count and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Job Count */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Job Count</h3>
          <div className="text-4xl font-bold text-gray-900">
            <CountUpNumber
              value={totalJobCount}
              duration={1500}
              decimals={0}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">Total jobs across all workrooms</p>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <p>Upload data to see category breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sales vs Cost Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Sales vs Cost by Workroom (Top 15)</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#374151', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullName
                  }
                  return label
                }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#4f46e5" name="Sales ($)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="#f97316" name="Cost ($)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="margin" fill="#10b981" name="Margin ($)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <p>Upload a T1/T2 scorecard to see workroom summary data.</p>
          </div>
        )}
      </div>

      {/* Workroom Summary Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Workroom Details</h3>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table className="professional-table professional-table-zebra" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem' }}>Workroom</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Job Count</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Sales</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Labor Cost</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Vendor Cost</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Total Cost</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Profit Margin</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Margin %</th>
                <th align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>Store Association</th>
              </tr>
            </thead>
            <tbody>
              {workroomSummary.length > 0 ? (
                workroomSummary.map((workroom, index) => {
                  const marginBadgeClass =
                    workroom.marginRate > 30 ? 'badge-positive' :
                    workroom.marginRate > 10 ? 'badge-neutral' :
                    'badge-warning'

                  return (
                    <tr key={workroom.name}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{workroom.name}</td>
                      <td align="right" style={{ padding: '0.75rem', fontWeight: 600 }}>{workroom.records}</td>
                      <td align="right" style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(workroom.sales)}
                      </td>
                      <td align="right" style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(workroom.laborPO)}
                      </td>
                      <td align="right" style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(workroom.vendorDebit)}
                      </td>
                      <td align="right" style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatCurrency(workroom.totalCost)}
                      </td>
                      <td align="right" style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        <span className={`badge-pill ${marginBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', display: 'inline-block' }}>
                          {formatCurrency(workroom.margin)}
                        </span>
                      </td>
                      <td align="right" style={{ padding: '0.75rem' }}>
                        <span className={`badge-pill ${marginBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', display: 'inline-block' }}>
                          {formatPercent(workroom.marginRate)}
                        </span>
                      </td>
                      <td align="right" style={{ padding: '0.75rem', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>{workroom.storesCount} stores</span>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                            {workroom.stores.slice(0, 3).join(', ')}
                            {workroom.stores.length > 3 && ` +${workroom.stores.length - 3} more`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    Upload a T1/T2 scorecard to see workroom summary data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

