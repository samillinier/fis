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

interface LaborVendorReportProps {
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

export default function LaborVendorReport({ selectedWorkroom }: LaborVendorReportProps) {
  const { data } = useData()

  let filteredData = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))
  if (selectedWorkroom !== 'all') {
    filteredData = filteredData.filter((w) => w.name === selectedWorkroom)
  }

  const workroomMap = new Map<string, { laborPO: number; vendorDebit: number }>()
  filteredData.forEach((w) => {
    const existing = workroomMap.get(w.name) || { laborPO: 0, vendorDebit: 0 }
    workroomMap.set(w.name, {
      laborPO: existing.laborPO + (w.laborPO || 0),
      vendorDebit: existing.vendorDebit + (w.vendorDebit || 0),
    })
  })

  const chartData = Array.from(workroomMap.entries())
    .map(([name, data]) => ({
      name,
      laborPO: data.laborPO,
      vendorDebit: data.vendorDebit,
    }))
    .sort((a, b) => b.laborPO + b.vendorDebit - (a.laborPO + a.vendorDebit))

  const totalLaborPO = chartData.reduce((sum, w) => sum + w.laborPO, 0)
  const totalVendorDebit = chartData.reduce((sum, w) => sum + w.vendorDebit, 0)

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Labor PO $ and Vendor Debit $ by Workroom</h2>
        <p className="text-gray-600">Labor purchase orders and vendor debit costs per workroom</p>
      </div>

      <div className="flex items-center justify-end mb-6 space-x-4">
        <div className="bg-black text-white px-4 py-2 rounded-lg">
          <div className="text-sm text-gray-300">Total Labor PO</div>
          <div className="text-lg font-semibold">${totalLaborPO.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
          <div className="text-sm text-gray-300">Total Vendor Debit</div>
          <div className="text-lg font-semibold">${totalVendorDebit.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
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
            <Bar dataKey="laborPO" fill="#0f766e" name="Labor PO ($)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vendorDebit" fill="#f97316" name="Vendor Debit ($)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


