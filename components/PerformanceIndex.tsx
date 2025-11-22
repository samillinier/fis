'use client'

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
} from 'recharts'

interface PerformanceIndexProps {
  selectedWorkroom: string
  excludeCycleTime: boolean
}

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

export default function PerformanceIndex({
  selectedWorkroom,
  excludeCycleTime,
}: PerformanceIndexProps) {
  const { data } = useData()

  let filteredData = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))
  if (selectedWorkroom !== 'all') {
    filteredData = filteredData.filter((w) => w.name === selectedWorkroom)
  }

  const workroomMap = new Map<
    string,
    { sales: number; laborPO: number; vendorDebit: number; cycleTime?: number; count: number }
  >()

  filteredData.forEach((w) => {
    const existing = workroomMap.get(w.name) || {
      sales: 0,
      laborPO: 0,
      vendorDebit: 0,
      count: 0,
    }
    workroomMap.set(w.name, {
      sales: existing.sales + (w.sales || 0),
      laborPO: existing.laborPO + (w.laborPO || 0),
      vendorDebit: existing.vendorDebit + (w.vendorDebit || 0),
      cycleTime: w.cycleTime || existing.cycleTime,
      count: existing.count + 1,
    })
  })

  const processedData = Array.from(workroomMap.entries())
    .map(([name, w]) => {
      let performanceIndex = 0
      const totalCost = w.laborPO + w.vendorDebit

      if (totalCost > 0) {
        const efficiency = w.sales / totalCost
        if (excludeCycleTime || !w.cycleTime) {
          performanceIndex = Math.min(100, efficiency * 10)
        } else {
          const cycleTimeFactor = Math.max(0, 1 - w.cycleTime / 30)
          performanceIndex = Math.min(100, efficiency * 10 * (0.7 + 0.3 * cycleTimeFactor))
        }
      }

      return {
        name,
        calculatedIndex: Math.round(performanceIndex),
        cycleTime: w.cycleTime,
        sales: w.sales,
        laborPO: w.laborPO,
        vendorDebit: w.vendorDebit,
        count: w.count,
      }
    })
    .sort((a, b) => b.calculatedIndex - a.calculatedIndex)

  const chartData = processedData.map((w) => ({
    name: w.name,
    performanceIndex: w.calculatedIndex,
  }))

  const avgPerformance =
    processedData.length > 0
      ? processedData.reduce((sum, w) => sum + w.calculatedIndex, 0) / processedData.length
      : 0

  const hasData = chartData.length > 0 && chartData.some((d) => d.performanceIndex > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Workroom Performance Index</h2>
          <p className="text-gray-600">Performance metrics across workrooms</p>
        </div>
        <div className="bg-black text-white px-4 py-2 rounded-lg">
          <div className="text-sm text-gray-300">Average Performance</div>
          <div className="text-2xl font-semibold">{avgPerformance.toFixed(1)}</div>
        </div>
      </div>

      {excludeCycleTime && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">Performance index calculated excluding cycle time</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {hasData ? (
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
            <YAxis domain={[0, 100]} tick={{ fill: '#374151', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="performanceIndex"
              fill="#22c55e"
              name="Performance Index"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        ) : (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6b7280' }}>
            <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No Performance Data Available</p>
            <p style={{ fontSize: '0.875rem' }}>Upload a T1/T2 scorecard file with sales, labor PO, and vendor debit data to see performance metrics.</p>
          </div>
        )}
      </div>
    </div>
  )
}


