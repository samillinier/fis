'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import VisualBreakdown from '@/components/VisualBreakdown'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { useFilters } from '@/components/FilterContext'
import { useAuth } from '@/components/AuthContext'
import { DASHBOARD_DATA_UPDATED_EVENT } from '@/lib/dashboardEvents'

export default function Home() {
  const { selectedWorkroom } = useFilters()
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, isLoading, router])

  // Reload weekly POD data from Supabase when opening Visual Breakdown (not yearly).
  useEffect(() => {
    if (!isAuthenticated || isLoading || typeof window === 'undefined') return
    window.dispatchEvent(new Event(DASHBOARD_DATA_UPDATED_EVENT))
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <Layout>
      <AnnouncementBanner />
      <VisualBreakdown selectedWorkroom={selectedWorkroom} dataSource="pod" />
    </Layout>
  )
}


