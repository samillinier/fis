'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import LowesChatSidebar from '@/components/LowesChatSidebar'

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
  lowes_email: string
  user_name: string
  user_role: string
  district_store: string
  quote_ims_number: string
  flooring_category: string
  question_types: string[]
  status: string
}

export default function LowesChatPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMemberPhoto, setTeamMemberPhoto] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if logged in and get team member photo
  useEffect(() => {
    const teamMember = localStorage.getItem('lowes-team-member')
    if (!teamMember) {
      router.push('/lowes/login')
      return
    }
    try {
      const memberData = JSON.parse(teamMember)
      if (memberData.photoUrl) {
        setTeamMemberPhoto(memberData.photoUrl)
      }
    } catch (error) {
      console.error('Error parsing team member data:', error)
    }
  }, [router])

  // Fetch conversation and messages
  useEffect(() => {
    if (!conversationId) return

    const fetchData = async () => {
      try {
        const teamMember = localStorage.getItem('lowes-team-member')
        if (!teamMember) {
          router.push('/lowes/login')
          return
        }

        const memberData = JSON.parse(teamMember)

        // Fetch conversation details
        const convResponse = await fetch(`/api/lowes-chat/conversations/${conversationId}`)
        if (convResponse.ok) {
          const convData = await convResponse.json()
          setConversation(convData.conversation)
        }

        // Fetch messages with auth header (use a dummy one for Lowe's team access)
        const messagesResponse = await fetch(`/api/lowes-chat/messages?conversationId=${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${memberData.email}`
          }
        })
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData.messages || [])
        } else {
          console.error('Failed to fetch messages:', messagesResponse.status)
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load conversation')
      } finally {
        setIsLoading(false)
      }
    }

    const teamMember = localStorage.getItem('lowes-team-member')
    if (teamMember) {
      fetchData()
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchData, 5000)
      return () => clearInterval(interval)
    }
  }, [conversationId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId) return

    const teamMember = localStorage.getItem('lowes-team-member')
    if (!teamMember) {
      router.push('/lowes/login')
      return
    }

    const memberData = JSON.parse(teamMember)
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/lowes-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          messageText: newMessage,
          senderName: "Lowe's Pricing Team",
          senderRole: 'pricing_team',
          senderEmail: memberData.email
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

  const isMyMessage = (message: Message) => {
    return message.sender_role === 'pricing_team'
  }

  const handleStatusUpdate = async (newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!conversationId || !conversation) return

    const teamMember = localStorage.getItem('lowes-team-member')
    if (!teamMember) {
      router.push('/lowes/login')
      return
    }

    const memberData = JSON.parse(teamMember)
    setIsUpdatingStatus(true)
    setError(null)

    try {
      const response = await fetch(`/api/lowes-chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${memberData.email}`
        },
        body: JSON.stringify({
          status: newStatus,
          previousStatus: conversation.status
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update status')
      }

      const data = await response.json()
      setConversation({ ...conversation, status: data.conversation.status })
      
      // Show success message
      setStatusUpdateSuccess(true)
      setTimeout(() => setStatusUpdateSuccess(false), 3000)
      
      // Refresh the page data to update sidebar
      window.dispatchEvent(new CustomEvent('conversation-status-updated', { 
        detail: { conversationId, status: data.conversation.status } 
      }))
    } catch (err: any) {
      console.error('Error updating status:', err)
      setError(err.message || 'Failed to update status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Conversation not found</p>
          <Link href="/lowes/dashboard" className="text-[#80875d] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ 
      background: 'radial-gradient(circle at top, #eff6ff 0, #ffffff 40%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      {/* Sidebar */}
      <LowesChatSidebar currentConversationId={conversationId} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/lowes/dashboard" className="text-gray-500 hover:text-[#004990] transition-colors p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-[#004990] rounded-full flex items-center justify-center shadow-md overflow-hidden">
                      <span className="text-white font-bold text-lg">{conversation.user_name.charAt(0)}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-gray-900">{conversation.user_name}</h1>
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    </div>
                    <p className="text-base text-gray-600 font-semibold">{conversation.user_role} • {conversation.district_store}</p>
                  </div>
                </div>
              </div>
              
              {/* Status Dropdown: Open, Resolved, Closed */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={conversation.status}
                  onChange={(e) => handleStatusUpdate(e.target.value as 'open' | 'in_progress' | 'resolved' | 'closed')}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm cursor-pointer appearance-none bg-no-repeat bg-right pr-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23004990' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                    backgroundPosition: "right 0.75rem center",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
                  }}
                >
                  <option value="open" style={{ fontFamily: 'inherit' }}>Open</option>
                  <option value="in_progress" style={{ fontFamily: 'inherit' }}>In Progress</option>
                  <option value="resolved" style={{ fontFamily: 'inherit' }}>Resolved</option>
                  <option value="closed" style={{ fontFamily: 'inherit' }}>Closed</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'radial-gradient(circle at top, #eff6ff 0, #ffffff 40%)' }}>
          {statusUpdateSuccess && (
            <div className="max-w-4xl mx-auto mb-4">
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm font-medium shadow-sm">
                ✓ Status updated successfully
              </div>
            </div>
          )}
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-[#004990] to-[#003d73] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold text-lg">No messages yet</p>
                <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = isMyMessage(message)
                const isSystem = message.is_system_message

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-4 animate-in fade-in duration-300`}
                  >
                    {!isMine && !isSystem && (
                      <div className="w-14 h-14 bg-gradient-to-br from-[#004990] to-[#003d73] rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
                        {message.sender_name.charAt(0) && (
                          <span className="text-white text-base font-bold">{message.sender_name.charAt(0)}</span>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {!isSystem && !isMine && (
                        <div className="text-xs font-semibold text-gray-600 mb-1.5 px-1">
                          {message.sender_name}
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-5 py-3.5 shadow-md ${
                          isSystem
                            ? 'bg-gray-50 text-gray-600 mx-auto text-center text-sm border border-gray-200 max-w-md'
                            : isMine
                            ? 'bg-gradient-to-br from-[#004990] to-[#003d73] text-white rounded-br-md'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <div className={`text-base whitespace-pre-wrap break-words leading-relaxed ${
                          isMine ? 'text-white' : 'text-gray-900'
                        }`}>
                          {message.message_text}
                        </div>
                      </div>
                      <div className={`text-xs mt-1.5 px-2 ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                    {isMine && (
                      <div className="w-14 h-14 bg-gradient-to-br from-[#004990] to-[#003d73] rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
                        {teamMemberPhoto ? (
                          <img 
                            src={teamMemberPhoto} 
                            alt="Your profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Error loading profile photo:', e)
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        {!teamMemberPhoto && (
                          <span className="text-white text-base font-bold">You</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 shadow-2xl p-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm font-medium shadow-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 border-2 border-gray-200 focus-within:border-[#004990] focus-within:bg-white transition-all shadow-inner">
              <div className="flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border-0 rounded-xl text-base focus:outline-none placeholder-gray-400"
                  placeholder="Type your message..."
                  disabled={isSending}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="px-6 py-3 bg-gradient-to-r from-[#004990] to-[#003d73] text-white rounded-xl text-base font-bold hover:from-[#003d73] hover:to-[#002d5a] focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2 min-w-[100px] justify-center"
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
        </div>
      </div>
    </div>
  )
}
