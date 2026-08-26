'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthContext'
import JobsView from '@/components/JobsView'

export default function JobPage() {
  const { isAuthenticated, isLoading, isAdmin, isOwner } = useAuth()
  const router = useRouter()
  const canAccess = isAdmin || isOwner

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    if (!canAccess) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, canAccess, router])

  if (isLoading || !isAuthenticated || !canAccess) {
    return null
  }

  return (
    <ProtectedRoute>
      <Layout>
        <JobsView />
      </Layout>
    </ProtectedRoute>
  )
}
