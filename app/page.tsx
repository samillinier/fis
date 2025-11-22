'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import VisualBreakdown from '@/components/VisualBreakdown'
import SummaryPanel from '@/components/SummaryPanel'
import { useFilters } from '@/components/FilterContext'
import { useAuth } from '@/components/AuthContext'

export default function Home() {
  const { selectedWorkroom } = useFilters()
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
    <Layout>
      <>
        <VisualBreakdown selectedWorkroom={selectedWorkroom} />
        <SummaryPanel />
      </>
    </Layout>
  )
}


