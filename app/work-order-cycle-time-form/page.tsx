'use client'

import { Suspense } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import WorkOrderCycleTimeForm from '@/components/WorkOrderCycleTimeForm'
import { useSearchParams } from 'next/navigation'

function WorkOrderCycleTimeFormContent() {
  const searchParams = useSearchParams()
  const workroom = searchParams.get('workroom') || ''

  return (
    <ProtectedRoute>
      <Layout>
        <WorkOrderCycleTimeForm workroom={workroom} />
      </Layout>
    </ProtectedRoute>
  )
}

export default function WorkOrderCycleTimeFormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkOrderCycleTimeFormContent />
    </Suspense>
  )
}
