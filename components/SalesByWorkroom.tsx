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

interface SalesByWorkroomProps {
  selectedWorkroom: string
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

export default function SalesByWorkroom({ selectedWorkroom }: SalesByWorkroomProps) {
  const { data } = useData()

  let filteredData = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))
  if (selectedWorkroom !== 'all') {
    filteredData = filteredData.filter((w) => w.name === selectedWorkroom)
  }

  const workroomMap = new Map<string, { count: number; sales: number }>()
  filteredData.forEach((w) => {
    const existing = workroomMap.get(w.name) || { count: 0, sales: 0 }
    workroomMap.set(w.name, {
      count: existing.count + 1,
      sales: existing.sales + (w.sales || 0),
    })
  })

  const chartData = Array.from(workroomMap.entries())
    .map(([name, data]) => ({
      name,
      sales: data.sales,
      records: data.count,
    }))
    .sort((a, b) => b.sales - a.sales)

  const totalSales = chartData.reduce((sum, w) => sum + w.sales, 0)
  const hasSalesData = chartData.length > 0 && totalSales > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Sales by Workroom</h2>
          <p className="text-gray-600">Sales performance across different workrooms</p>
        </div>
        <div className="text-xl font-semibold bg-black text-white px-4 py-2 rounded-lg">
          Total: ${totalSales.toLocaleString()}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {hasSalesData ? (
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
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="sales" fill="#4f46e5" name="Sales ($)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        ) : (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6b7280' }}>
            <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No Sales Data Available</p>
            <p style={{ fontSize: '0.875rem' }}>Upload a T1/T2 scorecard file with sales data to see sales by workroom.</p>
          </div>
        )}
      </div>
    </div>
  )
}


