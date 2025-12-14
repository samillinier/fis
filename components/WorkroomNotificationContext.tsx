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
        const fetchedNotifications = result.notifications || []
        console.log(`[refreshNotifications] Fetched ${fetchedNotifications.length} notifications from server`)
        // Show all notifications (read and unread) - sorted by date
        setNotifications(fetchedNotifications)
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

  // Refresh notifications on mount and when user changes
  useEffect(() => {
    refreshNotifications()
    
    // Also refresh periodically to keep count up to date
    const interval = setInterval(() => {
      refreshNotifications()
    }, 5000) // Refresh every 5 seconds to keep count accurate
    
    return () => clearInterval(interval)
  }, [refreshNotifications])

  // Check for low scores and create notifications
  useEffect(() => {
    if (!user?.email || !data.workrooms.length) return

    const checkLowScores = async () => {
      try {
        // Get user profile to find their workroom
        const authHeader = user.email
        const profileResponse = await fetch('/api/user-profile', {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        })

        if (!profileResponse.ok) return

        const profile = await profileResponse.json()
        if (!profile.workroom) return

        // Find workrooms matching user's workroom
        const userWorkrooms = data.workrooms.filter((w) => {
          const normalizedName = (w.name || '').trim()
          return normalizedName === profile.workroom
        })

        if (userWorkrooms.length === 0) return

        // Get the workroom data for this user's workroom
        const workroomData = userWorkrooms[0]
        if (!workroomData) return

        // Calculate individual component scores
        const componentScores = calculateComponentScores(workroomData, data.workrooms)
        const threshold = 70

        // Check each component and create separate notifications for low scores
        const lowScoreComponents: Array<{ name: string; message: string; score: number }> = []

        // Check LTR Score
        if (componentScores.ltrScore < threshold && componentScores.ltrScore > 0) {
          const ltrValue = componentScores.ltrPercent 
            ? `${componentScores.ltrPercent.toFixed(1)}%` 
            : componentScores.ltrScore.toFixed(1)
          lowScoreComponents.push({
            name: 'LTR',
            message: `${profile.workroom} has low LTR performance (Score: ${componentScores.ltrScore.toFixed(1)}${componentScores.ltrPercent ? `, LTR%: ${ltrValue}` : ''}). Review labor efficiency and customer satisfaction metrics.`,
            score: componentScores.ltrScore
          })
        }

        // Check Job Cycle Time Score
        if (componentScores.cycleJobsScore < threshold && componentScores.cycleJobsScore > 0) {
          const cycleTimeValue = componentScores.avgJobsWorkCycleTime 
            ? `${componentScores.avgJobsWorkCycleTime.toFixed(1)} days` 
            : ''
          lowScoreComponents.push({
            name: 'Job Cycle Time',
            message: `${profile.workroom} has high Job Cycle Time (Score: ${componentScores.cycleJobsScore.toFixed(1)}${cycleTimeValue ? `, Avg: ${cycleTimeValue}` : ''}). Review job scheduling and completion processes.`,
            score: componentScores.cycleJobsScore
          })
        }

        // Check Work Order Cycle Time Score - Use "Job Cycle Time" for notifications
        if (componentScores.workOrderCycleTimeScore < threshold && componentScores.workOrderCycleTimeScore > 0) {
          const cycleTimeValue = componentScores.avgCycleTime 
            ? `${componentScores.avgCycleTime.toFixed(1)} days` 
            : ''
          lowScoreComponents.push({
            name: 'Job Cycle Time',
            message: `${profile.workroom} has high Job Cycle Time (Score: ${componentScores.workOrderCycleTimeScore.toFixed(1)}${cycleTimeValue ? `, Avg: ${cycleTimeValue}` : ''}). Review job scheduling and completion processes.`,
            score: componentScores.workOrderCycleTimeScore
          })
        }

        // Check Details Cycle Time - Caution triggers at > 5 days
        if (componentScores.avgDetailsCycleTime != null && componentScores.avgDetailsCycleTime > 5) {
          const cycleTimeValue = componentScores.avgDetailsCycleTime 
            ? `${componentScores.avgDetailsCycleTime.toFixed(1)} days` 
            : ''
          lowScoreComponents.push({
            name: 'Details Cycle Time',
            message: `${profile.workroom} has high Details Cycle Time (Avg: ${cycleTimeValue}). Review detail processing workflow.`,
            score: componentScores.detailsCycleTimeScore
          })
        }

        // Check Reschedule Rate Score
        if (componentScores.rescheduleRateScore < threshold && componentScores.rescheduleRateScore > 0) {
          const rateValue = componentScores.avgRescheduleRate 
            ? `${componentScores.avgRescheduleRate.toFixed(1)}%` 
            : ''
          lowScoreComponents.push({
            name: 'Reschedule Rate',
            message: `${profile.workroom} has high Reschedule Rate (Score: ${componentScores.rescheduleRateScore.toFixed(1)}${rateValue ? `, Rate: ${rateValue}` : ''}). Review scheduling accuracy and customer communication.`,
            score: componentScores.rescheduleRateScore
          })
        }

        // Check Vendor Debits Score
        if (componentScores.vendorDebitsScore < threshold && componentScores.vendorDebitsScore > 0) {
          const ratioValue = componentScores.vendorDebitRatio 
            ? `${componentScores.vendorDebitRatio.toFixed(1)}%` 
            : ''
          lowScoreComponents.push({
            name: 'Vendor Debits',
            message: `${profile.workroom} has high Vendor Debit ratio (Score: ${componentScores.vendorDebitsScore.toFixed(1)}${ratioValue ? `, Ratio: ${ratioValue}` : ''}). Review vendor relationships and cost control.`,
            score: componentScores.vendorDebitsScore
          })
        }

        // Create separate notifications for each low score component
        // Only create one notification per metric type (LTR, Job Cycle Time, etc.)
        for (const component of lowScoreComponents) {
          // Check if notification already exists for this specific component/metric type
          // Use a more specific check to avoid duplicates
          const metricKey = component.name.toLowerCase().replace(/\s+/g, '-') // e.g., "job-cycle-time"
          // Check for duplicates - look at ALL notifications (read and unread) to prevent duplicates
          const existingNotification = notifications.find(
            (n) => {
              // Must be same workroom
              if (n.workroom !== profile.workroom) return false
              
              // Check if message contains the specific metric name
              const messageLower = n.message.toLowerCase()
              const metricNameLower = component.name.toLowerCase()
              
              // More precise matching - check if the metric name appears in a specific context
              // For LTR: check for "low ltr" or "ltr performance"
              // For Job Cycle Time: check for "job cycle time"
              // For Work Order Cycle Time: check for "work order cycle time"
              // etc.
              if (component.name === 'LTR') {
                return messageLower.includes('low ltr') || messageLower.includes('ltr performance')
              } else if (component.name === 'Job Cycle Time') {
                return messageLower.includes('job cycle time') && !messageLower.includes('work order')
              } else if (component.name === 'Details Cycle Time') {
                return messageLower.includes('details cycle time')
              } else if (component.name === 'Reschedule Rate') {
                return messageLower.includes('reschedule rate')
              } else if (component.name === 'Vendor Debits') {
                return messageLower.includes('vendor debit')
              }
              
              return messageLower.includes(metricNameLower)
            }
          )

          if (!existingNotification) {
            const notificationResponse = await fetch('/api/notifications', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authHeader}`,
              },
              body: JSON.stringify({
                workroom: profile.workroom,
                message: component.message,
                type: 'warning',
              }),
            })

            if (notificationResponse.ok) {
              // Refresh notifications after creating each one
              await refreshNotifications()
            } else if (notificationResponse.status === 409) {
              // 409 Conflict means duplicate was detected on server side
              console.log(`[Notifications] Duplicate prevented on server: ${component.name}`)
              // Don't refresh, just skip
            }
          } else {
            // If notification already exists locally, skip creating it
            console.log(`[Notifications] Duplicate prevented locally: ${component.name}`)
          }
        }
      } catch (error) {
        console.error('Error checking low scores:', error)
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkLowScores, 30000)
    checkLowScores() // Check immediately

    return () => clearInterval(interval)
  }, [user?.email, data.workrooms, notifications, refreshNotifications])

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

