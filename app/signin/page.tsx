'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const { isAuthenticated, isLoading: authLoading, loginWithMicrosoft } = useAuth()
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          <button
            type="button"
            onClick={async () => {
              setIsSubmitting(true)
              try {
                const success = await loginWithMicrosoft()
                if (success) {
                  showNotification('Signed in with Microsoft account', 'success')
                  router.push('/')
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
        </div>
      </div>
    </div>
  )
}

