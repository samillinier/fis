'use client'

import type { ScheduledJobRecord } from '@/context/ScheduledJobContext'
import PaymentScheduledWeek from '@/components/PaymentScheduledWeek'

interface PaymentScheduledThisWeekProps {
  jobs: ScheduledJobRecord[]
  isLoading?: boolean
}

export default function PaymentScheduledThisWeek({ jobs, isLoading }: PaymentScheduledThisWeekProps) {
  return (
    <PaymentScheduledWeek
      jobs={jobs}
      isLoading={isLoading}
      weekOffset={0}
      title="Scheduled This Week"
      countLabel="the current week"
      emptyMessage="No jobs with status Scheduled found for this week. Upload a fresh jobs export or check due dates."
    />
  )
}
