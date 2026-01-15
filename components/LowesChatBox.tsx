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

interface LowesChatBoxProps {
  conversationId: string
  conversationKey: string
}

export default function LowesChatBox({ conversationId, conversationKey }: LowesChatBoxProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch messages
  const fetchMessages = async () => {
    if (!user?.email) return

    try {
      const authHeader = `Bearer ${user.email}`
      const response = await fetch(
        `/api/lowes-chat/messages?conversationId=${conversationId}`,
        {
          headers: {
            'Authorization': authHeader
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError(err.message || 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (conversationId && user?.email) {
      fetchMessages()
      // Poll for new messages every 10 seconds (async chat)
      const interval = setInterval(fetchMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [conversationId, user?.email])

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user?.email) return

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
      
      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100)
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
    return message.sender_email === user?.email || message.sender_email === user?.email.toLowerCase()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lowe's Pricing Chat</h3>
          <p className="text-sm text-indigo-100">Conversation ID: {conversationKey}</p>
        </div>
        <div className="text-xs text-indigo-100">
          Share this link to access this conversation
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = isMyMessage(message)
            const isSystem = message.is_system_message

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isSystem
                      ? 'bg-gray-200 text-gray-700 mx-auto text-center'
                      : isMine
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {!isSystem && !isMine && (
                    <div className="text-xs font-medium mb-1 text-gray-600">
                      {message.sender_name}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.message_text}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      isMine ? 'text-indigo-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
