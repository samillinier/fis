'use client'

import Layout from '@/components/Layout'
import VisualBreakdown from '@/components/VisualBreakdown'
import SummaryPanel from '@/components/SummaryPanel'
import { useFilters } from '@/components/FilterContext'

export default function Home() {
  const { selectedWorkroom } = useFilters()

  return (
    <Layout>
      <>
        <VisualBreakdown selectedWorkroom={selectedWorkroom} />
        <SummaryPanel />
      </>
    </Layout>
  )
}


