'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LowesLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get stored Lowe's team members
      const storedMembers = localStorage.getItem('lowes-team-members')
      const members = storedMembers ? JSON.parse(storedMembers) : []

      // Find matching member
      const member = members.find((m: any) => m.email === email && m.password === password)

      if (!member) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      // Ensure member has profile data (for backward compatibility)
      if (!member.profile) {
        member.profile = {
          photoUrl: null,
          updatedAt: new Date().toISOString()
        }
        // Update the member in storage
        const memberIndex = members.findIndex((m: any) => m.email === email)
        if (memberIndex !== -1) {
          members[memberIndex] = member
          localStorage.setItem('lowes-team-members', JSON.stringify(members))
        }
      }

      // Store logged-in member info with their own profile data
      const lowesTeamMember = {
        email: member.email,
        name: member.name,
        role: member.role || '',
        district: member.district || '',
        storeNumber: member.storeNumber || '',
        loggedIn: true,
        loggedInAt: new Date().toISOString(),
        photoUrl: member.profile?.photoUrl || null // Load user's own profile photo
      }

      localStorage.setItem('lowes-team-member', JSON.stringify(lowesTeamMember))

      // Redirect to dashboard
      router.push('/lowes/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#004990]" style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex flex-col items-center">
            <img 
              src="/lowes-logo-png-transparent.png" 
              alt="Lowe's Logo" 
              className="h-72 w-auto object-contain"
              style={{ maxHeight: '400px', display: 'block', marginBottom: '-8px', paddingBottom: '0' }}
            />
            <h2 className="text-center text-3xl font-bold text-white" style={{ marginTop: '0', marginBottom: '0', lineHeight: '1', paddingTop: '0' }}>
              Lowe's Pricing Team
            </h2>
          </div>
          <p className="mt-2 text-center text-sm text-white opacity-90">
            Sign in to access pricing validation chats
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="Your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border-2 border-white border-opacity-30 text-white rounded-lg font-semibold bg-white bg-opacity-10 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg backdrop-blur-sm text-base"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/lowes/signup" 
              className="text-white text-sm hover:text-gray-200 underline"
            >
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="text-center text-xs text-white opacity-75">
            <p>For Lowe's Pricing Team members only</p>
          </div>
        </form>
      </div>
    </div>
  )
}
