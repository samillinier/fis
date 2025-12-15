'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useData } from '@/context/DataContext'

interface UserProfileProps {
  onComplete: () => void
}

export default function UserProfile({ onComplete }: UserProfileProps) {
  const { user } = useAuth()
  const { data } = useData()
  const [workroom, setWorkroom] = useState('')
  const [role, setRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get unique workrooms from data
  const isValidWorkroomName = (name: string): boolean => {
    const normalizedName = (name || '').toLowerCase().trim()
    return (
      normalizedName !== 'location #' &&
      normalizedName !== 'location' &&
      normalizedName !== '' &&
      !normalizedName.includes('location #')
    )
  }

  const uniqueWorkrooms = Array.from(
    new Set(
      data.workrooms
        .filter((w) => isValidWorkroomName(w.name || ''))
        .map((w) => w.name)
        .filter(Boolean)
    )
  ).sort()

  // Common roles
  const roles = ['GM', 'PC', 'Corporate', 'Manager', 'Supervisor', 'Analyst', 'Other']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workroom || !role) {
      setError('Please select both workroom and role')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const userStr = localStorage.getItem('fis-user')
      if (!userStr) {
        throw new Error('User not found')
      }

      const userEmail = JSON.parse(userStr).email
      const authHeader = `Bearer ${userEmail}`

      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workroom, role }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save profile')
      }

      // Save to localStorage as backup
      const profileData = { workroom, role }
      localStorage.setItem('fis-user-profile', JSON.stringify(profileData))

      onComplete()
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600 mb-6">
          Please tell us about your workroom and role to personalize your experience.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workroom" className="block text-sm font-medium text-gray-700 mb-2">
              Workroom *
            </label>
            <select
              id="workroom"
              value={workroom}
              onChange={(e) => setWorkroom(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80875d] focus:border-transparent"
              required
            >
              <option value="">Select your workroom</option>
              {uniqueWorkrooms.length > 0 ? (
                uniqueWorkrooms.map((wr) => (
                  <option key={wr} value={wr}>
                    {wr}
                  </option>
                ))
              ) : (
                <option value="Other">Other (No workrooms loaded)</option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80875d] focus:border-transparent"
              required
            >
              <option value="">Select your role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !workroom || !role}
              className="px-4 py-2 bg-[#80875d] text-white rounded-md hover:bg-[#6d7350] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
