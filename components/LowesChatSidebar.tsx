'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
}

interface LowesChatSidebarProps {
  currentConversationId?: string
  onConversationSelect?: (conversationId: string) => void
}

export default function LowesChatSidebar({ currentConversationId, onConversationSelect }: LowesChatSidebarProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    const fetchConversations = async () => {
      try {
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
      } catch (err) {
        console.error('Error fetching conversations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchConversations, 30000)
    
    // Listen for status updates to refresh immediately
    const handleStatusUpdate = () => {
      fetchConversations()
    }
    window.addEventListener('conversation-status-updated', handleStatusUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('conversation-status-updated', handleStatusUpdate)
    }
  }, [])

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.quote_ims_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.district_store.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || conv.flooring_category === filterCategory
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = Array.from(new Set(conversations.map(c => c.flooring_category))).filter(Boolean)

  const formatTime = (dateString: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId)
    } else {
      router.push(`/lowes/chat/${conversationId}`)
    }
  }

  return (
    <div className="w-80 bg-[#004990] border-r border-[#003d73] flex flex-col h-screen shadow-lg" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
      {/* Header */}
      <div className="p-5 border-b border-[#003d73] bg-[#003d73]">
        {/* Logo */}
        <div className="mb-4 flex justify-center items-center">
          <img 
            src="/logo3.png" 
            alt="Logo" 
            className="h-16 w-auto object-contain"
            style={{ maxHeight: '80px', display: 'block' }}
          />
        </div>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#004990] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-md transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-3 text-sm border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-md font-semibold cursor-pointer appearance-none bg-no-repeat bg-right pr-10 transition-all"
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
            className="w-full px-4 py-3 text-sm border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-md font-semibold cursor-pointer appearance-none bg-no-repeat bg-right pr-10 transition-all"
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
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-white opacity-75">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-white opacity-75">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
              ? 'No conversations match your filters' 
              : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                  currentConversationId === conversation.id 
                    ? 'bg-white shadow-xl transform scale-[1.02]' 
                    : 'bg-white bg-opacity-10 hover:bg-opacity-20 hover:shadow-lg'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {/* Green online indicator only - showing user is active/online */}
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                      </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-base truncate mb-1 ${
                        currentConversationId === conversation.id ? 'text-gray-900' : 'text-white'
                      }`}>
                        {conversation.user_name}
                      </h3>
                      <p className={`text-xs font-medium ${
                        currentConversationId === conversation.id ? 'text-gray-600' : 'text-white opacity-80'
                      }`}>
                        {conversation.user_role} • {conversation.district_store}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                    currentConversationId === conversation.id ? 'text-gray-500' : 'text-white opacity-70'
                  }`}>
                    {formatTime(conversation.last_message_at)}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="mb-3">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-lg inline-block ${getStatusColor(conversation.status)}`}>
                    {conversation.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Quote & Category */}
                <div className="mb-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      currentConversationId === conversation.id ? 'text-gray-500' : 'text-white opacity-70'
                    }`}>
                      Quote:
                    </span>
                    <span className={`text-sm font-bold ${
                      currentConversationId === conversation.id ? 'text-gray-900' : 'text-white'
                    }`}>
                      {conversation.quote_ims_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      currentConversationId === conversation.id ? 'text-gray-500' : 'text-white opacity-70'
                    }`}>
                      Category:
                    </span>
                    <span className={`text-sm font-bold ${
                      currentConversationId === conversation.id ? 'text-gray-900' : 'text-white'
                    }`}>
                      {conversation.flooring_category}
                    </span>
                  </div>
                </div>

                {/* Question Types */}
                {conversation.question_types && conversation.question_types.length > 0 && (
                  <div className="mb-3">
                    <p className={`text-xs font-semibold mb-2 ${
                      currentConversationId === conversation.id ? 'text-gray-600' : 'text-white opacity-80'
                    }`}>
                      Questions:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {conversation.question_types.slice(0, 3).map((type, idx) => (
                        <span
                          key={idx}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                            currentConversationId === conversation.id
                              ? 'bg-[#004990] text-white'
                              : 'bg-white bg-opacity-30 text-white backdrop-blur-sm'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                      {conversation.question_types.length > 3 && (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                          currentConversationId === conversation.id
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-white bg-opacity-30 text-white backdrop-blur-sm'
                        }`}>
                          +{conversation.question_types.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className={`flex items-center gap-1.5 pt-2.5 border-t ${
                  currentConversationId === conversation.id 
                    ? 'border-gray-200' 
                    : 'border-white border-opacity-20'
                }`}>
                  <svg className={`w-3.5 h-3.5 ${
                    currentConversationId === conversation.id ? 'text-gray-400' : 'text-white opacity-60'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-xs font-medium ${
                    currentConversationId === conversation.id ? 'text-gray-500' : 'text-white opacity-70'
                  }`}>
                    {formatTime(conversation.last_message_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#003d73] bg-[#003d73]">
        <div className="text-sm text-white opacity-85 text-center font-semibold">
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
