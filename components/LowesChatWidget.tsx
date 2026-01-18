'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

interface Message {
  id: string
  message_text: string
  sender_email: string
  sender_name: string
  sender_role: string
  created_at: string
  is_system_message: boolean
}

interface Conversation {
  id: string
  conversation_key: string
  quote_ims_number: string
  flooring_category: string
  status: string
  last_message_at: string
  created_at: string
  user_name?: string
  user_role?: string
  district_store?: string
  question_types?: string[]
  lowes_email?: string
}

export default function LowesChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatState, setChatState] = useState<'select' | 'chat' | 'loading'>('select')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationKey, setConversationKey] = useState<string | null>(null)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [previousConversations, setPreviousConversations] = useState<Conversation[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(true)
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({})
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null)
  const [hasChatAccess, setHasChatAccess] = useState<boolean | null>(null)
  const [groupName, setGroupName] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if user has chat widget access
  useEffect(() => {
    if (!user?.email) {
      setHasChatAccess(false)
      return
    }

    const checkAccess = async () => {
      try {
        const response = await fetch('/api/chat-widget-access', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          // If admin, response contains users list - check if current user has access
          if (data.users && Array.isArray(data.users)) {
            const currentUser = data.users.find((u: any) => 
              u.email.toLowerCase() === user.email?.toLowerCase()
            )
            setHasChatAccess(currentUser?.chatWidgetEnabled === true)
          } else if (typeof data.hasAccess === 'boolean') {
            // Regular user response
            setHasChatAccess(data.hasAccess === true)
          } else {
            // Fallback: if admin but can't find user in list, allow access
            setHasChatAccess(true)
          }
        } else {
          setHasChatAccess(false)
        }
      } catch (error) {
        console.error('Error checking chat widget access:', error)
        setHasChatAccess(false)
      }
    }

    checkAccess()
  }, [user?.email])

  // Load user photos from localStorage and update when user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fis-user-photos')
      const photos = stored ? JSON.parse(stored) : {}
      
      // Always add/update current user's photo if available
      if (user?.photoUrl && user?.email) {
        photos[user.email] = user.photoUrl
        localStorage.setItem('fis-user-photos', JSON.stringify(photos))
      }
      
      setUserPhotos(photos)
    }
  }, [user?.email, user?.photoUrl])

  // Function to get photo for a sender
  const getSenderPhoto = (senderEmail: string): string | null => {
    // Check in userPhotos state
    if (userPhotos[senderEmail]) {
      return userPhotos[senderEmail]
    }
    
    // Also check localStorage in case state hasn't updated
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fis-user-photos')
      if (stored) {
        const photos = JSON.parse(stored)
        if (photos[senderEmail]) {
          return photos[senderEmail]
        }
      }
    }
    
    return null
  }

  // Fetch previous conversations when widget opens
  useEffect(() => {
    if (!isOpen || !user?.email) return

    const fetchPreviousConversations = async () => {
      setIsLoadingConversations(true)
      try {
        // Fetch ALL conversations (started by Lowe's team) for FIS POD users to respond to
        // Note: FIS POD users see all conversations, filtering is only for Lowe's team members
        const response = await fetch('/api/lowes-chat/conversations/all', {
          headers: { 'Authorization': `Bearer ${user.email}` }
        })

        if (response.ok) {
          const data = await response.json()
          const conversations = data.conversations || []
          setPreviousConversations(conversations)
          setChatState('select')
        }
      } catch (err) {
        console.error('Error fetching conversations:', err)
        setChatState('select')
      } finally {
        setIsLoadingConversations(false)
      }
    }

    fetchPreviousConversations()
  }, [isOpen, user?.email])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0 && chatState === 'chat') {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages, isOpen, isMinimized, chatState])

  // Fetch messages when chat is open
  useEffect(() => {
    if (!isOpen || !conversationId || !user?.email || chatState !== 'chat') return

    const fetchMessages = async () => {
      try {
        const authHeader = `Bearer ${user.email}`
        const response = await fetch(
          `/api/lowes-chat/messages?conversationId=${conversationId}`,
          {
            headers: { 'Authorization': authHeader }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const fetchedMessages = data.messages || []
          setMessages(fetchedMessages)
          
          // Auto-scroll after messages are loaded
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        } else {
          console.error('Failed to fetch messages:', response.status, response.statusText)
          const errorData = await response.json().catch(() => ({}))
          console.error('Error details:', errorData)
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
      }
    }

    fetchMessages()
    // Poll for new messages every 5 seconds (more frequent)
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [isOpen, conversationId, user?.email, chatState])

  // Also listen for custom events to refresh messages immediately
  useEffect(() => {
    if (!isOpen || !conversationId || chatState !== 'chat') return

    const handleMessageUpdate = (event: CustomEvent) => {
      if (event.detail?.conversationId === conversationId) {
        // Refresh messages immediately when a new message is sent
        const fetchMessages = async () => {
          try {
            const authHeader = `Bearer ${user?.email}`
            const response = await fetch(
              `/api/lowes-chat/messages?conversationId=${conversationId}`,
              {
                headers: { 'Authorization': authHeader }
              }
            )

            if (response.ok) {
              const data = await response.json()
              setMessages(data.messages || [])
            }
          } catch (err) {
            console.error('Error fetching messages:', err)
          }
        }
        fetchMessages()
      }
    }

    window.addEventListener('message-sent' as any, handleMessageUpdate as EventListener)
    return () => {
      window.removeEventListener('message-sent' as any, handleMessageUpdate as EventListener)
    }
  }, [isOpen, conversationId, user?.email, chatState])


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user?.email || !conversationId) return

    setIsSending(true)
    setError(null)

    try {
      const authHeader = `Bearer ${user.email}`
      const response = await fetch('/api/lowes-chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          messageText: newMessage,
          senderName: user.name || user.email,
          senderRole: 'user'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    setChatState('loading')
    setConversationId(conversation.id)
    setConversationKey(conversation.conversation_key)
    setCurrentConversation(conversation)
    setGroupName(null) // Reset group name
    
    // Fetch full conversation details
    try {
      const response = await fetch(`/api/lowes-chat/conversations/${conversation.id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data.conversation)
        
        // Fetch group name for the user who created this conversation
        // Use created_by if available, otherwise use lowes_email
        const userEmail = data.conversation.created_by || data.conversation.lowes_email
        if (userEmail) {
          try {
            const groupResponse = await fetch(`/api/lowes-groups/user-group?email=${encodeURIComponent(userEmail)}`)
            if (groupResponse.ok) {
              const groupData = await groupResponse.json()
              setGroupName(groupData.groupName || null)
            }
          } catch (err) {
            console.error('Error fetching user group:', err)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching conversation details:', err)
    }
    
    setChatState('chat')
  }


  const formatConversationDate = (dateString: string) => {
    if (!dateString) return 'No activity'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffMinutes = Math.floor(diffMs / 60000)
      
      // Always get the time string
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes.toString().padStart(2, '0')
      const timeString = `${displayHours}:${displayMinutes} ${ampm}`
      
      if (diffDays === 0) {
        if (diffHours === 0) {
          if (diffMinutes < 1) {
            return `Just now`
          }
          return `${diffMinutes}m ago at ${timeString}`
        }
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
      return 'Invalid date'
    }
  }

  const isMyMessage = (message: Message) => {
    return message.sender_email === user?.email || message.sender_email === user?.email?.toLowerCase()
  }

  const handleDeleteConversation = async (convIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the conversation
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    setDeletingConversationId(convIdToDelete)
    setError(null)

    try {
      const authHeader = `Bearer ${user?.email}`
      const response = await fetch(`/api/lowes-chat/conversations/${convIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete conversation')
      }

      // Remove from local state
      setPreviousConversations(prev => prev.filter(conv => conv.id !== convIdToDelete))
      
      // If we're currently viewing this conversation, go back to select screen
      if (conversationId === convIdToDelete) {
        setChatState('select')
        setConversationId(null)
        setCurrentConversation(null)
        setMessages([])
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err)
      setError(err.message || 'Failed to delete conversation')
    } finally {
      setDeletingConversationId(null)
    }
  }

  if (!user) return null
  
  // Don't show widget if user doesn't have access (wait for access check to complete)
  if (hasChatAccess === false) return null

  return (
    <>
      {/* Chat Button - Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#80875d] hover:bg-[#6b7349] text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl transition-all duration-300 border border-gray-100 ${
          isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-[#80875d] text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="font-semibold">Lowe's Pricing Chat</span>
            </div>
            <div className="flex items-center space-x-2">
              {!isMinimized && (
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-white hover:bg-[#6b7349] rounded p-1 transition-colors"
                  aria-label="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                }}
                className="text-white hover:bg-[#6b7349] rounded p-1 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Minimized View */}
          {isMinimized && (
            <button
              onClick={() => setIsMinimized(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              Click to expand chat
            </button>
          )}

          {/* Expanded Content */}
          {!isMinimized && (
            <>
              {chatState === 'select' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500 text-base">Loading conversations...</div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="px-4 pt-4 pb-3 flex-shrink-0">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Continue Conversation</h3>
                        <p className="text-sm text-gray-600">Select a previous conversation or start a new one</p>
                      </div>
                      
                      {previousConversations.length > 0 && (
                        <div className="relative flex-1 min-h-0 px-4 pb-4">
                          <div className="space-y-2 h-full overflow-y-auto">
                            {previousConversations.map((conv) => (
                              <div
                                key={conv.id}
                                className="relative group"
                              >
                                <button
                                  onClick={() => handleSelectConversation(conv)}
                                  className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-[#80875d] hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-sm font-semibold text-gray-900">Quote:</span>
                                        <span className="text-sm font-bold text-gray-900">{conv.quote_ims_number}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Category:</span>
                                        <span className="text-sm font-semibold text-gray-700">{conv.flooring_category}</span>
                                      </div>
                                    </div>
                                    <span className={`px-2.5 py-1.5 text-sm font-bold rounded ${
                                      conv.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                      conv.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                      conv.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {conv.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="text-sm text-gray-500">
                                    Last activity: {formatConversationDate(conv.last_message_at)}
                                  </div>
                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                                    disabled={deletingConversationId === conv.id}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete conversation"
                                  >
                                    {deletingConversationId === conv.id ? (
                                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </button>
                              </div>
                            ))}
                          </div>
                          {previousConversations.length > 3 && (
                            <div className="absolute bottom-4 left-4 right-4 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none flex items-end justify-center">
                              <span className="text-xs text-gray-400 font-medium">Scroll for more</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {chatState === 'loading' && (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-gray-500 text-sm">Starting conversation...</div>
                </div>
              )}

              {chatState === 'chat' && (
                <>
                  {/* Back Button and Conversation Details Panel */}
                  {currentConversation && (
                    <div className="border-b border-gray-200 bg-gradient-to-r from-[#f8f9fa] to-white">
                      {/* Back Button */}
                      <button
                        onClick={() => {
                          setChatState('select')
                          setConversationId(null)
                          setCurrentConversation(null)
                          setMessages([])
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors border-b border-gray-200"
                      >
                        <svg className="w-5 h-5 text-[#80875d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-semibold text-[#80875d]">All Chats</span>
                      </button>
                      
                      {/* Conversation Details Toggle */}
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className={`w-5 h-5 text-gray-600 transition-transform ${showDetails ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-semibold text-gray-900">Conversation Details</span>
                        </div>
                        <span className="text-xs text-gray-500">{showDetails ? 'Hide' : 'Show'} details</span>
                      </button>
                      
                      {showDetails && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600 font-medium">Contact:</span>
                              <p className="text-gray-900 font-semibold">{currentConversation.user_name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">Role:</span>
                              <p className="text-gray-900 font-semibold">{currentConversation.user_role || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">Email:</span>
                              <p className="text-gray-900 font-semibold text-xs">{currentConversation.lowes_email || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">District/Store:</span>
                              <p className="text-gray-900 font-semibold">{currentConversation.district_store || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">Quote/IMS:</span>
                              <p className="text-gray-900 font-semibold">{currentConversation.quote_ims_number || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">Category:</span>
                              <p className="text-gray-900 font-semibold">{currentConversation.flooring_category || 'N/A'}</p>
                            </div>
                            {groupName && (
                              <div>
                                <span className="text-gray-600 font-medium">Group:</span>
                                <p className="text-gray-900 font-semibold">{groupName}</p>
                              </div>
                            )}
                          </div>
                          
                          {currentConversation.question_types && currentConversation.question_types.length > 0 && (
                            <div>
                              <span className="text-gray-600 font-medium text-sm block mb-2">Question:</span>
                              <div className="flex flex-wrap gap-2">
                                {currentConversation.question_types.map((type, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#80875d] text-white shadow-sm"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-gray-50 via-white to-gray-50" style={{ maxHeight: '400px', minHeight: '200px' }}>
                      {messages.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#80875d] to-[#6b7349] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-semibold text-base mb-1">No messages yet</p>
                          <p className="text-gray-400 text-sm">Start the conversation!</p>
                        </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = isMyMessage(message)
                        const isSystem = message.is_system_message

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-3 mb-4`}
                          >
                            {!isMine && !isSystem && (() => {
                              const senderPhoto = getSenderPhoto(message.sender_email)
                              return (
                                <div className="w-12 h-12 bg-gradient-to-br from-[#80875d] to-[#6b7349] rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden ring-2 ring-white relative">
                                  {senderPhoto ? (
                                    <img 
                                      src={senderPhoto} 
                                      alt={message.sender_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to initial if image fails to load
                                        e.currentTarget.style.display = 'none'
                                        const fallback = e.currentTarget.parentElement?.querySelector('.initial-fallback') as HTMLElement
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                  ) : null}
                                  <span 
                                    className={`initial-fallback text-white text-base font-bold ${senderPhoto ? 'hidden' : 'flex'}`}
                                    style={{ display: senderPhoto ? 'none' : 'flex' }}
                                  >
                                    {message.sender_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )
                            })()}
                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[80%]`}>
                              {!isSystem && !isMine && (
                                <div className="text-xs font-bold mb-2 px-2 text-gray-600 uppercase tracking-wide">
                                  {message.sender_name}
                                </div>
                              )}
                              <div
                                className={`${
                                  isSystem
                                    ? 'bg-transparent text-gray-500 mx-auto text-center text-xs max-w-md'
                                    : isMine
                                    ? 'rounded-2xl px-5 py-3.5 bg-gradient-to-br from-[#80875d] to-[#6b7349] text-white rounded-br-md shadow-md'
                                    : 'rounded-2xl px-5 py-3.5 bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-md'
                                }`}
                              >
                                <div className={`whitespace-pre-wrap break-words leading-relaxed ${
                                  isSystem 
                                    ? 'text-xs text-gray-500'
                                    : isMine 
                                    ? 'text-base text-white' 
                                    : 'text-base text-gray-900'
                                }`}>
                                  {message.message_text}
                                </div>
                              </div>
                              <div className={`text-xs mt-2 px-2 font-medium ${isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                            {isMine && (
                              <div className="w-12 h-12 bg-gradient-to-br from-[#80875d] to-[#6b7349] rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden relative ring-2 ring-white">
                                {user?.photoUrl ? (
                                  <>
                                    <img 
                                      src={user.photoUrl} 
                                      alt="Your profile" 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error('Error loading user profile photo:', e)
                                        e.currentTarget.style.display = 'none'
                                        const fallback = e.currentTarget.parentElement?.querySelector('.photo-fallback') as HTMLElement
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                    <span className="text-white text-base font-bold photo-fallback hidden absolute inset-0 items-center justify-center">{user?.name?.charAt(0) || 'U'}</span>
                                  </>
                                ) : (
                                  <span className="text-white text-base font-bold">{user?.name?.charAt(0) || 'U'}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-gray-200 bg-white rounded-b-lg p-4 shadow-lg">
                    {error && (
                      <div className="mb-3 px-4 py-2.5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm font-medium">{error}</div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 border-2 border-gray-200 focus-within:border-[#80875d] focus-within:bg-white transition-all">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-transparent border-0 rounded-xl text-base focus:outline-none placeholder-gray-400"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="px-6 py-3 bg-gradient-to-r from-[#80875d] to-[#6b7349] text-white rounded-xl text-base font-bold hover:from-[#6b7349] hover:to-[#5a623e] focus:outline-none focus:ring-2 focus:ring-[#80875d] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2 min-w-[100px] justify-center"
                      >
                        {isSending ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Sending</span>
                          </>
                        ) : (
                          <>
                            <span>Send</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
