'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Budget from '@/components/Budget'

export default function BudgetPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Budget />
      </Layout>
    </ProtectedRoute>
  )
}
