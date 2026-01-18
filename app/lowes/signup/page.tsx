'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LowesSignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [district, setDistrict] = useState('')
  const [storeNumber, setStoreNumber] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)

  // Load available groups on mount
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoadingGroups(true)
      try {
        // Fetch groups from public endpoint (no auth required for signup)
        const response = await fetch('/api/lowes-groups/public')
        if (response.ok) {
          const data = await response.json()
          setGroups(data.groups || [])
        }
      } catch (error) {
        console.error('Error loading groups:', error)
      } finally {
        setIsLoadingGroups(false)
      }
    }
    loadGroups()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (!selectedGroup) {
      setError('Please select a department/group')
      setIsLoading(false)
      return
    }

    try {
      // Get stored Lowe's team members
      const storedMembers = localStorage.getItem('lowes-team-members')
      const members = storedMembers ? JSON.parse(storedMembers) : []

      // Check if email already exists
      if (members.some((m: any) => m.email === email)) {
        setError('An account with this email already exists')
        setIsLoading(false)
        return
      }

      // Add new member with unique profile
      const newMember = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: role.trim(),
        district: district.trim(),
        storeNumber: storeNumber.trim(),
        createdAt: new Date().toISOString(),
        // Each user has their own profile data
        profile: {
          photoUrl: null, // Can be updated later
          updatedAt: new Date().toISOString()
        }
      }

      members.push(newMember)
      localStorage.setItem('lowes-team-members', JSON.stringify(members))

      // Note: We save the groupId in localStorage but don't auto-add to group via API
      // This requires admin auth. The admin can manually approve and add them to the group
      // Or we could create a separate endpoint for this in the future

      // Auto-login after signup - load user's profile
      const lowesTeamMember = {
        email: newMember.email,
        name: newMember.name,
        role: newMember.role,
        district: newMember.district,
        storeNumber: newMember.storeNumber,
        groupId: selectedGroup,
        loggedIn: true,
        loggedInAt: new Date().toISOString(),
        photoUrl: newMember.profile.photoUrl // Load user's own profile photo
      }

      localStorage.setItem('lowes-team-member', JSON.stringify(lowesTeamMember))

      // Redirect to dashboard
      router.push('/lowes/dashboard')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Signup failed. Please try again.')
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
              Lowe's Pro Connect
            </h2>
          </div>
          <p className="mt-2 text-center text-sm text-white opacity-90">
            Create an account to access Lowe's Pro Connect
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="John Doe"
              />
            </div>

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
              <label htmlFor="role" className="block text-sm font-medium text-white mb-2">
                Role
              </label>
              <input
                id="role"
                name="role"
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="e.g., Project Coordinator, General Manager, President"
              />
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium text-white mb-2">
                District
              </label>
              <input
                id="district"
                name="district"
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="District 123"
              />
            </div>

            <div>
              <label htmlFor="storeNumber" className="block text-sm font-medium text-white mb-2">
                Store Number
              </label>
              <input
                id="storeNumber"
                name="storeNumber"
                type="text"
                required
                value={storeNumber}
                onChange={(e) => setStoreNumber(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="Store 456"
              />
            </div>

            <div>
              <label htmlFor="selectedGroup" className="block text-sm font-medium text-white mb-2">
                Department/Group <span className="text-red-500">*</span>
              </label>
              {isLoadingGroups ? (
                <div className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-500 shadow-lg">
                  Loading groups...
                </div>
              ) : (
                <select
                  id="selectedGroup"
                  name="selectedGroup"
                  required
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg appearance-none cursor-pointer"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="" className="text-gray-400">-- Select your department --</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id} className="text-gray-900">
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
              {groups.length === 0 && !isLoadingGroups && (
                <p className="text-xs text-white opacity-75 mt-1">
                  No groups available. Please contact an admin.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 shadow-lg"
                placeholder="Confirm your password"
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
                  <span>Creating account...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/lowes/login" 
              className="text-white text-sm hover:text-gray-200 underline"
            >
              Already have an account? Sign in
            </Link>
          </div>

          <div className="text-center text-xs text-white opacity-75">
            <p>For Lowe's Pro Connect members only</p>
          </div>
        </form>
      </div>
    </div>
  )
}
