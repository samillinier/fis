'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Survey from '@/components/Survey'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthContext'

export default function SurveyPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Survey />
      </Layout>
    </ProtectedRoute>
  )
}

