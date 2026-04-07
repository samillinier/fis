'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface ChatNotificationContextType {
  unreadCount: number
  hasUnread: boolean
  lastCheckedAt: string | null
  markAsRead: () => void
  refreshUnread: () => void
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined)

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)

  // Load last checked time from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.email) {
      const stored = localStorage.getItem(`chat-last-checked-${user.email}`)
      if (stored) {
        setLastCheckedAt(stored)
      } else {
        // If no stored time, set to now (don't show notifications for old conversations)
        const now = new Date().toISOString()
        setLastCheckedAt(now)
        localStorage.setItem(`chat-last-checked-${user.email}`, now)
      }
    }
  }, [user?.email])

  const refreshUnread = useCallback(async () => {
    if (!user?.email || !lastCheckedAt) return

    try {
      const response = await fetch('/api/lowes-chat/conversations/all', {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${user.email}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const conversations = data.conversations || []
        const lastChecked = new Date(lastCheckedAt)

        const newConversations = conversations.filter((conv: any) => {
          const createdAt = new Date(conv.created_at)
          const lastMessageAt = conv.last_message_at ? new Date(conv.last_message_at) : null
          if (createdAt > lastChecked) return true
          if (lastMessageAt && lastMessageAt > lastChecked) return true
          return false
        })

        setUnreadCount(newConversations.length)
      }
    } catch (error) {
      console.error('Error checking for new conversations:', error)
    }
  }, [user?.email, lastCheckedAt])

  // Poll for new conversations (and refresh on focus/visibility)
  useEffect(() => {
    if (!user?.email || !lastCheckedAt) return

    refreshUnread()

    const onVisibility = () => {
      if (document.hidden) return
      refreshUnread()
    }
    const onFocus = () => refreshUnread()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    // More responsive badge updates
    const interval = setInterval(refreshUnread, 3000)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [user?.email, lastCheckedAt, refreshUnread])

  // Mark as read (update last checked time)
  const markAsRead = useCallback(() => {
    if (user?.email) {
      const now = new Date().toISOString()
      setLastCheckedAt(now)
      localStorage.setItem(`chat-last-checked-${user.email}`, now)
      setUnreadCount(0)
    }
  }, [user?.email])

  return (
    <ChatNotificationContext.Provider value={{ unreadCount, hasUnread: unreadCount > 0, lastCheckedAt, markAsRead, refreshUnread }}>
      {children}
    </ChatNotificationContext.Provider>
  )
}

export function useChatNotification() {
  const context = useContext(ChatNotificationContext)
  if (context === undefined) {
    throw new Error('useChatNotification must be used within a ChatNotificationProvider')
  }
  return context
}
