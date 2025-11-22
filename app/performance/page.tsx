'use client'

import Layout from '@/components/Layout'
import PerformanceIndex from '@/components/PerformanceIndex'
import { useFilters } from '@/components/FilterContext'

export default function PerformancePage() {
  const { selectedWorkroom, excludeCycleTime } = useFilters()

  return (
    <Layout>
      <PerformanceIndex
        selectedWorkroom={selectedWorkroom}
        excludeCycleTime={excludeCycleTime}
      />
    </Layout>
  )
}

