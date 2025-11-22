'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react'

export default function SignInPage() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { showNotification } = useNotification()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const success = await login(email, password)
      if (success) {
        showNotification('Successfully signed in!', 'success')
        router.push('/')
      } else {
        showNotification('Invalid email or password. Please try again.', 'error')
      }
    } catch (error) {
      showNotification('An error occurred. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#80875d] focus:border-transparent outline-none transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#80875d] focus:border-transparent outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#80875d] text-white py-3 rounded-lg font-semibold hover:bg-[#6d7349] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-[#80875d] font-semibold hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

