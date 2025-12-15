'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import WorkroomReport from '@/components/WorkroomReport'

export default function WorkroomReportPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <WorkroomReport />
      </Layout>
    </ProtectedRoute>
  )
}



