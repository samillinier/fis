import type { DashboardData } from '@/context/DataContext'

export interface ActivityEvent {
  id: string
  userEmail: string
  userName?: string
  action: string
  details?: string
  timestamp: string
}

const STORAGE_KEY = 'fis-activity-log'

function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('fis-user')
  if (!stored) return null
  try {
    return JSON.parse(stored) as { email?: string; name?: string }
  } catch {
    return null
  }
}

export function recordActivity(action: string, details?: string) {
  if (typeof window === 'undefined') return

  const user = getCurrentUser()
  if (!user?.email) return

  const event: ActivityEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userEmail: user.email,
    userName: user.name,
    action,
    details,
    timestamp: new Date().toISOString(),
  }

  try {
    const existing = loadActivity()
    const updated = [event, ...existing].slice(0, 100)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error recording activity:', error)
  }
}

export function loadActivity(): ActivityEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as ActivityEvent[]
  } catch (error) {
    console.error('Error loading activity log:', error)
    return []
  }
}

export function clearActivityLog() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing activity log:', error)
  }
}










