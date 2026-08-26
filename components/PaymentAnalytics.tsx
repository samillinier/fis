'use client'

import { useMemo } from 'react'
import type { PaymentRecord } from '@/context/PaymentContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { getPaymentAmount, formatPaymentCurrency } from '@/lib/paymentParser'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

interface PaymentAnalyticsProps {
  payments: PaymentRecord[]
}

function aggregateByField(
  payments: PaymentRecord[],
  field: keyof PaymentRecord,
  limit = 10
) {
  const map = new Map<string, number>()
  payments.forEach(p => {
    const key = String(p[field] ?? 'Unknown').trim() || 'Unknown'
    map.set(key, (map.get(key) || 0) + getPaymentAmount(p))
  })
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

function aggregateByMonth(payments: PaymentRecord[]) {
  const map = new Map<string, number>()
  payments.forEach(p => {
    const raw = p.checkDate || p.createdOn
    if (!raw) return
    const dateStr = String(raw).split(' - ')[0].trim()
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + getPaymentAmount(p))
  })
  return Array.from(map.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export default function PaymentAnalytics({ payments }: PaymentAnalyticsProps) {
  const byInstaller = useMemo(() => aggregateByField(payments, 'installerName'), [payments])
  const byStore = useMemo(() => aggregateByField(payments, 'store'), [payments])
  const byCategory = useMemo(() => aggregateByField(payments, 'labourCategory', 8), [payments])
  const byStatus = useMemo(() => aggregateByField(payments, 'status', 6), [payments])
  const byMonth = useMemo(() => aggregateByMonth(payments), [payments])

  if (payments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center text-gray-500">
        Upload payment data to see analytics.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top Installers by Amount">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byInstaller} margin={{ top: 10, right: 10, bottom: 60, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatPaymentCurrency(v)} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Stores by Amount">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byStore} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatPaymentCurrency(v)} />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Labour Category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatPaymentCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Status">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byStatus} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
              <Tooltip formatter={(v: number) => formatPaymentCurrency(v)} />
              <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {byMonth.length > 1 && (
        <ChartCard title="Payments Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMonth} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatPaymentCurrency(v)} />
              <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </section>
  )
}
