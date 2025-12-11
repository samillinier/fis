'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthContext'
import { loadActivity, type ActivityEvent } from '@/lib/activityLog'
import { useNotification } from '@/components/NotificationContext'
import { Shield, Trash2, UserPlus } from 'lucide-react'

export default function ProfilePage() {
  const {
    authorizedUsers,
    addAuthorizedUser,
    removeAuthorizedUser,
    isAdmin,
    user,
    accessRequests,
    approveAccessRequest,
    rejectAccessRequest,
    setUserRole,
  } = useAuth()
  const { showNotification } = useNotification()
  const router = useRouter()
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  useEffect(() => {
    if (!isAdmin) {
      router.push('/')
    }
  }, [isAdmin, router])

  useEffect(() => {
    // Load recent activity on mount
    if (typeof window !== 'undefined') {
      setActivity(loadActivity())
    }
  }, [])

  const sortedUsers = useMemo(
    () =>
      [...authorizedUsers].sort((a, b) => {
        const aAdmin = a.role === 'admin'
        const bAdmin = b.role === 'admin'
        if (aAdmin !== bAdmin) return aAdmin ? -1 : 1

        const aActive = a.isActive !== false
        const bActive = b.isActive !== false
        if (aActive !== bActive) return aActive ? -1 : 1

        return a.email.localeCompare(b.email)
      }),
    [authorizedUsers]
  )

  const handleAdd = async () => {
    if (!newEmail.trim()) {
      showNotification('Email is required', 'error')
      return
    }
    const success = await addAuthorizedUser(newEmail, newName)
    if (success) {
      showNotification('User added to allowlist', 'success')
      setNewEmail('')
      setNewName('')
    } else {
      showNotification('Could not add user (already allowed or not permitted)', 'error')
    }
  }

  const handleRemove = async (email: string) => {
    const success = await removeAuthorizedUser(email)
    if (success) {
      showNotification('User removed from allowlist', 'success')
    } else {
      showNotification('Unable to remove this user', 'error')
    }
  }

  const handleApproveRequest = async (email: string) => {
    const success = await approveAccessRequest(email)
    if (success) {
      showNotification('User approved and can now sign in.', 'success')
    } else {
      showNotification('Could not approve this user. They may already be allowed.', 'error')
    }
  }

  const handleRejectRequest = async (email: string) => {
    await rejectAccessRequest(email)
    showNotification('Request removed.', 'success')
  }

  const handleRoleChange = async (email: string, role: 'admin' | 'user') => {
    const success = await setUserRole(email, role)
    if (success) {
      showNotification('Role updated.', 'success')
    } else {
      showNotification('Could not update role for this user.', 'error')
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-3xl mx-auto w-full bg-white rounded-xl shadow p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-50 text-emerald-700">
              <Shield />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Profile & Access Control</h1>
              <p className="text-sm text-gray-600">
                Manage who is allowed to sign in. Only admins can change this list.
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2"
              />
              <input
                type="text"
                placeholder="Name (optional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2"
              />
              <button
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
              >
                <UserPlus size={18} />
                Add User
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Allowed Users</h2>
            <div className="border rounded-lg divide-y">
              {sortedUsers.map((entry) => {
                const isSelf = user?.email?.toLowerCase() === entry.email.toLowerCase()
                const isSuperAdmin = entry.email.toLowerCase() === 'sbiru@fiscorponline.com'
                return (
                  <div
                    key={entry.email}
                    className="flex items-center justify-between px-4 py-3 bg-white gap-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{entry.email}</p>
                      <p className="text-sm text-gray-500">
                        {entry.name ? `${entry.name} • ` : ''}
                        {entry.role === 'admin' ? 'Admin' : 'User'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={entry.role === 'admin' ? 'admin' : 'user'}
                        onChange={(e) =>
                          handleRoleChange(
                            entry.email,
                            e.target.value as 'admin' | 'user'
                          )
                        }
                        disabled={isSuperAdmin}
                        className="border rounded-md px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {isSelf && (
                        <span className="text-xs text-gray-500">You</span>
                      )}
                      <button
                        onClick={() => handleRemove(entry.email)}
                        className="text-red-600 hover:text-red-700 inline-flex items-center gap-1 text-sm"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Access Requests</h2>
            {accessRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests.</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {accessRequests
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.requestedAt).getTime() -
                      new Date(a.requestedAt).getTime()
                  )
                  .map((request) => (
                    <div
                      key={request.email}
                      className="flex items-center justify-between px-4 py-3 bg-white"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.name ? `${request.name} • ` : ''}
                          Requested via {request.source} on{' '}
                          {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.email)}
                          className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.email)}
                          className="text-red-600 hover:text-red-700 inline-flex items-center gap-1 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Changes</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent changes recorded on this device.</p>
            ) : (
              <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                {activity.map((event) => (
                  <div
                    key={event.id}
                    className="px-4 py-3 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {event.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event.userEmail}
                        {event.userName ? ` • ${event.userName}` : ''}
                      </p>
                      {event.details && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.details}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 sm:text-right">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
