'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LowesChatIntake, { IntakeData } from '@/components/LowesChatIntake'

interface Conversation {
  id: string
  conversation_key: string
  lowes_email: string
  user_name: string
  user_role: string
  district_store: string
  quote_ims_number: string
  flooring_category: string
  question_types: string[]
  status: string
  created_at: string
  last_message_at: string
  group_name?: string
}

export default function LowesDashboardPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userGroupName, setUserGroupName] = useState<string>('')
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Format last activity time
  const formatLastActivity = (dateString: string) => {
    if (!dateString) return 'No activity'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString)
        return 'Invalid date'
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffMinutes = Math.floor(diffMs / 60000)
      
      // Always get the time string - ensure it's formatted correctly
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes.toString().padStart(2, '0')
      const timeString = `${displayHours}:${displayMinutes} ${ampm}`
      
      // Always show time, even for today
      if (diffDays === 0) {
        if (diffHours === 0) {
          if (diffMinutes < 1) {
            return `Just now`
          }
          return `${diffMinutes}m ago at ${timeString}`
        }
        // Always show time for today
        return `Today at ${timeString}`
      } else if (diffDays === 1) {
        return `Yesterday at ${timeString}`
      } else if (diffDays < 7) {
        return `${diffDays}d ago at ${timeString}`
      } else {
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeString}`
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      // Fallback: show raw date/time if formatting fails
      try {
        const fallbackDate = new Date(dateString)
        return fallbackDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      } catch (e) {
        return 'Invalid date'
      }
    }
  }

  // Check if logged in and get current user
  useEffect(() => {
    const teamMember = localStorage.getItem('lowes-team-member')
    if (!teamMember) {
      router.push('/lowes/login')
      return
    }
    try {
      const memberData = JSON.parse(teamMember)
      setCurrentUser(memberData)
      
      // Fetch group name from database using user's email
      // This ensures we get the latest group assignment even if admin assigned them
      fetch(`/api/lowes-groups/user-group?email=${encodeURIComponent(memberData.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.groupName) {
            setUserGroupName(data.groupName)
          }
        })
        .catch(err => console.error('Error fetching group name:', err))
    } catch (error) {
      console.error('Error parsing team member data:', error)
    }
  }, [router])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const teamMember = localStorage.getItem('lowes-team-member')
        if (!teamMember) {
          router.push('/lowes/login')
          return
        }

        const memberData = JSON.parse(teamMember)

        // Fetch all conversations with auth header and user's district/store
        const response = await fetch('/api/lowes-chat/conversations/all', {
          headers: {
            'Authorization': `Bearer ${memberData.email}`,
            'x-user-district': memberData.district || '',
            'x-user-store-number': memberData.storeNumber || ''
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || errorData.details || 'Failed to fetch conversations')
        }

        const data = await response.json()
        setConversations(data.conversations || [])
        setError(null) // Clear any previous errors
      } catch (err: any) {
        console.error('Error fetching conversations:', err)
        setError(err.message || 'Failed to load conversations')
      } finally {
        setIsLoading(false)
      }
    }

    const teamMember = localStorage.getItem('lowes-team-member')
    if (teamMember) {
      fetchConversations()
      // Refresh every 30 seconds
      const interval = setInterval(fetchConversations, 30000)
      return () => clearInterval(interval)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('lowes-team-member')
    router.push('/lowes/login')
  }

  const handleProfileClick = () => {
    setShowProfileModal(true)
    setShowProfileDropdown(false)
  }

  const handleIntakeSubmit = async (data: IntakeData) => {
    setIsCreatingConversation(true)
    setError(null)

    try {
      const teamMember = localStorage.getItem('lowes-team-member')
      if (!teamMember) {
        router.push('/lowes/login')
        return
      }

      const memberData = JSON.parse(teamMember)

      const response = await fetch('/api/lowes-chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${memberData.email}`,
          'x-user-district': memberData.district || '',
          'x-user-store-number': memberData.storeNumber || ''
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || 'Failed to create conversation'
        console.error('Failed to create conversation:', errorData)
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setShowIntakeForm(false)
      // Refresh conversations list
      const fetchConversations = async () => {
        const teamMember = localStorage.getItem('lowes-team-member')
        if (!teamMember) return

        const memberData = JSON.parse(teamMember)
        const response = await fetch('/api/lowes-chat/conversations/all', {
          headers: {
            'Authorization': `Bearer ${memberData.email}`,
            'x-user-district': memberData.district || '',
            'x-user-store-number': memberData.storeNumber || ''
          }
        })

        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error refreshing conversations:', errorData)
        }
      }
      await fetchConversations()
      // Navigate to the new conversation
      router.push(`/lowes/chat/${result.conversation.id}`)
    } catch (err: any) {
      console.error('Error creating conversation:', err)
      setError(err.message || 'Failed to create conversation')
    } finally {
      setIsCreatingConversation(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    setDeletingConversationId(conversationId)
    setError(null)

    try {
      const teamMember = localStorage.getItem('lowes-team-member')
      if (!teamMember) {
        router.push('/lowes/login')
        return
      }

      const memberData = JSON.parse(teamMember)

      const response = await fetch(`/api/lowes-chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${memberData.email}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete conversation')
      }

      // Refresh conversations list
      const fetchConversations = async () => {
        const teamMember = localStorage.getItem('lowes-team-member')
        if (!teamMember) return

        const memberData = JSON.parse(teamMember)
        const response = await fetch('/api/lowes-chat/conversations/all', {
          headers: {
            'Authorization': `Bearer ${memberData.email}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
        }
      }
      await fetchConversations()
    } catch (err: any) {
      console.error('Error deleting conversation:', err)
      setError(err.message || 'Failed to delete conversation')
    } finally {
      setDeletingConversationId(null)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const categoryMatch = filterCategory === 'all' || conv.flooring_category === filterCategory
    const statusMatch = filterStatus === 'all' || conv.status === filterStatus
    return categoryMatch && statusMatch
  })

  const categories = Array.from(new Set(conversations.map(c => c.flooring_category))).filter(Boolean)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'radial-gradient(circle at top, #eff6ff 0, #ffffff 40%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      {/* Header */}
      <header className="bg-[#004990] border-b border-[#003d73] shadow-lg">
        <div className="max-w-7xl mx-auto py-5">
          <div className="flex items-center pl-6">
            <img 
              src="/logo3.png" 
              alt="Logo" 
              className="h-12 w-auto object-contain mr-4"
              style={{ maxHeight: '60px', display: 'block' }}
            />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Lowe's Pro Connect</h1>
                <p className="text-base text-white opacity-90 font-medium">Flooring Validation Chat</p>
              </div>
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="px-5 py-2.5 text-sm font-semibold text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors shadow-sm border border-white border-opacity-30 flex items-center gap-2"
                >
                  <span>{currentUser?.name || 'User'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <button
                      onClick={handleProfileClick}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-[#003d73] border-b border-[#003d73] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 text-sm border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-md font-semibold cursor-pointer appearance-none bg-no-repeat bg-right pr-10 transition-all"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23004990' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.75rem center",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
              }}
            >
              <option value="all" style={{ fontFamily: 'inherit' }}>All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} style={{ fontFamily: 'inherit' }}>{cat}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 text-sm border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-md font-semibold cursor-pointer appearance-none bg-no-repeat bg-right pr-10 transition-all"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23004990' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.75rem center",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
              }}
            >
              <option value="all" style={{ fontFamily: 'inherit' }}>All Status</option>
              <option value="open" style={{ fontFamily: 'inherit' }}>Open</option>
              <option value="in_progress" style={{ fontFamily: 'inherit' }}>In Progress</option>
              <option value="resolved" style={{ fontFamily: 'inherit' }}>Resolved</option>
              <option value="closed" style={{ fontFamily: 'inherit' }}>Closed</option>
            </select>
            <div className="flex-1"></div>
            <button
              onClick={() => setShowIntakeForm(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#004990] hover:bg-[#003d73] rounded-lg transition-colors shadow-sm"
            >
              + New Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Intake Form Modal */}
      {showIntakeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-gradient-to-r from-[#004990] to-[#003d73] text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold">Create New Conversation</h2>
              <button
                onClick={() => setShowIntakeForm(false)}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8">
              <LowesChatIntake 
                onSubmit={handleIntakeSubmit}
                initialValues={{
                  email: currentUser?.email || '',
                  name: currentUser?.name || '',
                  role: currentUser?.role || '',
                  district: currentUser?.district || '',
                  storeNumber: currentUser?.storeNumber || '',
                  groupName: userGroupName || ''
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <ProfileSettingsModal
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdate={(updatedUser) => {
            setCurrentUser(updatedUser)
            setShowProfileModal(false)
          }}
        />
      )}

      {/* Conversations List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#004990] to-[#003d73] rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 text-base mb-1">Create a new conversation to start a pricing validation chat.</p>
            <button
              onClick={() => setShowIntakeForm(true)}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#004990] to-[#003d73] text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">Create New Conversation</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="block bg-white rounded-xl p-5 hover:shadow-lg transition-all shadow-md border border-gray-100 hover:border-gray-200 relative group"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteConversation(conversation.id)
                  }}
                  disabled={deletingConversationId === conversation.id}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete conversation"
                >
                  {deletingConversationId === conversation.id ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
                <Link
                  href={`/lowes/chat/${conversation.id}`}
                  className="block"
                >
                <div className="flex items-start justify-between pr-8">
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-lg text-gray-900 truncate">{conversation.user_name}</h3>
                      <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#f0f2e8] text-[#89ac44] flex-shrink-0">
                        {conversation.user_role}
                      </span>
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg flex-shrink-0 ${
                        conversation.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        conversation.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        conversation.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {conversation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="text-sm font-bold text-gray-900">{conversation.lowes_email}</span>
                      </div>
                      {conversation.group_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Group:</span>
                          <span className="text-sm font-bold text-gray-900">{conversation.group_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">District/Store:</span>
                        <span className="text-sm font-bold text-gray-900">{conversation.district_store}</span>
                      </div>
                      {conversation.question_types && conversation.question_types.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-600">Questions:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {conversation.question_types.map((type, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#004990] text-white"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Last Activity */}
                  <div className="text-right text-xs text-gray-500 ml-4 flex-shrink-0">
                    <div className="font-medium text-gray-600 mb-1">Last activity:</div>
                    <div className="font-semibold text-gray-900 whitespace-nowrap">
                      {conversation.last_message_at ? formatLastActivity(conversation.last_message_at) : 'No activity'}
                    </div>
                  </div>
                </div>
              </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// Profile Settings Modal Component
function ProfileSettingsModal({ 
  currentUser, 
  onClose, 
  onUpdate 
}: { 
  currentUser: any
  onClose: () => void
  onUpdate: (user: any) => void
}) {
  const [name, setName] = useState(currentUser?.name || '')
  const [role, setRole] = useState(currentUser?.role || '')
  const [district, setDistrict] = useState(currentUser?.district || '')
  const [storeNumber, setStoreNumber] = useState(currentUser?.storeNumber || '')
  const [groupName, setGroupName] = useState('')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch user's group from database
  useEffect(() => {
    if (currentUser?.email) {
      fetch(`/api/lowes-groups/user-group?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.groupName) {
            setGroupName(data.groupName)
          }
        })
        .catch(err => console.error('Error fetching group name:', err))
    }
  }, [currentUser?.email])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password if user is trying to change it (server will verify current password too)
    if (showPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Please fill all password fields to change password')
        return
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match')
        return
      }
    }

    setIsSaving(true)

    try {
      // Persist to DB (self-service update)
      const response = await fetch('/api/lowes-team-members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.email}`,
        },
        body: JSON.stringify({
          memberEmail: currentUser.email,
          name: name.trim(),
          role: role.trim(),
          district: district.trim(),
          storeNumber: storeNumber.trim(),
          ...(showPasswordChange
            ? { currentPassword: currentPassword, newPassword: newPassword }
            : {}),
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to update profile')
      }

      const updatedSession = {
        ...currentUser,
        name: result.member?.name ?? name.trim(),
        role: result.member?.role ?? role.trim(),
        district: result.member?.district ?? district.trim(),
        storeNumber: result.member?.storeNumber ?? storeNumber.trim(),
      }

      localStorage.setItem('lowes-team-member', JSON.stringify(updatedSession))

      // Reset password fields if password was changed
      if (showPasswordChange && newPassword) {
        setShowPasswordChange(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }

      onUpdate(updatedSession)
      setIsSaving(false)
      onClose()
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="profile-name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-medium"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="profile-role" className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <input
              id="profile-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-medium"
              placeholder="e.g., Project Coordinator, General Manager, President"
            />
          </div>

          <div>
            <label htmlFor="profile-district" className="block text-sm font-semibold text-gray-700 mb-2">
              District
            </label>
            <input
              id="profile-district"
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-4 py-3 border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-medium"
              placeholder="District 123"
            />
          </div>

          <div>
            <label htmlFor="profile-store-number" className="block text-sm font-semibold text-gray-700 mb-2">
              Store Number
            </label>
            <input
              id="profile-store-number"
              type="text"
              value={storeNumber}
              onChange={(e) => setStoreNumber(e.target.value)}
              className="w-full px-4 py-3 border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-medium"
              placeholder="Store 456"
            />
          </div>

          {groupName && (
            <div>
              <label htmlFor="profile-group" className="block text-sm font-semibold text-gray-700 mb-2">
                Group
              </label>
              <input
                id="profile-group"
                type="text"
                value={groupName}
                disabled
                className="w-full px-4 py-3 border-0 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm font-medium"
              />
              <p className="mt-1 text-xs text-gray-500">Contact admin to change your group</p>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200">
            {!showPasswordChange ? (
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="w-full px-4 py-3 text-sm font-semibold text-[#004990] bg-[#e6f0f8] hover:bg-[#d0e4f0] rounded-xl transition-colors border border-[#004990] border-opacity-20"
              >
                Change Password
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Change Password</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <div>
                  <label htmlFor="profile-current-password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    id="profile-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-medium"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label htmlFor="profile-new-password" className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="profile-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-medium"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label htmlFor="profile-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="profile-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-medium"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#004990] to-[#003d73] hover:from-[#003d73] hover:to-[#002d5a] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
