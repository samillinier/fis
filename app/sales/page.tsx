'use client'

import Layout from '@/components/Layout'
import SalesByWorkroom from '@/components/SalesByWorkroom'
import { useFilters } from '@/components/FilterContext'

export default function SalesPage() {
  const { selectedWorkroom } = useFilters()

  return (
    <Layout>
      <SalesByWorkroom selectedWorkroom={selectedWorkroom} />
    </Layout>
  )
}

