'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { useData } from '@/context/DataContext'
import { calculateWeightedPerformanceScore, calculateComponentScores } from '@/lib/scoreCalculator'

export interface WorkroomNotification {
  id: string
  workroom: string
  message: string
  type: 'warning' | 'info' | 'error'
  created_at: string
  is_read: boolean
}

interface WorkroomNotificationContextType {
  notifications: WorkroomNotification[]
  unreadCount: number
  loading: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationIds: string[]) => Promise<void>
  deleteNotification: (notificationIds: string[]) => Promise<void>
}

const WorkroomNotificationContext = createContext<WorkroomNotificationContextType | undefined>(undefined)

export function WorkroomNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { data } = useData()
  const [notifications, setNotifications] = useState<WorkroomNotification[]>([])
  const [loading, setLoading] = useState(false)

  // Helper function to extract metric from notification message
  const extractMetricFromMessage = (msg: string): string | null => {
    const messageLower = msg.toLowerCase()
    if (messageLower.includes('ltr') && messageLower.includes('performance is below standard')) return 'ltr'
    if (messageLower.includes('reschedule rate') && messageLower.includes('above target')) return 'reschedule_rate'
    if (messageLower.includes('job cycle time') && messageLower.includes('exceeds target')) return 'job_cycle_time'
    if (messageLower.includes('work order cycle time') && (messageLower.includes('exceeds target') || messageLower.includes('n/a'))) return 'work_order_cycle_time'
    if (messageLower.includes('details cycle time') && messageLower.includes('exceeds target')) return 'details_cycle_time'
    if (messageLower.includes('vendor debits') && (messageLower.includes('above target') || messageLower.includes('ratio is above'))) return 'vendor_debits'
    return null
  }

  // Helper function to remove duplicate notifications (keep the most recent one)
  const removeDuplicates = (notifications: any[]): any[] => {
    const seen = new Map<string, any>()
    
    // Sort by created_at descending to keep the most recent
    const sorted = [...notifications].sort((a, b) => {
      const timeA = new Date(a.created_at || a.id).getTime()
      const timeB = new Date(b.created_at || b.id).getTime()
      return timeB - timeA
    })
    
    for (const notification of sorted) {
      const workroom = (notification.workroom || '').trim().toLowerCase()
      const metric = extractMetricFromMessage(notification.message || '')
      
      if (workroom && metric) {
        const key = `${workroom}:${metric}`
        if (!seen.has(key)) {
          seen.set(key, notification)
        }
      } else {
        // If we can't extract metric, keep it (shouldn't happen with new format)
        seen.set(notification.id, notification)
      }
    }
    
    return Array.from(seen.values())
  }

  const refreshNotifications = useCallback(async () => {
    if (!user?.email) {
      setNotifications([])
      return
    }

    setLoading(true)
    try {
      const authHeader = user.email
      
      // First, check user's role - if President, don't fetch or show notifications
      const profileResponse = await fetch('/api/user-profile', {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      })
      
      let userRole: string | null = null
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        userRole = profile.role || profile.user_role || null
      }
      
      // If user is President, clear workroom score notifications but keep access request notifications
      if (userRole === 'President') {
        console.log('[Notifications] User has President role, filtering workroom score notifications')
        
        // Fetch notifications but filter out workroom performance notifications
        // Keep System workroom notifications (access requests)
        const response = await fetch('/api/notifications', {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        })
        
        if (response.ok) {
          const result = await response.json()
          const allNotifications = result.notifications || []
          
          // Only keep System workroom notifications (access requests)
          const systemNotifications = allNotifications.filter((n: any) => {
            const workroom = (n.workroom || '').trim()
            return workroom === 'System'
          })
          
          // Delete workroom performance notifications (not System)
          const workroomNotifications = allNotifications.filter((n: any) => {
            const workroom = (n.workroom || '').trim()
            return workroom !== 'System'
          })
          
          if (workroomNotifications.length > 0) {
            const notificationIds = workroomNotifications.map((n: any) => n.id)
            try {
              await fetch('/api/notifications', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authHeader}`,
                },
                body: JSON.stringify({ notificationIds }),
              })
              console.log(`[Notifications] Deleted ${notificationIds.length} workroom performance notifications for President role`)
            } catch (error) {
              console.error('Error deleting workroom notifications for President:', error)
            }
          }
          
          // Show only System notifications (access requests)
          setNotifications(systemNotifications)
        } else {
          setNotifications([])
        }
        setLoading(false)
        return
      }
      
      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const allNotifications = result.notifications || []
        
        // FILTER OUT old format notifications - don't even show them
        // Keep: notifications with ⚠️ (new format) OR System workroom notifications (access requests)
        const newFormatOnly = allNotifications.filter((n: any) => {
          const messageLower = (n.message || '').toLowerCase()
          const workroom = (n.workroom || '').trim()
          // Keep notifications with ⚠️ (new format) OR System workroom (access requests)
          return messageLower.includes('⚠️') || workroom === 'System'
        })
        
        // If there were old format notifications, delete them from database
        // Don't delete System workroom notifications (access requests)
        const oldFormatNotifications = allNotifications.filter((n: any) => {
          const messageLower = (n.message || '').toLowerCase()
          const workroom = (n.workroom || '').trim()
          // Delete old format (no ⚠️) but keep System workroom notifications
          return !messageLower.includes('⚠️') && workroom !== 'System'
        })
        
        if (oldFormatNotifications.length > 0) {
          console.log(`[Notifications] 🗑️ Auto-deleting ${oldFormatNotifications.length} old format notifications`)
          const oldFormatIds = oldFormatNotifications.map((n: any) => n.id)
          // Delete old format notifications directly via API (don't use deleteNotification callback to avoid circular dependency)
          try {
            const deleteResponse = await fetch('/api/notifications', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authHeader}`,
              },
              body: JSON.stringify({ notificationIds: oldFormatIds }),
            })
            if (deleteResponse.ok) {
              console.log(`[Notifications] ✅ Deleted ${oldFormatIds.length} old format notifications`)
            }
          } catch (deleteError) {
            console.error('Error deleting old notifications:', deleteError)
          }
        }
        
        // Remove duplicate notifications (same workroom + same metric) - keep most recent
        const deduplicatedNotifications = removeDuplicates(newFormatOnly)
        if (newFormatOnly.length !== deduplicatedNotifications.length) {
          const duplicateCount = newFormatOnly.length - deduplicatedNotifications.length
          console.log(`[Notifications] 🧹 Found ${duplicateCount} duplicate notification(s), removing...`)
          
          // Delete duplicates from database (keep the most recent one)
          const duplicateIds = newFormatOnly
            .filter((n: any) => !deduplicatedNotifications.find((d: any) => d.id === n.id))
            .map((n: any) => n.id)
          
          if (duplicateIds.length > 0) {
            try {
              const deleteResponse = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authHeader}`,
                },
                body: JSON.stringify({ notificationIds: duplicateIds }),
              })
              if (deleteResponse.ok) {
                console.log(`[Notifications] ✅ Deleted ${duplicateIds.length} duplicate notification(s)`)
              }
            } catch (deleteError) {
              console.error('Error deleting duplicate notifications:', deleteError)
            }
          }
        }
        
        console.log(`[refreshNotifications] Showing ${deduplicatedNotifications.length} unique notifications (filtered out ${oldFormatNotifications.length} old format, ${newFormatOnly.length - deduplicatedNotifications.length} duplicates)`)
        
        // Log System notifications for debugging
        const systemNotifications = deduplicatedNotifications.filter((n: any) => (n.workroom || '').trim() === 'System')
        if (systemNotifications.length > 0) {
          console.log(`[refreshNotifications] 📬 Found ${systemNotifications.length} System notification(s):`, systemNotifications.map((n: any) => n.message))
        }
        
        setNotifications(deduplicatedNotifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user?.email || notificationIds.length === 0) return

    // Update local state IMMEDIATELY (optimistic update) so count updates right away
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        notificationIds.includes(n.id) ? { ...n, is_read: true } : n
      )
      console.log(`[markAsRead] Optimistic update: Marking ${notificationIds.length} as read. New unread count: ${updated.filter(n => !n.is_read).length}`)
      return updated
    })

    try {
      const authHeader = user.email
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authHeader}`,
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        // Small delay before refresh to let UI update first
        setTimeout(async () => {
          await refreshNotifications()
        }, 100)
      } else {
        // If server update failed, refresh to get correct state
        setTimeout(async () => {
          await refreshNotifications()
        }, 100)
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      // On error, refresh to get correct state from server
      setTimeout(async () => {
        await refreshNotifications()
      }, 100)
    }
  }, [user?.email, refreshNotifications])

  const deleteNotification = useCallback(async (notificationIds: string[]) => {
    if (!user?.email || notificationIds.length === 0) {
      console.warn('[deleteNotification] Cannot delete: missing user email or empty notificationIds')
      return
    }

    console.log(`[deleteNotification] Attempting to delete ${notificationIds.length} notification(s):`, notificationIds)

    // Update local state IMMEDIATELY (optimistic update) to remove notifications right away
    setNotifications((prev) => {
      const updated = prev.filter((n) => !notificationIds.includes(n.id))
      console.log(`[deleteNotification] Optimistic update: Deleting ${notificationIds.length} notifications. Remaining: ${updated.length}`)
      return updated
    })

    try {
      const authHeader = user.email
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authHeader}`,
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        const result = await response.json().catch(() => ({}))
        console.log(`[deleteNotification] Successfully deleted notifications:`, result)
        // Small delay before refresh to let UI update first
        setTimeout(async () => {
          await refreshNotifications()
        }, 100)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`[deleteNotification] Server error (${response.status}):`, errorData)
        // If server delete failed, refresh to get correct state (notifications will reappear)
        setTimeout(async () => {
          await refreshNotifications()
        }, 100)
      }
    } catch (error: any) {
      console.error('[deleteNotification] Network/request error:', error)
      // On error, refresh to get correct state from server
      setTimeout(async () => {
        await refreshNotifications()
      }, 100)
    }
  }, [user?.email, refreshNotifications])

  // Refresh notifications on mount and when user changes
  useEffect(() => {
    refreshNotifications()
    
    // Also refresh periodically to keep count up to date
    const interval = setInterval(() => {
      refreshNotifications()
    }, 5000) // Refresh every 5 seconds to keep count accurate
    
    return () => clearInterval(interval)
  }, [refreshNotifications])

  // Check for hazard signs (⚠️) on heatmap and create notifications
  // This matches the exact logic used in VisualBreakdown.tsx to show hazard signs
  useEffect(() => {
    if (!user?.email || !data.workrooms.length) return

    const checkHazardSigns = async () => {
      try {
        const authHeader = user.email

        // Get user profile to find their assigned workroom
        const profileResponse = await fetch('/api/user-profile', {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        })

        let userWorkroom: string | null = null

        if (!profileResponse.ok) {
          console.log('[Notifications] Could not fetch user profile')
          return
        }

        const profile = await profileResponse.json()
        userWorkroom = profile.workroom || null
        const userRole = profile.role || profile.user_role || null

        // Skip notifications for President role
        if (userRole === 'President') {
          console.log('[Notifications] User has President role, skipping workroom score notifications')
          return
        }

        // Only send notifications for the user's assigned workroom
        if (!userWorkroom) {
          console.log('[Notifications] User has no workroom assigned, skipping notifications')
          return
        }

        console.log(`[Notifications] Checking hazards for user's workroom: ${userWorkroom}`)

        // Calculate comprehensive analysis (same logic as VisualBreakdown)
        // Group workrooms by name and aggregate data
        const workroomMap = new Map<string, {
          name: string
          sales: number
          laborPO: number
          vendorDebit: number
          cycleTime: number
          records: number
          stores: Set<string | number>
          jobsWorkCycleTime: number
          jobsWorkCycleTimeCount: number
          rescheduleRate: number
          rescheduleRateCount: number
          detailsCycleTime: number
          detailsCycleTimeCount: number
          completed: number
        }>()

        data.workrooms.forEach((w) => {
          const name = (w.name || '').trim()
          if (!name || name === '' || name.toLowerCase().includes('location #')) return

          const existing = workroomMap.get(name) || {
            name,
            sales: 0,
            laborPO: 0,
            vendorDebit: 0,
            cycleTime: undefined, // Use undefined to match VisualBreakdown (first non-null value)
            records: 0,
            stores: new Set<string | number>(),
            jobsWorkCycleTime: 0,
            jobsWorkCycleTimeCount: 0,
            rescheduleRate: 0,
            rescheduleRateCount: 0,
            detailsCycleTime: 0,
            detailsCycleTimeCount: 0,
            completed: 0,
          }

          existing.sales += w.sales || 0
          existing.laborPO += w.laborPO || 0
          existing.vendorDebit += w.vendorDebit || 0
          // For cycleTime, use first non-null value (matching VisualBreakdown logic: w.cycleTime || existing.cycleTime)
          existing.cycleTime = w.cycleTime || existing.cycleTime
          if (w.store) existing.stores.add(w.store)
          if (w.jobsWorkCycleTime != null && w.jobsWorkCycleTime > 0) {
            existing.jobsWorkCycleTime += w.jobsWorkCycleTime
            existing.jobsWorkCycleTimeCount++
          }
          if (w.rescheduleRate != null && w.rescheduleRate !== undefined && !isNaN(Number(w.rescheduleRate))) {
            existing.rescheduleRate += Number(w.rescheduleRate)
            existing.rescheduleRateCount++
          }
          if (w.detailsCycleTime != null && w.detailsCycleTime !== undefined && w.detailsCycleTime > 0) {
            existing.detailsCycleTime += w.detailsCycleTime
            existing.detailsCycleTimeCount++
          }
          existing.records++
          existing.completed += w.completed || 0

          workroomMap.set(name, existing)
        })

        // Get survey LTR data - MUST match VisualBreakdown logic (include 0 values)
        const surveyLTRMap = new Map<string, { sum: number; count: number }>()
        data.workrooms.forEach((w) => {
          // Match VisualBreakdown: include 0 values, only exclude null/undefined/NaN
          if (w.ltrScore != null && w.ltrScore !== undefined && !isNaN(w.ltrScore)) {
            const name = (w.name || '').trim()
            if (!name) return
            const existing = surveyLTRMap.get(name) || { sum: 0, count: 0 }
            existing.sum += w.ltrScore
            existing.count++
            surveyLTRMap.set(name, existing)
          }
        })

        // Process each workroom and check for hazards
        const hazards: Array<{ workroom: string; metric: string; message: string }> = []

        Array.from(workroomMap.values()).forEach((w) => {
          // Only process the user's assigned workroom
          const workroomNameLower = w.name.trim().toLowerCase()
          const userWorkroomLower = userWorkroom.trim().toLowerCase()
          if (workroomNameLower !== userWorkroomLower) {
            console.log(`[Notifications] Skipping ${w.name} (user workroom: ${userWorkroom})`)
            return
          }
          console.log(`[Notifications] Processing workroom: ${w.name} (matches user workroom: ${userWorkroom})`)

          const totalCost = w.laborPO + w.vendorDebit
          const ltrPercent = w.sales > 0 ? (w.laborPO / w.sales) * 100 : 0
          const vendorDebitRatio = totalCost > 0 ? Math.abs(w.vendorDebit) / totalCost : 0
          const avgJobsWorkCycleTime = w.jobsWorkCycleTimeCount > 0 ? (w.jobsWorkCycleTime || 0) / w.jobsWorkCycleTimeCount : null
          const avgRescheduleRate = w.rescheduleRateCount > 0 ? (w.rescheduleRate || 0) / w.rescheduleRateCount : null
          const avgDetailsCycleTime = w.detailsCycleTimeCount > 0 ? (w.detailsCycleTime || 0) / w.detailsCycleTimeCount : null
          // Use cycleTime directly (not averaged) to match VisualBreakdown logic
          // VisualBreakdown uses w.cycleTime directly (first non-null value from aggregation)
          const cycleTimeValue = w.cycleTime != null && w.cycleTime !== undefined && w.cycleTime > 0 ? w.cycleTime : null
          
          const surveyLTR = surveyLTRMap.get(w.name)
          const avgLTRFromSurvey = surveyLTR && surveyLTR.count > 0 ? surveyLTR.sum / surveyLTR.count : null

          // Calculate scores (same as VisualBreakdown) - MUST match exactly
          // VisualBreakdown line 845-859: includes 0 values in avgLTRFromSurvey check
          // When LTR is N/A (no data), heatmap shows it as a hazard, so score should be < 70
          let ltrScore = 0
          if (avgLTRFromSurvey != null && avgLTRFromSurvey > 0) {
            // Use survey LTR score (0-10 scale) converted to 0-100
            ltrScore = avgLTRFromSurvey * 10
          } else if (avgLTRFromSurvey === 0) {
            // Explicitly handle 0 value from survey (critical hazard)
            ltrScore = 0
          } else if (ltrPercent > 0) {
            // Fallback to calculated LTR% (lower is better)
            if (ltrPercent <= 20) {
              ltrScore = 100 - (ltrPercent / 20) * 30 // 70-100
            } else if (ltrPercent <= 40) {
              ltrScore = 70 - ((ltrPercent - 20) / 20) * 70 // 0-70
            } else {
              ltrScore = 0
            }
          } else {
            // No data available (N/A) - treat as hazard (score < 70) to match heatmap
            // Heatmap shows N/A as a warning, so we should notify about missing data
            ltrScore = 50 // Below threshold of 70, so it will trigger notification
          }

          let detailsCycleTimeScore = 50
          if (avgDetailsCycleTime != null && avgDetailsCycleTime > 0) {
            if (avgDetailsCycleTime <= 5) {
              detailsCycleTimeScore = 100
            } else if (avgDetailsCycleTime <= 10) {
              detailsCycleTimeScore = 60
            } else if (avgDetailsCycleTime <= 15) {
              detailsCycleTimeScore = 40
            } else if (avgDetailsCycleTime <= 20) {
              detailsCycleTimeScore = 30
            } else {
              detailsCycleTimeScore = 20
            }
          }

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

          let workOrderCycleTimeScore = 50 // Default neutral (below threshold) - N/A case
          if (cycleTimeValue != null && cycleTimeValue > 0) {
            if (cycleTimeValue <= 15) {
              workOrderCycleTimeScore = 100
            } else if (cycleTimeValue <= 25) {
              workOrderCycleTimeScore = 80
            } else if (cycleTimeValue <= 35) {
              workOrderCycleTimeScore = 60
            } else if (cycleTimeValue <= 45) {
              workOrderCycleTimeScore = 40
            } else {
              workOrderCycleTimeScore = 20
            }
          }
          // When cycleTimeValue is null/undefined, score remains 50 (below threshold of 70)
          // This matches heatmap behavior where N/A is shown as a warning

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

          let vendorDebitsScore = 100
          if (totalCost > 0) {
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

          // Check for hazards (score < 70) - same logic as VisualBreakdown hazard signs
          // Only create notifications for metrics that show ⚠️ on the heatmap
          const threshold = 70

          // LTR notification logic - must match heatmap exactly
          // Heatmap shows hazard when ltrScore < 70 (including when score = 0 or N/A)
          if (ltrScore < threshold) {
            // Get the LTR value to display - MUST match VisualBreakdown display logic exactly
            // VisualBreakdown line 959: value: avgLTRFromSurvey != null ? avgLTRFromSurvey : (ltrPercent > 0 ? ltrPercent : null)
            // VisualBreakdown line 1319: displays "N/A" when value is null
            let ltrValue = ''
            if (avgLTRFromSurvey != null) {
              // avgLTRFromSurvey can be 0, which is valid - display it without %
              ltrValue = `${avgLTRFromSurvey.toFixed(1)}`
            } else if (ltrPercent > 0) {
              // Only use ltrPercent if it's > 0 (VisualBreakdown checks ltrPercent > 0)
              ltrValue = `${ltrPercent.toFixed(1)}%`
            } else {
              // No data available - show N/A (matches heatmap display)
              ltrValue = 'N/A'
            }
            
            // Always create notification if score is below threshold, even if value is N/A
            console.log(`[Notifications] ✅ LTR hazard detected for ${w.name}: score=${ltrScore.toFixed(1)}, value=${ltrValue}, avgLTRFromSurvey=${avgLTRFromSurvey}, ltrPercent=${ltrPercent}`)
            const ltrHazard = {
              workroom: w.name,
              metric: 'LTR',
              message: `LTR performance is below standard ⚠️ ${ltrValue}`
            }
            console.log(`[Notifications] 📝 Adding LTR hazard to array:`, ltrHazard)
            hazards.push(ltrHazard)
          } else {
            console.log(`[Notifications] ⚠️ LTR for ${w.name} does not meet threshold: score=${ltrScore.toFixed(1)}, threshold=${threshold}, avgLTRFromSurvey=${avgLTRFromSurvey}, ltrPercent=${ltrPercent}`)
          }

          if (detailsCycleTimeScore < threshold && avgDetailsCycleTime != null && avgDetailsCycleTime > 0) {
            hazards.push({
              workroom: w.name,
              metric: 'Details Cycle Time',
              message: `Details Cycle Time exceeds target ⚠️ ${avgDetailsCycleTime.toFixed(1)}d`
            })
          }

          if (cycleJobsScore < threshold && cycleJobsScore > 0 && avgJobsWorkCycleTime != null && avgJobsWorkCycleTime > 0) {
            hazards.push({
              workroom: w.name,
              metric: 'Job Cycle Time',
              message: `Job Cycle Time exceeds target ⚠️ ${avgJobsWorkCycleTime.toFixed(1)}d`
            })
          }

          if (workOrderCycleTimeScore < threshold) {
            // Handle both cases: when value exists and when it's N/A
            let workOrderCycleTimeValue = ''
            if (cycleTimeValue != null && cycleTimeValue > 0) {
              workOrderCycleTimeValue = `${cycleTimeValue.toFixed(1)}d`
            } else {
              // No data available - show N/A (matches heatmap display)
              workOrderCycleTimeValue = 'N/A'
            }
            
            hazards.push({
              workroom: w.name,
              metric: 'Work Order Cycle Time',
              message: `Work Order Cycle Time exceeds target ⚠️ ${workOrderCycleTimeValue}`
            })
          }

          if (rescheduleRateScore < threshold && rescheduleRateScore > 0 && avgRescheduleRate != null && avgRescheduleRate > 0) {
            hazards.push({
              workroom: w.name,
              metric: 'Reschedule Rate',
              message: `Reschedule Rate is above target ⚠️ ${avgRescheduleRate.toFixed(1)}%`
            })
          }

          if (vendorDebitsScore < threshold && vendorDebitsScore > 0 && vendorDebitRatio > 0) {
            hazards.push({
              workroom: w.name,
              metric: 'Vendor Debits',
              message: `Vendor Debits ratio is above target ⚠️ ${(vendorDebitRatio * 100).toFixed(1)}%`
            })
          }
        })

        // Get existing notifications to check for duplicates (only new format with ⚠️)
        const freshNotifications = await fetch('/api/notifications', {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        }).then(res => res.ok ? res.json() : { notifications: [] }).then(data => (data.notifications || []).filter((n: any) => {
          // Only consider new format notifications (with ⚠️) for duplicate checking
          const messageLower = (n.message || '').toLowerCase()
          return messageLower.includes('⚠️')
        })).catch(() => [])

        console.log(`[Notifications] 📊 Total hazards detected: ${hazards.length}`, hazards.map(h => `${h.workroom}: ${h.metric}`))
        
        // Create notifications for each hazard - send them one at a time with delays
        for (let i = 0; i < hazards.length; i++) {
          const hazard = hazards[i]
          console.log(`[Notifications] 🔍 Processing hazard ${i + 1}/${hazards.length}: ${hazard.workroom} - ${hazard.metric} - "${hazard.message}"`)
          
          // Check if notification already exists (only check new format with ⚠️)
          const existingNotification = freshNotifications.find((n) => {
            const nWorkroom = (n.workroom || '').trim().toLowerCase()
            const hazardWorkroom = hazard.workroom.trim().toLowerCase()
            if (nWorkroom !== hazardWorkroom) return false

            const messageLower = (n.message || '').toLowerCase()
            const hazardMessageLower = hazard.message.toLowerCase()

            // Only check new format notifications (must contain ⚠️)
            if (!messageLower.includes('⚠️') || !hazardMessageLower.includes('⚠️')) {
              return false
            }

            // Check if same metric and workroom - use specific checks for each metric
            // Note: Messages no longer include workroom name (removed redundant naming)
            // Workroom is already matched above, so we only need to check the metric pattern
            
            // Extract metric identifier from message to ensure exact match
            const extractMetricFromMessage = (msg: string): string | null => {
              if (msg.includes('ltr') && msg.includes('performance is below standard')) return 'ltr'
              if (msg.includes('reschedule rate') && msg.includes('above target')) return 'reschedule_rate'
              if (msg.includes('job cycle time') && msg.includes('exceeds target')) return 'job_cycle_time'
              if (msg.includes('work order cycle time') && msg.includes('exceeds target')) return 'work_order_cycle_time'
              if (msg.includes('details cycle time') && msg.includes('exceeds target')) return 'details_cycle_time'
              if (msg.includes('vendor debits') && (msg.includes('above target') || msg.includes('ratio is above'))) return 'vendor_debits'
              return null
            }
            
            // Get metric identifiers for both messages
            const existingMetric = extractMetricFromMessage(messageLower)
            const hazardMetricKey = hazard.metric === 'LTR' ? 'ltr' :
                                   hazard.metric === 'Reschedule Rate' ? 'reschedule_rate' :
                                   hazard.metric === 'Job Cycle Time' ? 'job_cycle_time' :
                                   hazard.metric === 'Work Order Cycle Time' ? 'work_order_cycle_time' :
                                   hazard.metric === 'Details Cycle Time' ? 'details_cycle_time' :
                                   hazard.metric === 'Vendor Debits' ? 'vendor_debits' : null
            
            // If we can identify both metrics, compare them directly
            if (existingMetric && hazardMetricKey && existingMetric === hazardMetricKey) {
              return true // Same metric for same workroom = duplicate
            }
            
            // Fallback: use pattern matching for each metric type
            if (hazard.metric === 'LTR') {
              return messageLower.includes('ltr') && 
                     messageLower.includes('⚠️') &&
                     messageLower.includes('performance is below standard')
            }
            
            if (hazard.metric === 'Reschedule Rate') {
              return messageLower.includes('reschedule rate') && 
                     messageLower.includes('⚠️') &&
                     messageLower.includes('above target')
            }
            
            if (hazard.metric === 'Job Cycle Time') {
              return messageLower.includes('job cycle time') && 
                     messageLower.includes('⚠️') &&
                     messageLower.includes('exceeds target')
            }
            
            if (hazard.metric === 'Work Order Cycle Time') {
              // Work Order Cycle Time can have N/A value, so check for both patterns
              return messageLower.includes('work order cycle time') && 
                     messageLower.includes('⚠️') &&
                     (messageLower.includes('exceeds target') || messageLower.includes('n/a'))
            }
            
            if (hazard.metric === 'Details Cycle Time') {
              return messageLower.includes('details cycle time') && 
                     messageLower.includes('⚠️') &&
                     messageLower.includes('exceeds target')
            }
            
            if (hazard.metric === 'Vendor Debits') {
              return messageLower.includes('vendor debits') && 
                     messageLower.includes('⚠️') &&
                     (messageLower.includes('above target') || messageLower.includes('ratio is above'))
            }
            
            // Fallback: check metric name (workroom already matched above)
            return messageLower.includes(hazard.metric.toLowerCase()) && 
                   messageLower.includes('⚠️')
          })

          if (existingNotification) {
            console.log(`[Notifications] ⛔ Skipping ${hazard.metric} notification for ${hazard.workroom}: duplicate found (existing: "${existingNotification.message}")`)
          } else {
            console.log(`[Notifications] ✅ Creating hazard notification: ${hazard.workroom} - ${hazard.metric} - ${hazard.message}`)
            
            // Add delay between notifications to avoid sending all at once
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay between notifications
            }
            
            const notificationResponse = await fetch('/api/notifications', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authHeader}`,
              },
              body: JSON.stringify({
                workroom: hazard.workroom.trim(),
                message: hazard.message,
                type: 'warning',
              }),
            })

            if (notificationResponse.ok) {
              // Refresh after each notification to update the list
              await refreshNotifications()
              // Small delay after refresh
              await new Promise(resolve => setTimeout(resolve, 200))
            } else if (notificationResponse.status === 409) {
              console.log(`[Notifications] Duplicate prevented on server: ${hazard.metric} for ${hazard.workroom}`)
            } else {
              const error = await notificationResponse.json().catch(() => ({ error: 'Unknown error' }))
              console.error(`[Notifications] Failed to create notification:`, error)
            }
          }
        }
      } catch (error) {
        console.error('Error checking hazard signs:', error)
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkHazardSigns, 30000)
    checkHazardSigns() // Check immediately

    return () => clearInterval(interval)
  }, [user?.email, user?.role, data.workrooms, refreshNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length
  
  // Debug logging to help diagnose notification count issues
  useEffect(() => {
    if (notifications.length > 0) {
      console.log(`[Notifications] Total: ${notifications.length}, Unread: ${unreadCount}, Read: ${notifications.length - unreadCount}`)
    }
  }, [notifications, unreadCount])

  return (
    <WorkroomNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        deleteNotification,
      }}
    >
      {children}
    </WorkroomNotificationContext.Provider>
  )
}

export function useWorkroomNotifications() {
  const context = useContext(WorkroomNotificationContext)
  if (!context) {
    throw new Error('useWorkroomNotifications must be used within WorkroomNotificationProvider')
  }
  return context
}

