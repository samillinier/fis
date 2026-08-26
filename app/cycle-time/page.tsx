'use client'

import CycleTimePage from '@/components/CycleTimePage'

export default function CycleTimeYtdPage() {
  return (
    <CycleTimePage
      variant="ytd"
      emptyHint="Upload the YTD cycle time report to see heatmap visualization."
    />
  )
}
