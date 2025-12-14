'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthContext'
import LTRForm from '@/components/LTRForm'

function LTRFormContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workroom, setWorkroom] = useState<string>('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const workroomParam = searchParams.get('workroom')
    if (workroomParam) {
      setWorkroom(workroomParam)
    }
  }, [searchParams])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <ProtectedRoute>
      <Layout>
        <LTRForm workroom={workroom} />
      </Layout>
    </ProtectedRoute>
  )
}

export default function LTRFormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LTRFormContent />
    </Suspense>
  )
}

