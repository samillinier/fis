'use client'

import Layout from '@/components/Layout'
import LaborVendorReport from '@/components/LaborVendorReport'
import { useFilters } from '@/components/FilterContext'

export default function LaborPage() {
  const { selectedWorkroom } = useFilters()

  return (
    <Layout>
      <LaborVendorReport selectedWorkroom={selectedWorkroom} />
    </Layout>
  )
}

