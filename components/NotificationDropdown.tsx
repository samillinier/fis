'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, Trash2 } from 'lucide-react'
import { useWorkroomNotifications } from './WorkroomNotificationContext'

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useWorkroomNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Force re-render when unreadCount changes
  useEffect(() => {
    console.log(`[NotificationDropdown] Rendering - unreadCount: ${unreadCount}, notifications count: ${notifications.length}`)
  }, [unreadCount, notifications.length])
  
  // Log when component mounts
  useEffect(() => {
    console.log('[NotificationDropdown] Component mounted')
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = async (notificationId: string) => {
    // Mark as read immediately - count will update right away
    await markAsRead([notificationId])
  }

  const handleFixNow = (e?: React.MouseEvent, notification?: any) => {
    if (e) {
      e.stopPropagation() // Prevent notification click if called from button
    }
    const workroom = notification?.workroom || (e?.currentTarget as any)?.closest('[data-workroom]')?.dataset?.workroom
    if (workroom) {
      // Navigate to reschedule rate form with workroom as query parameter
      router.push(`/reschedule-rate-form?workroom=${encodeURIComponent(workroom)}`)
      setIsOpen(false)
    }
  }

  const isRescheduleRateNotification = (message: string): boolean => {
    return message.toLowerCase().includes('reschedule rate')
  }

  const isLTRNotification = (message: string): boolean => {
    const messageLower = message.toLowerCase()
    return (
      messageLower.includes('⚠') &&
      messageLower.includes('ltr') &&
      messageLower.includes('performance is below standard')
    )
  }

  const handleFixNowLTR = (e?: React.MouseEvent, notification?: any) => {
    if (e) {
      e.stopPropagation() // Prevent notification click if called from button
    }
    const workroom = notification?.workroom || (e?.currentTarget as any)?.closest('[data-workroom]')?.dataset?.workroom
    if (workroom) {
      router.push(`/ltr-form?workroom=${encodeURIComponent(workroom)}`)
      setIsOpen(false)
    }
  }

  const isCycleTimeNotification = (message: string): boolean => {
    const messageLower = message.toLowerCase()
    // Only trigger for Job Cycle Time and Details Cycle Time, NOT Work Order Cycle Time
    return (messageLower.includes('job cycle time') || messageLower.includes('details cycle time')) && !messageLower.includes('work order cycle time')
  }

  const isWorkOrderCycleTimeNotification = (message: string): boolean => {
    const messageLower = message.toLowerCase()
    // Only match correct heatmap format: warning icon at the start
    return message.trim().startsWith('⚠') && 
           messageLower.includes('work order cycle time') &&
           (messageLower.includes('exceeds target') || messageLower.includes('n/a'))
  }

  const handleFixNowCycleTime = (e?: React.MouseEvent, notification?: any) => {
    if (e) {
      e.stopPropagation() // Prevent notification click if called from button
    }
    const workroom = notification?.workroom || (e?.currentTarget as any)?.closest('[data-workroom]')?.dataset?.workroom
    if (workroom) {
      const messageLower = (notification?.message || '').toLowerCase()
      // Check if it's Job Cycle Time notification - route to job cycle time form
      if (messageLower.includes('job cycle time') && !messageLower.includes('work order cycle time')) {
        router.push(`/job-cycle-time-form?workroom=${encodeURIComponent(workroom)}`)
      } else {
        // Details Cycle Time or other cycle time - route to work cycle time form
        router.push(`/work-cycle-time-form?workroom=${encodeURIComponent(workroom)}`)
      }
      setIsOpen(false)
    }
  }

  const handleFixNowWorkOrderCycleTime = (e?: React.MouseEvent, notification?: any) => {
    if (e) {
      e.stopPropagation() // Prevent notification click if called from button
    }
    const workroom = notification?.workroom || (e?.currentTarget as any)?.closest('[data-workroom]')?.dataset?.workroom
    if (workroom) {
      // Navigate to work order cycle time form with workroom as query parameter
      router.push(`/work-order-cycle-time-form?workroom=${encodeURIComponent(workroom)}`)
      setIsOpen(false)
    }
  }

  const isVendorDebitNotification = (message: string): boolean => {
    return message.toLowerCase().includes('vendor debit')
  }

  const handleFixNowVendorDebit = (e?: React.MouseEvent, notification?: any) => {
    if (e) {
      e.stopPropagation() // Prevent notification click if called from button
    }
    const workroom = notification?.workroom || (e?.currentTarget as any)?.closest('[data-workroom]')?.dataset?.workroom
    if (workroom) {
      // Navigate to vendor debit form with workroom as query parameter
      router.push(`/vendor-debit-form?workroom=${encodeURIComponent(workroom)}`)
      setIsOpen(false)
    }
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const isOldFormatNotification = (message: string): boolean => {
    const messageLower = message.toLowerCase()
    return messageLower.includes('has high') || 
           messageLower.includes('has low') || 
           messageLower.includes('score:') ||
           messageLower.includes('(score:') ||
           messageLower.includes('review ') ||
           messageLower.includes('review scheduling') ||
           messageLower.includes('customer communication') ||
           (!messageLower.includes('⚠')) // accept both ⚠ and ⚠️ as hazard-format
  }

  const handleDeleteOldFormatNotifications = async () => {
    const oldFormatNotifications = notifications.filter((n) => isOldFormatNotification(n.message))
    if (oldFormatNotifications.length > 0) {
      console.log(`[NotificationDropdown] Deleting ${oldFormatNotifications.length} old format notifications:`, oldFormatNotifications.map(n => n.message))
      const oldFormatIds = oldFormatNotifications.map((n) => n.id)
      await deleteNotification(oldFormatIds)
      setIsOpen(false) // Close dropdown after deletion
    }
  }

  // NOTE: Do NOT auto-delete notifications when the dropdown opens.
  // Auto-deletes cause notifications (like Reschedule Rate) to vanish before the user can see/click them.

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationDisplayDate = (notification: any) => {
    if (!notification?.is_read && notification?.updated_at) {
      return notification.updated_at
    }
    return notification?.created_at
  }

  return (
    <div className="relative" ref={dropdownRef} data-testid="notification-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Bell size={24} className="text-gray-600" style={{ display: 'block' }} />
        {unreadCount > 0 && (
          <span 
            key={`badge-${unreadCount}`}
            className={`absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ${
              unreadCount > 99 ? 'px-1.5 py-0.5 min-w-[1.5rem]' : 
              unreadCount > 9 ? 'px-1.5 py-0.5 min-w-[1.5rem]' : 
              'w-5 h-5'
            }`}
            style={{ zIndex: 10 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[32rem] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[32rem] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-3">
              {notifications.some((n) => isOldFormatNotification(n.message)) && (
                <button
                  onClick={handleDeleteOldFormatNotifications}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  title="Delete all old format notifications"
                >
                  Delete Old Format
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 bg-white">
            {(() => {
              // Filter notifications
              const filteredNotifications = notifications.filter((notification) => {
              const messageLower = (notification.message || '').toLowerCase()
              if (messageLower.includes('work order cycle time')) {
                return notification.message.trim().startsWith('⚠')
              }
              return true
              })

              if (filteredNotifications.length === 0) {
                return (
              <div className="p-4 text-center text-gray-500 text-sm bg-white">
                No notifications
              </div>
                )
              }

              // Group notifications by workroom (normalize workroom names)
              const groupedByWorkroom = filteredNotifications.reduce((acc, notification) => {
                const workroom = (notification.workroom || '').trim() || 'Unknown'
                if (!acc[workroom]) {
                  acc[workroom] = []
                }
                acc[workroom].push(notification)
                return acc
              }, {} as Record<string, typeof filteredNotifications>)

              // Sort workrooms: System first, then alphabetically
              const sortedWorkrooms = Object.keys(groupedByWorkroom).sort((a, b) => {
                if (a === 'System') return -1
                if (b === 'System') return 1
                return a.localeCompare(b)
              })

              console.log('[NotificationDropdown] Grouped notifications:', {
                total: filteredNotifications.length,
                workrooms: sortedWorkrooms,
                counts: sortedWorkrooms.map(w => ({ workroom: w, count: groupedByWorkroom[w].length }))
              })

              return (
                <div className="divide-y divide-gray-200">
                  {sortedWorkrooms.map((workroom) => {
                    const workroomNotifications = groupedByWorkroom[workroom]
                    const unreadCount = workroomNotifications.filter(n => !n.is_read).length

                    return (
                      <div key={workroom} className="bg-white">
                        {/* Workroom Header */}
                        <div className="sticky top-0 z-10 bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold text-sm ${
                              workroom === 'System' ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {workroom}
                            </h4>
                            {unreadCount > 0 && (
                              <span className="text-xs text-gray-500">
                                {unreadCount} unread
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Notifications for this workroom */}
              <div className="divide-y divide-gray-100">
                          {workroomNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors bg-white cursor-pointer ${
                      !notification.is_read ? 'bg-green-50' : ''
                    }`}
                    data-workroom={notification.workroom}
                    onClick={async (e) => {
                      e.stopPropagation()
                      
                      // Mark notification as read when clicked (unless it's already read)
                      if (!notification.is_read) {
                        console.log(`[NotificationDropdown] Clicking notification ${notification.id}, marking as read`)
                        markAsRead([notification.id]) // Don't await - let it update immediately
                      }
                      
                      // Then handle navigation or other actions
                      if (notification.workroom === 'System' && notification.message.toLowerCase().includes('access request')) {
                        // Navigate to Profile page for access requests
                        router.push('/profile')
                        setIsOpen(false)
                      } else if (isRescheduleRateNotification(notification.message)) {
                        handleFixNow(undefined, notification)
                      } else if (isLTRNotification(notification.message)) {
                        handleFixNowLTR(undefined, notification)
                      } else if (isWorkOrderCycleTimeNotification(notification.message)) {
                        handleFixNowWorkOrderCycleTime(undefined, notification)
                      } else if (isCycleTimeNotification(notification.message)) {
                        handleFixNowCycleTime(undefined, notification)
                      } else if (isVendorDebitNotification(notification.message)) {
                        handleFixNowVendorDebit(undefined, notification)
                      }
                      // If it's not a "Fix Now" notification, it's already marked as read above
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2 min-w-0">
                          {!notification.is_read && (
                                      <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                          )}
                                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 break-words whitespace-normal">
                                        <span>{notification.message}</span>
                        </p>
                        {(isRescheduleRateNotification(notification.message) ||
                          isLTRNotification(notification.message) ||
                          isWorkOrderCycleTimeNotification(notification.message) ||
                          isCycleTimeNotification(notification.message) ||
                          isVendorDebitNotification(notification.message)) && (
                          <div className="mt-1">
                            {isRescheduleRateNotification(notification.message) && (
                              <button
                                onClick={(e) => handleFixNow(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            )}
                            {isLTRNotification(notification.message) && (
                              <button
                                onClick={(e) => handleFixNowLTR(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            )}
                            {isWorkOrderCycleTimeNotification(notification.message) && (
                              <button
                                onClick={(e) => handleFixNowWorkOrderCycleTime(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            )}
                            {isCycleTimeNotification(notification.message) && (
                              <button
                                onClick={(e) => handleFixNowCycleTime(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            )}
                            {isVendorDebitNotification(notification.message) && (
                              <button
                                onClick={(e) => handleFixNowVendorDebit(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(getNotificationDisplayDate(notification))}
                        </p>
                                    </div>
                                    {notification.type === 'info' && (
                                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded flex-shrink-0">Info</span>
                                    )}
                                    {notification.type === 'error' && (
                                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded flex-shrink-0">Error</span>
                                    )}
                                  </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          await deleteNotification([notification.id])
                        }}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete notification"
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}





