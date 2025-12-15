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

  const refreshNotifications = useCallback(async () => {
    if (!user?.email) {
      setNotifications([])
      return
    }

    setLoading(true)
    try {
      const authHeader = user.email
      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const allNotifications = result.notifications || []
        
        // FILTER OUT old format notifications - don't even show them
        const newFormatOnly = allNotifications.filter((n: any) => {
          const messageLower = (n.message || '').toLowerCase()
          // Only keep notifications with ⚠️ (new format)
          return messageLower.includes('⚠️')
        })
        
        // If there were old format notifications, delete them from database
        const oldFormatNotifications = allNotifications.filter((n: any) => {
          const messageLower = (n.message || '').toLowerCase()
          return !messageLower.includes('⚠️')
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
        
        console.log(`[refreshNotifications] Showing ${newFormatOnly.length} new format notifications (filtered out ${oldFormatNotifications.length} old format)`)
        setNotifications(newFormatOnly)
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
            ltrScore = 50 // Neutral if no data
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

          let workOrderCycleTimeScore = 50
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
          // Heatmap shows hazard when ltrScore < 70 (including when score = 0)
          if (ltrScore < threshold) {
            // Get the LTR value to display - MUST match VisualBreakdown display logic exactly
            // VisualBreakdown line 959: value: avgLTRFromSurvey != null ? avgLTRFromSurvey : (ltrPercent > 0 ? ltrPercent : null)
            // VisualBreakdown line 1319: displays value with % only if avgLTRFromSurvey is null
            let ltrValue = ''
            if (avgLTRFromSurvey != null) {
              // avgLTRFromSurvey can be 0, which is valid - display it without %
              ltrValue = `${avgLTRFromSurvey.toFixed(1)}`
            } else if (ltrPercent > 0) {
              // Only use ltrPercent if it's > 0 (VisualBreakdown checks ltrPercent > 0)
              ltrValue = `${ltrPercent.toFixed(1)}%`
            }
            
            if (ltrValue) {
              console.log(`[Notifications] ✅ LTR hazard detected for ${w.name}: score=${ltrScore.toFixed(1)}, value=${ltrValue}, avgLTRFromSurvey=${avgLTRFromSurvey}, ltrPercent=${ltrPercent}`)
              const ltrHazard = {
                workroom: w.name,
                metric: 'LTR',
                message: `LTR performance is below standard ⚠️ ${ltrValue}`
              }
              console.log(`[Notifications] 📝 Adding LTR hazard to array:`, ltrHazard)
              hazards.push(ltrHazard)
            } else {
              console.log(`[Notifications] ❌ LTR hazard for ${w.name} skipped: no valid value (avgLTRFromSurvey=${avgLTRFromSurvey}, ltrPercent=${ltrPercent})`)
            }
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

          if (workOrderCycleTimeScore < threshold && workOrderCycleTimeScore > 0 && cycleTimeValue != null && cycleTimeValue > 0) {
            hazards.push({
              workroom: w.name,
              metric: 'Work Order Cycle Time',
              message: `Work Order Cycle Time exceeds target ⚠️ ${cycleTimeValue.toFixed(1)}d`
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

            // Check if same metric and workroom
            if (hazard.metric === 'LTR') {
              return messageLower.includes('ltr') && messageLower.includes(hazardWorkroom)
            }
            
            // For other metrics, check metric name and workroom
            return messageLower.includes(hazard.metric.toLowerCase()) && 
                   messageLower.includes(hazardWorkroom)
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

