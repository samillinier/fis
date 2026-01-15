'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/components/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LowesChatIntake, { IntakeData } from '@/components/LowesChatIntake'
import LowesChatBox from '@/components/LowesChatBox'
import { useSearchParams, useRouter } from 'next/navigation'

type ChatState = 'intake' | 'chat' | 'loading'

function LowesChatContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [chatState, setChatState] = useState<ChatState>('intake')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationKey, setConversationKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if accessing via shareable link (conversation key in URL)
  useEffect(() => {
    const key = searchParams.get('key')
    if (key && user?.email) {
      // Load conversation by key
      loadConversationByKey(key)
    }
  }, [searchParams, user?.email])

  const loadConversationByKey = async (key: string) => {
    if (!user?.email) return

    try {
      const authHeader = `Bearer ${user.email}`
      const response = await fetch(
        `/api/lowes-chat/conversations?key=${key}`,
        {
          headers: {
            'Authorization': authHeader
          }
        }
      )

      if (!response.ok) {
        throw new Error('Conversation not found')
      }

      const data = await response.json()
      if (data.conversation) {
        setConversationId(data.conversation.id)
        setConversationKey(data.conversation.conversation_key)
        setChatState('chat')
      }
    } catch (err: any) {
      console.error('Error loading conversation:', err)
      setError(err.message || 'Failed to load conversation')
      setChatState('intake') // Fall back to intake form
    }
  }

  const handleIntakeSubmit = async (data: IntakeData) => {
    if (!user?.email) {
      setError('You must be logged in to start a chat')
      return
    }

    setChatState('loading')
    setError(null)

    try {
      const authHeader = `Bearer ${user.email}`
      const response = await fetch('/api/lowes-chat/conversations', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create conversation')
      }

      const result = await response.json()
      setConversationId(result.conversation.id)
      setConversationKey(result.conversationKey)

      // Update URL with shareable key
      const newUrl = `/lowes-chat?key=${result.conversationKey}`
      router.push(newUrl)

      setChatState('chat')
    } catch (err: any) {
      console.error('Error creating conversation:', err)
      setError(err.message || 'Failed to start conversation')
      setChatState('intake')
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading authentication...</div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <strong>Debug:</strong> State = {chatState}, 
              ConversationId = {conversationId ? 'Set' : 'None'}, 
              User = {user?.email || 'None'}
            </div>
          )}

          {chatState === 'intake' && (
            <>
              <LowesChatIntake onSubmit={handleIntakeSubmit} />
              {error && (
                <div className="max-w-2xl mx-auto mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <strong>Error:</strong> {error}
                  <br />
                  <small className="text-red-600 mt-2 block">
                    Make sure you've run the database schema (database/lowes-chat-schema.sql) in Supabase.
                  </small>
                </div>
              )}
            </>
          )}

          {chatState === 'loading' && (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500">Starting your conversation...</div>
            </div>
          )}

          {chatState === 'chat' && conversationId && conversationKey && (
            <div className="max-w-4xl mx-auto">
              <LowesChatBox
                conversationId={conversationId}
                conversationKey={conversationKey}
              />
              
              {/* Shareable Link Info */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Shareable Link</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Share this link to access this conversation:
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-white border border-blue-200 rounded px-3 py-2 text-sm text-blue-900 break-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/lowes-chat?key={conversationKey}
                      </code>
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/lowes-chat?key=${conversationKey}`
                          navigator.clipboard.writeText(link)
                          alert('Link copied to clipboard!')
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function LowesChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <LowesChatContent />
    </Suspense>
  )
}
