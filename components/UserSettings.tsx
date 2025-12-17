'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'

const WORKROOMS = [
  'Albany',
  'Dothan',
  'Gainesville',
  'Lakeland',
  'Naples',
  'Ocala',
  'Panama City',
  'Sarasota',
  'Tallahassee',
  'Tampa',
]

const ROLES = ['GM', 'PC', 'Corporate', 'President', 'Other'] as const

export default function UserSettings() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [workroom, setWorkroom] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.email) {
      loadProfile()
    }
  }, [user?.email])

  const loadProfile = async () => {
    if (!user?.email) return

    setLoading(true)
    try {
      const authHeader = user.email
      const response = await fetch('/api/user-profile', {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWorkroom(data.workroom || '')
        setRole(data.role || '')
      } else {
        // Try localStorage as fallback
        const stored = localStorage.getItem('fis-user-profile')
        if (stored) {
          const parsed = JSON.parse(stored)
          setWorkroom(parsed.workroom || '')
          setRole(parsed.role || '')
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Try localStorage as fallback
      const stored = localStorage.getItem('fis-user-profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        setWorkroom(parsed.workroom || '')
        setRole(parsed.role || '')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user?.email) return

    setSaving(true)
    try {
      const authHeader = user.email
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authHeader}`,
        },
        body: JSON.stringify({ workroom, role }),
      })

      if (response.ok) {
        showNotification('Profile saved successfully', 'success')
        // Also save to localStorage
        localStorage.setItem('fis-user-profile', JSON.stringify({ workroom, role }))
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || 'Failed to save profile'
        console.error('Profile save error:', errorMessage)
        showNotification(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      showNotification('Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User Profile Settings</h2>
        <p className="text-sm text-gray-600">
          Set your workroom and role to receive notifications about low performance scores.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workroom
          </label>
          <select
            value={workroom}
            onChange={(e) => setWorkroom(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a workroom</option>
            {WORKROOMS.map((wr) => (
              <option key={wr} value={wr}>
                {wr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving || !workroom || !role}
          className="w-full bg-[#80875d] text-white px-4 py-2 rounded-md hover:bg-[#6d7350] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}



