'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import FinanceHub from '@/components/FinanceHub'

export default function FinanceHubPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <FinanceHub />
      </Layout>
    </ProtectedRoute>
  )
}

