'use client'

import type { ScheduledJobRecord } from '@/context/ScheduledJobContext'
import PaymentScheduledWeek from '@/components/PaymentScheduledWeek'

interface PaymentScheduledNextWeekProps {
  jobs: ScheduledJobRecord[]
  isLoading?: boolean
}

export default function PaymentScheduledNextWeek({ jobs, isLoading }: PaymentScheduledNextWeekProps) {
  return (
    <PaymentScheduledWeek
      jobs={jobs}
      isLoading={isLoading}
      weekOffset={1}
      title="Scheduled Next Week"
      countLabel="scheduled next week"
      emptyMessage="No scheduled jobs due next week in the current export."
    />
  )
}
