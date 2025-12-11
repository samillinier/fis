'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const { isAuthenticated, isLoading: authLoading, loginWithMicrosoft, requestAccess } = useAuth()
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsAccess, setNeedsAccess] = useState<{ email: string; name?: string } | null>(null)
  const [accessRequested, setAccessRequested] = useState(false)

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (!authLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])


  useEffect(() => {
    if (typeof window === 'undefined' || !vantaRef.current) return

    let mounted = true
    let cleanup: (() => void) | null = null

    // Load scripts
    const initVanta = async () => {
      try {
        // Load Three.js first
        if (!(window as any).THREE) {
          await new Promise<void>((resolve, reject) => {
            const threeScript = document.createElement('script')
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js'
            threeScript.onload = () => resolve()
            threeScript.onerror = () => reject(new Error('Failed to load Three.js'))
            document.head.appendChild(threeScript)
          })
        }

        // Then load Vanta.js
        if (!(window as any).VANTA) {
          await new Promise<void>((resolve, reject) => {
            const vantaScript = document.createElement('script')
            vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js'
            vantaScript.onload = () => resolve()
            vantaScript.onerror = () => reject(new Error('Failed to load Vanta.js'))
            document.head.appendChild(vantaScript)
          })
        }

        // Wait a moment for VANTA to be ready
        await new Promise(resolve => setTimeout(resolve, 200))

        if (!mounted || !vantaRef.current) return

        // Initialize Vanta
        if ((window as any).VANTA && (window as any).VANTA.WAVES) {
          vantaEffect.current = (window as any).VANTA.WAVES({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0x3c4a29,
          })
        }
      } catch (error) {
        console.error('Error initializing Vanta:', error)
      }
    }

    initVanta()

    return () => {
      mounted = false
      if (vantaEffect.current && typeof vantaEffect.current.destroy === 'function') {
        vantaEffect.current.destroy()
      }
    }
  }, [])

  if (authLoading || isAuthenticated) {
    return null // Don't show sign in page if already authenticated
  }


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div
        ref={vantaRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />
      <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="FIS Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        <div className="space-y-4">
          {needsAccess && !accessRequested ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
                <div className="font-semibold text-lg mb-2">Access Required</div>
                <div className="text-sm mb-4">
                  Your account <span className="font-medium">{needsAccess.email}</span> is not currently authorized to access this application.
                </div>
                <div className="text-sm text-amber-800 mb-4">
                  Click the button below to request access. An admin will review your request and notify you once approved.
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const success = await requestAccess(needsAccess.email, needsAccess.name, 'microsoft')
                    if (success) {
                      setAccessRequested(true)
                      showNotification('Access request sent successfully!', 'success')
                    } else {
                      showNotification('Failed to send access request. Please try again.', 'error')
                    }
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 1L11.5 6.5L17 7.5L13 11.5L13.5 17L9 14.5L4.5 17L5 11.5L1 7.5L6.5 6.5L9 1Z" fill="currentColor"/>
                  </svg>
                  Request Access
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNeedsAccess(null)}
                className="w-full text-gray-600 hover:text-gray-800 text-sm underline"
              >
                Try signing in with a different account
              </button>
            </div>
          ) : accessRequested ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-900 shadow-sm">
              <div className="font-semibold text-lg mb-2 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Access Request Sent
              </div>
              <div className="text-sm mb-2">
                Your access request for <span className="font-medium">{needsAccess?.email}</span> has been sent to the administrator.
              </div>
              <div className="text-xs text-green-700">
                You will be notified once your request is approved. Thank you for your patience.
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                setIsSubmitting(true)
                setNeedsAccess(null)
                setAccessRequested(false)
                try {
                  const result = await loginWithMicrosoft()
                  if (result.success) {
                    showNotification('Signed in with Microsoft account', 'success')
                    router.push('/')
                  } else if (result.needsAccess) {
                    setNeedsAccess(result.needsAccess)
                  } else {
                    showNotification('Microsoft sign-in failed or was cancelled.', 'error')
                  }
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting}
              className="w-full bg-white border-2 border-gray-300 text-gray-800 py-4 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="9" height="9" fill="#F25022"/>
                    <rect x="10.5" y="0.5" width="9" height="9" fill="#7FBA00"/>
                    <rect x="0.5" y="10.5" width="9" height="9" fill="#00A4EF"/>
                    <rect x="10.5" y="10.5" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

