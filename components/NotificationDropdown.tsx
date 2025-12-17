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
    console.log(`[NotificationDropdown] unreadCount changed to: ${unreadCount}`)
  }, [unreadCount])

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
    return messageLower.includes('ltr') && messageLower.includes('⚠️')
  }

  const handleFixNowLTR = (e?: React.MouseEvent, notification?: any) => {
    if (e) {
      e.stopPropagation() // Prevent notification click if called from button
    }
    const workroom = notification?.workroom || (e?.currentTarget as any)?.closest('[data-workroom]')?.dataset?.workroom
    if (workroom) {
      // Navigate to LTR form with workroom as query parameter
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
    return message.toLowerCase().includes('work order cycle time')
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
           messageLower.includes('rate:') ||
           messageLower.includes('(rate:') ||
           messageLower.includes('review ') ||
           messageLower.includes('review scheduling') ||
           messageLower.includes('customer communication') ||
           (!messageLower.includes('⚠️'))
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

  // Auto-delete old format notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const oldFormatNotifications = notifications.filter((n) => isOldFormatNotification(n.message))
      if (oldFormatNotifications.length > 0) {
        console.log(`[NotificationDropdown] Auto-deleting ${oldFormatNotifications.length} old format notifications`)
        const oldFormatIds = oldFormatNotifications.map((n) => n.id)
        deleteNotification(oldFormatIds)
      }
    }
  }, [isOpen, notifications])

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span 
            key={`badge-${unreadCount}`}
            className={`absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ${
              unreadCount > 99 ? 'px-1.5 py-0.5 min-w-[1.5rem]' : 
              unreadCount > 9 ? 'px-1.5 py-0.5 min-w-[1.5rem]' : 
              'w-5 h-5'
            }`}
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
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm bg-white">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                          <span className={`font-medium text-sm ${
                            notification.workroom === 'System' ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {notification.workroom}
                          </span>
                          {notification.type === 'info' && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Info</span>
                          )}
                          {notification.type === 'error' && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">Error</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">
                          {notification.message}
                          {isRescheduleRateNotification(notification.message) && (
                            <span className="ml-2">
                              <button
                                onClick={(e) => handleFixNow(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            </span>
                          )}
                          {isLTRNotification(notification.message) && (
                            <span className="ml-2">
                              <button
                                onClick={(e) => handleFixNowLTR(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            </span>
                          )}
                          {isWorkOrderCycleTimeNotification(notification.message) && (
                            <span className="ml-2">
                              <button
                                onClick={(e) => handleFixNowWorkOrderCycleTime(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            </span>
                          )}
                          {isCycleTimeNotification(notification.message) && (
                            <span className="ml-2">
                              <button
                                onClick={(e) => handleFixNowCycleTime(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            </span>
                          )}
                          {isVendorDebitNotification(notification.message) && (
                            <span className="ml-2">
                              <button
                                onClick={(e) => handleFixNowVendorDebit(e, notification)}
                                className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                              >
                                Fix Now
                              </button>
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}



