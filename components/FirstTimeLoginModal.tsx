'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import { X, UserCircle, Building2 } from 'lucide-react'

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

const ROLES = ['GM', 'PC', 'Corporate', 'Other'] as const

export default function FirstTimeLoginModal() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [show, setShow] = useState(false)
  const [workroom, setWorkroom] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.email) {
      checkProfile()
    }
  }, [user?.email])

  const checkProfile = async () => {
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
        // Show modal if workroom or role is not set
        if (!data.workroom || !data.role) {
          setWorkroom(data.workroom || '')
          setRole(data.role || '')
          setShow(true)
        }
      } else {
        // Try localStorage as fallback
        const stored = localStorage.getItem('fis-user-profile')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (!parsed.workroom || !parsed.role) {
            setWorkroom(parsed.workroom || '')
            setRole(parsed.role || '')
            setShow(true)
          }
        } else {
          // No profile at all - show modal
          setShow(true)
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      // On error, check localStorage
      const stored = localStorage.getItem('fis-user-profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!parsed.workroom || !parsed.role) {
          setWorkroom(parsed.workroom || '')
          setRole(parsed.role || '')
          setShow(true)
        }
      } else {
        setShow(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.email || !workroom || !role) {
      showNotification('Please select both workroom and role', 'error')
      return
    }

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
        localStorage.setItem('fis-user-profile', JSON.stringify({ workroom, role }))
        setShow(false)
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

  if (!show || loading) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full relative overflow-hidden">
        {/* Header with user photo */}
        <div className="px-6 py-5 border-b border-gray-200" style={{ background: '#80875d' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name || user.email}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 text-white flex items-center justify-center border-4 border-white shadow-md">
                  <UserCircle size={32} />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                </h2>
                <p className="text-sm text-white text-opacity-90 mt-1">
                  Let's set up your profile to get started
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Don't allow closing without saving if both fields are empty
                if (!workroom && !role) {
                  showNotification('Please set your workroom and role to continue', 'error')
                  return
                }
                // If at least one is set, allow closing (user can complete later)
                setShow(false)
              }}
              className="text-white text-opacity-80 hover:text-white transition-colors p-1 hover:bg-white hover:bg-opacity-20 rounded-full"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Building2 size={16} className="text-gray-500" />
                <span>Workroom <span className="text-red-500">*</span></span>
              </label>
              <select
                value={workroom}
                onChange={(e) => setWorkroom(e.target.value)}
                className="w-full border-2 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white hover:border-gray-400"
                style={{ borderColor: workroom ? '#80875d' : '#d1d5db' }}
                onFocus={(e) => e.target.style.borderColor = '#80875d'}
                onBlur={(e) => e.target.style.borderColor = workroom ? '#80875d' : '#d1d5db'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <UserCircle size={16} className="text-gray-500" />
                <span>Role <span className="text-red-500">*</span></span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border-2 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white hover:border-gray-400"
                style={{ borderColor: role ? '#80875d' : '#d1d5db' }}
                onFocus={(e) => e.target.style.borderColor = '#80875d'}
                onBlur={(e) => e.target.style.borderColor = role ? '#80875d' : '#d1d5db'}
              >
                <option value="">Select a role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !workroom || !role}
              className="flex-1 inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm hover:shadow-md"
              style={{ 
                backgroundColor: (!workroom || !role) ? '#9ca3af' : '#80875d',
              }}
              onMouseEnter={(e) => {
                if (workroom && role) {
                  e.currentTarget.style.backgroundColor = '#6b7350'
                }
              }}
              onMouseLeave={(e) => {
                if (workroom && role) {
                  e.currentTarget.style.backgroundColor = '#80875d'
                }
              }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save & Continue</span>
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              You can update these settings anytime from your Profile page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}





