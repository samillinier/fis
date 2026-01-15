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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (isOpen && !isMinimized && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

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
          setMessages(data.messages || [])
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
      }
    }

    fetchMessages()
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
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
    
    // Fetch full conversation details
    try {
      const response = await fetch(`/api/lowes-chat/conversations/${conversation.id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data.conversation)
      }
    } catch (err) {
      console.error('Error fetching conversation details:', err)
    }
    
    setChatState('chat')
  }


  const formatConversationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isMyMessage = (message: Message) => {
    return message.sender_email === user?.email || message.sender_email === user?.email?.toLowerCase()
  }

  if (!user) return null

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
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500 text-base">Loading conversations...</div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Continue Conversation</h3>
                        <p className="text-sm text-gray-600">Select a previous conversation or start a new one</p>
                      </div>
                      
                      {previousConversations.length > 0 && (
                        <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                          {previousConversations.map((conv) => (
                            <button
                              key={conv.id}
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
                              <div className="text-sm text-gray-500 mt-2">
                                Last activity: {formatConversationDate(conv.last_message_at)}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
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
                  {/* Conversation Details Panel */}
                  {currentConversation && (
                    <div className="border-b border-gray-200 bg-gradient-to-r from-[#f8f9fa] to-white">
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
                  <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-gray-50 via-white to-gray-50">
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
                            {!isMine && !isSystem && (
                              <div className="w-12 h-12 bg-gradient-to-br from-[#80875d] to-[#6b7349] rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden ring-2 ring-white">
                                <span className="text-white text-base font-bold">{message.sender_name.charAt(0)}</span>
                              </div>
                            )}
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
                    <div ref={messagesEndRef} />
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
