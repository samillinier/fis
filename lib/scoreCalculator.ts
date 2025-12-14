import { WorkroomData } from '@/context/DataContext'

/**
 * Calculate weighted performance score for a workroom
 * This matches the calculation in VisualBreakdown.tsx
 */
export function calculateWeightedPerformanceScore(workroom: WorkroomData, allWorkrooms: WorkroomData[]): number {
  // Get workroom-specific data
  const workroomName = workroom.name || ''
  const workroomData = allWorkrooms.filter((w) => (w.name || '').trim() === workroomName.trim())
  
  if (workroomData.length === 0) return 0

  // Aggregate data for this workroom
  let totalSales = 0
  let totalLaborPO = 0
  let totalVendorDebit = 0
  let totalDetailsCycleTime = 0
  let detailsCycleTimeCount = 0
  let totalJobsWorkCycleTime = 0
  let jobsWorkCycleTimeCount = 0
  let totalRescheduleRate = 0
  let rescheduleRateCount = 0
  let totalLTR = 0
  let ltrCount = 0

  workroomData.forEach((w) => {
    totalSales += w.sales || 0
    totalLaborPO += w.laborPO || 0
    totalVendorDebit += Math.abs(w.vendorDebit || 0)
    if (w.detailsCycleTime != null && w.detailsCycleTime > 0) {
      totalDetailsCycleTime += w.detailsCycleTime
      detailsCycleTimeCount++
    }
    if (w.jobsWorkCycleTime != null && w.jobsWorkCycleTime > 0) {
      totalJobsWorkCycleTime += w.jobsWorkCycleTime
      jobsWorkCycleTimeCount++
    }
    if (w.rescheduleRate != null && w.rescheduleRate > 0) {
      totalRescheduleRate += w.rescheduleRate
      rescheduleRateCount++
    }
    if (w.ltrScore != null && w.ltrScore > 0) {
      totalLTR += w.ltrScore
      ltrCount++
    }
  })

  const avgDetailsCycleTime = detailsCycleTimeCount > 0 ? totalDetailsCycleTime / detailsCycleTimeCount : null
  const avgJobsWorkCycleTime = jobsWorkCycleTimeCount > 0 ? totalJobsWorkCycleTime / jobsWorkCycleTimeCount : null
  const avgRescheduleRate = rescheduleRateCount > 0 ? totalRescheduleRate / rescheduleRateCount : null
  const avgLTRFromSurvey = ltrCount > 0 ? totalLTR / ltrCount : null

  const totalCost = totalLaborPO + totalVendorDebit
  const ltrPercent = totalSales > 0 ? (totalLaborPO / totalSales) * 100 : 0

  // Calculate LTR Score (50% weight)
  let ltrScore = 0
  if (avgLTRFromSurvey != null && avgLTRFromSurvey > 0) {
    ltrScore = avgLTRFromSurvey * 10 // Convert 0-10 scale to 0-100
  } else if (ltrPercent > 0) {
    if (ltrPercent <= 20) {
      ltrScore = 100 - (ltrPercent / 20) * 30
    } else if (ltrPercent <= 40) {
      ltrScore = 70 - ((ltrPercent - 20) / 20) * 70
    } else {
      ltrScore = 0
    }
  } else {
    ltrScore = 50
  }

  // Details Cycle Time Score (5% weight)
  // Caution triggers at > 5 days
  let detailsCycleTimeScore = 50
  if (avgDetailsCycleTime != null && avgDetailsCycleTime > 0) {
    if (avgDetailsCycleTime <= 5) {
      detailsCycleTimeScore = 100
    } else if (avgDetailsCycleTime <= 10) {
      detailsCycleTimeScore = 60 // Moderate - triggers notification (< 70)
    } else if (avgDetailsCycleTime <= 15) {
      detailsCycleTimeScore = 40 // Poor
    } else if (avgDetailsCycleTime <= 20) {
      detailsCycleTimeScore = 30 // Critical
    } else {
      detailsCycleTimeScore = 20 // Critical
    }
  }

  // Cycle Jobs Score (13% weight)
  let cycleJobsScore = 50
  if (avgJobsWorkCycleTime != null && avgJobsWorkCycleTime > 0) {
    if (avgJobsWorkCycleTime <= 5) {
      cycleJobsScore = 100
    } else if (avgJobsWorkCycleTime <= 10) {
      cycleJobsScore = 80
    } else if (avgJobsWorkCycleTime <= 15) {
      cycleJobsScore = 60
    } else if (avgJobsWorkCycleTime <= 20) {
      cycleJobsScore = 40
    } else {
      cycleJobsScore = 20
    }
  }

  // Work Order Cycle Time Score (14% weight)
  let workOrderCycleTimeScore = 50
  const avgCycleTime = workroomData.reduce((sum, w) => sum + (w.cycleTime || 0), 0) / workroomData.length
  if (avgCycleTime > 0) {
    if (avgCycleTime <= 15) {
      workOrderCycleTimeScore = 100
    } else if (avgCycleTime <= 25) {
      workOrderCycleTimeScore = 80
    } else if (avgCycleTime <= 35) {
      workOrderCycleTimeScore = 60
    } else if (avgCycleTime <= 45) {
      workOrderCycleTimeScore = 40
    } else {
      workOrderCycleTimeScore = 20
    }
  }

  // Reschedule Rate Score (8% weight)
  let rescheduleRateScore = 50
  if (avgRescheduleRate != null && avgRescheduleRate > 0) {
    if (avgRescheduleRate <= 10) {
      rescheduleRateScore = 100
    } else if (avgRescheduleRate <= 20) {
      rescheduleRateScore = 80
    } else if (avgRescheduleRate <= 30) {
      rescheduleRateScore = 60
    } else if (avgRescheduleRate <= 40) {
      rescheduleRateScore = 40
    } else {
      rescheduleRateScore = 20
    }
  }

  // Vendor Debits Score (10% weight)
  let vendorDebitsScore = 100
  if (totalCost > 0) {
    const vendorDebitRatio = totalVendorDebit / totalCost
    if (vendorDebitRatio <= 0.1) {
      vendorDebitsScore = 100
    } else if (vendorDebitRatio <= 0.2) {
      vendorDebitsScore = 80
    } else if (vendorDebitRatio <= 0.3) {
      vendorDebitsScore = 60
    } else if (vendorDebitRatio <= 0.4) {
      vendorDebitsScore = 40
    } else {
      vendorDebitsScore = 20
    }
  }

  // Calculate weighted Performance Score
  const weightedPerformanceScore =
    (ltrScore * 0.50) +
    (detailsCycleTimeScore * 0.05) +
    (cycleJobsScore * 0.13) +
    (workOrderCycleTimeScore * 0.14) +
    (rescheduleRateScore * 0.08) +
    (vendorDebitsScore * 0.10)

  return weightedPerformanceScore
}

/**
 * Calculate individual component scores for a workroom
 * Returns all component scores and related metrics for notifications
 */
export function calculateComponentScores(workroom: WorkroomData, allWorkrooms: WorkroomData[]) {
  // Get workroom-specific data
  const workroomName = workroom.name || ''
  const workroomData = allWorkrooms.filter((w) => (w.name || '').trim() === workroomName.trim())
  
  if (workroomData.length === 0) {
    return {
      ltrScore: 0,
      ltrPercent: 0,
      cycleJobsScore: 0,
      avgJobsWorkCycleTime: null,
      workOrderCycleTimeScore: 0,
      avgCycleTime: null,
      detailsCycleTimeScore: 0,
      avgDetailsCycleTime: null,
      rescheduleRateScore: 0,
      avgRescheduleRate: null,
      vendorDebitsScore: 0,
      vendorDebitRatio: null,
    }
  }

  // Aggregate data for this workroom
  let totalSales = 0
  let totalLaborPO = 0
  let totalVendorDebit = 0
  let totalDetailsCycleTime = 0
  let detailsCycleTimeCount = 0
  let totalJobsWorkCycleTime = 0
  let jobsWorkCycleTimeCount = 0
  let totalRescheduleRate = 0
  let rescheduleRateCount = 0
  let totalLTR = 0
  let ltrCount = 0

  workroomData.forEach((w) => {
    totalSales += w.sales || 0
    totalLaborPO += w.laborPO || 0
    totalVendorDebit += Math.abs(w.vendorDebit || 0)
    if (w.detailsCycleTime != null && w.detailsCycleTime > 0) {
      totalDetailsCycleTime += w.detailsCycleTime
      detailsCycleTimeCount++
    }
    if (w.jobsWorkCycleTime != null && w.jobsWorkCycleTime > 0) {
      totalJobsWorkCycleTime += w.jobsWorkCycleTime
      jobsWorkCycleTimeCount++
    }
    if (w.rescheduleRate != null && w.rescheduleRate > 0) {
      totalRescheduleRate += w.rescheduleRate
      rescheduleRateCount++
    }
    if (w.ltrScore != null && w.ltrScore > 0) {
      totalLTR += w.ltrScore
      ltrCount++
    }
  })

  const avgDetailsCycleTime = detailsCycleTimeCount > 0 ? totalDetailsCycleTime / detailsCycleTimeCount : null
  const avgJobsWorkCycleTime = jobsWorkCycleTimeCount > 0 ? totalJobsWorkCycleTime / jobsWorkCycleTimeCount : null
  const avgRescheduleRate = rescheduleRateCount > 0 ? totalRescheduleRate / rescheduleRateCount : null
  const avgLTRFromSurvey = ltrCount > 0 ? totalLTR / ltrCount : null

  const totalCost = totalLaborPO + totalVendorDebit
  const ltrPercent = totalSales > 0 ? (totalLaborPO / totalSales) * 100 : 0

  // Calculate LTR Score (50% weight)
  let ltrScore = 0
  if (avgLTRFromSurvey != null && avgLTRFromSurvey > 0) {
    ltrScore = avgLTRFromSurvey * 10 // Convert 0-10 scale to 0-100
  } else if (ltrPercent > 0) {
    if (ltrPercent <= 20) {
      ltrScore = 100 - (ltrPercent / 20) * 30
    } else if (ltrPercent <= 40) {
      ltrScore = 70 - ((ltrPercent - 20) / 20) * 70
    } else {
      ltrScore = 0
    }
  } else {
    ltrScore = 50
  }

  // Details Cycle Time Score (5% weight)
  // Caution triggers at > 5 days
  let detailsCycleTimeScore = 50
  if (avgDetailsCycleTime != null && avgDetailsCycleTime > 0) {
    if (avgDetailsCycleTime <= 5) {
      detailsCycleTimeScore = 100
    } else if (avgDetailsCycleTime <= 10) {
      detailsCycleTimeScore = 60 // Moderate - triggers notification (< 70)
    } else if (avgDetailsCycleTime <= 15) {
      detailsCycleTimeScore = 40 // Poor
    } else if (avgDetailsCycleTime <= 20) {
      detailsCycleTimeScore = 30 // Critical
    } else {
      detailsCycleTimeScore = 20 // Critical
    }
  }

  // Cycle Jobs Score (13% weight)
  let cycleJobsScore = 50
  if (avgJobsWorkCycleTime != null && avgJobsWorkCycleTime > 0) {
    if (avgJobsWorkCycleTime <= 5) {
      cycleJobsScore = 100
    } else if (avgJobsWorkCycleTime <= 10) {
      cycleJobsScore = 80
    } else if (avgJobsWorkCycleTime <= 15) {
      cycleJobsScore = 60
    } else if (avgJobsWorkCycleTime <= 20) {
      cycleJobsScore = 40
    } else {
      cycleJobsScore = 20
    }
  }

  // Work Order Cycle Time Score (14% weight)
  let workOrderCycleTimeScore = 50
  const avgCycleTime = workroomData.reduce((sum, w) => sum + (w.cycleTime || 0), 0) / workroomData.length
  if (avgCycleTime > 0) {
    if (avgCycleTime <= 15) {
      workOrderCycleTimeScore = 100
    } else if (avgCycleTime <= 25) {
      workOrderCycleTimeScore = 80
    } else if (avgCycleTime <= 35) {
      workOrderCycleTimeScore = 60
    } else if (avgCycleTime <= 45) {
      workOrderCycleTimeScore = 40
    } else {
      workOrderCycleTimeScore = 20
    }
  }

  // Reschedule Rate Score (8% weight)
  let rescheduleRateScore = 50
  if (avgRescheduleRate != null && avgRescheduleRate > 0) {
    if (avgRescheduleRate <= 10) {
      rescheduleRateScore = 100
    } else if (avgRescheduleRate <= 20) {
      rescheduleRateScore = 80
    } else if (avgRescheduleRate <= 30) {
      rescheduleRateScore = 60
    } else if (avgRescheduleRate <= 40) {
      rescheduleRateScore = 40
    } else {
      rescheduleRateScore = 20
    }
  }

  // Vendor Debits Score (10% weight)
  let vendorDebitsScore = 100
  let vendorDebitRatio: number | null = null
  if (totalCost > 0) {
    vendorDebitRatio = (totalVendorDebit / totalCost) * 100 // Convert to percentage
    if (vendorDebitRatio <= 10) {
      vendorDebitsScore = 100
    } else if (vendorDebitRatio <= 20) {
      vendorDebitsScore = 80
    } else if (vendorDebitRatio <= 30) {
      vendorDebitsScore = 60
    } else if (vendorDebitRatio <= 40) {
      vendorDebitsScore = 40
    } else {
      vendorDebitsScore = 20
    }
  }

  return {
    ltrScore,
    ltrPercent: ltrPercent > 0 ? ltrPercent : null,
    cycleJobsScore,
    avgJobsWorkCycleTime,
    workOrderCycleTimeScore,
    avgCycleTime: avgCycleTime > 0 ? avgCycleTime : null,
    detailsCycleTimeScore,
    avgDetailsCycleTime,
    rescheduleRateScore,
    avgRescheduleRate,
    vendorDebitsScore,
    vendorDebitRatio,
  }
}

