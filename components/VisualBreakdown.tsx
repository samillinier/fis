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
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface VisualBreakdownProps {
  selectedWorkroom: string
}

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#E0E0E0']

export default function VisualBreakdown({ selectedWorkroom }: VisualBreakdownProps) {
  const { data } = useData()

  let filteredData = data.workrooms
  if (selectedWorkroom !== 'all') {
    filteredData = filteredData.filter((w) => w.name === selectedWorkroom)
  }

  const workroomMap = new Map<string, number>()
  filteredData.forEach((w) => {
    workroomMap.set(w.name, (workroomMap.get(w.name) || 0) + 1)
  })
  const workroomData = Array.from(workroomMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const storeMap = new Map<string | number, number>()
  filteredData.forEach((w) => {
    const storeKey = String(w.store)
    storeMap.set(storeKey, (storeMap.get(storeKey) || 0) + 1)
  })
  const storeData = Array.from(storeMap.entries())
    .map(([name, count]) => ({ name: String(name), count }))
    .sort((a, b) => Number(a.name) - Number(b.name))
    .slice(0, 20)

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Visual Breakdown by Workroom, Category, and Store</h2>
        <p className="text-gray-600">Overview of workroom distribution and store relationships</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">By Workroom (Record Count)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={workroomData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
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
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#000000" name="Records" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Workrooms Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={workroomData.slice(0, 10)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {workroomData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Stores (Record Count)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={storeData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#374151', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#000000" name="Records" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}


