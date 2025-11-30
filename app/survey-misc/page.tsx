'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthContext'
import SurveyMisc from '@/components/SurveyMisc'

export default function SurveyMiscPage() {
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
        <SurveyMisc />
      </Layout>
    </ProtectedRoute>
  )
}


