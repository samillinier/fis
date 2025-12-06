'use client'

import Layout from '@/components/Layout'
import HistoricalAnalytics from '@/components/HistoricalAnalytics'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <HistoricalAnalytics />
      </Layout>
    </ProtectedRoute>
  )
}

