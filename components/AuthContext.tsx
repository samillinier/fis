'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser'

interface User {
  email: string
  name: string
  photoUrl?: string
  role?: 'admin' | 'user'
  lastLoginAt?: string
}

interface AuthorizedUser {
  email: string
  name?: string
  role?: 'admin' | 'user'
  isActive?: boolean
  createdAt?: string
  createdBy?: string
  lastLoginAt?: string
}

interface AccessRequest {
  email: string
  name?: string
  requestedAt: string
  source: 'microsoft' | 'signup' | 'login'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAuthorized: boolean
  isAdmin: boolean
  authorizedUsers: AuthorizedUser[]
  accessRequests: AccessRequest[]
  addAuthorizedUser: (email: string, name?: string) => Promise<boolean>
  removeAuthorizedUser: (email: string) => Promise<boolean>
  approveAccessRequest: (email: string) => Promise<boolean>
  rejectAccessRequest: (email: string) => Promise<void>
  setUserRole: (email: string, role: 'admin' | 'user') => Promise<boolean>
  requestAccess: (
    email: string,
    name?: string,
    source?: 'microsoft' | 'signup' | 'login'
  ) => Promise<boolean>
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; needsAccess?: { email: string; name?: string } }>
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; needsAccess?: { email: string; name?: string } }>
  logout: () => void
  loginWithMicrosoft: () => Promise<{ success: boolean; needsAccess?: { email: string; name?: string } }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const SUPER_ADMIN_EMAIL = 'sbiru@fiscorponline.com'
const normalizeEmail = (email?: string) => (email || '').trim().toLowerCase()

const ensureSuperAdminLocal = (list: AuthorizedUser[]): AuthorizedUser[] => {
  const normalizedSuper = SUPER_ADMIN_EMAIL.toLowerCase()

  const updatedList: AuthorizedUser[] = list.map((u): AuthorizedUser =>
    u.email.toLowerCase() === normalizedSuper
      ? {
          ...u,
          role: 'admin',
          isActive: true,
        }
      : u
  )

  if (updatedList.some((u) => u.email.toLowerCase() === normalizedSuper)) {
    return updatedList
  }

  const now = new Date().toISOString()
  return [
    {
      email: SUPER_ADMIN_EMAIL,
      role: 'admin',
      isActive: true,
      createdAt: now,
    },
    ...updatedList,
  ]
}

async function fetchAuthorizedUsersFromApi(actorEmail?: string): Promise<AuthorizedUser[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (actorEmail) {
    headers['Authorization'] = `Bearer ${actorEmail}`
  }

  const response = await fetch('/api/authorized-users', {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error('Unable to load authorized users')
  }

  const data = await response.json()
  return ensureSuperAdminLocal(data.authorizedUsers || [])
}

async function fetchAccessRequestsFromApi(actorEmail?: string): Promise<AccessRequest[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (actorEmail) {
    headers['Authorization'] = `Bearer ${actorEmail}`
  }

  const response = await fetch('/api/access-requests', {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error('Unable to load access requests')
  }

  const data = await response.json()
  return data.accessRequests || []
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null)
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])

  const saveAuthorizedUsers = (users: AuthorizedUser[]) => {
    setAuthorizedUsers(users)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fis-authorized-users', JSON.stringify(users))
    }
  }

  const saveAccessRequests = (requests: AccessRequest[]) => {
    setAccessRequests(requests)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fis-access-requests', JSON.stringify(requests))
    }
  }

  const refreshAccessData = useCallback(
    async (actorEmail?: string) => {
      const email = actorEmail || user?.email
      if (!email) return
      try {
        const [authorized, requests] = await Promise.all([
          fetchAuthorizedUsersFromApi(email),
          fetchAccessRequestsFromApi(email),
        ])
        saveAuthorizedUsers(authorized)
        saveAccessRequests(requests)
      } catch (error) {
        console.error('Error refreshing access data:', error)
      }
    },
    [user?.email]
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const storedAuthorized = localStorage.getItem('fis-authorized-users')
    if (storedAuthorized) {
      try {
        const parsed = ensureSuperAdminLocal(JSON.parse(storedAuthorized))
        setAuthorizedUsers(parsed)
      } catch (error) {
        console.error('Error parsing authorized users:', error)
        saveAuthorizedUsers(ensureSuperAdminLocal([]))
      }
    } else {
      saveAuthorizedUsers(ensureSuperAdminLocal([]))
    }

    const storedRequests = localStorage.getItem('fis-access-requests')
    if (storedRequests) {
      try {
        const parsed: AccessRequest[] = JSON.parse(storedRequests)
        setAccessRequests(parsed)
      } catch (error) {
        console.error('Error parsing access requests:', error)
        saveAccessRequests([])
      }
    }

    const storedUser = localStorage.getItem('fis-user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('fis-user')
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!user?.email) return
      setIsLoading(true)
      await refreshAccessData(user.email)
      if (!cancelled) {
        setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.email, refreshAccessData])

  const isAdmin =
    user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user?.role === 'admin'

  const isAuthorized =
    !!user &&
    authorizedUsers.some((u) => {
      if (u.email.toLowerCase() !== (user?.email || '').toLowerCase()) return false
      return u.isActive !== false
    })

  const addAuthorizedUser = async (email: string, name?: string): Promise<boolean> => {
    if (!isAdmin) return false
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return false

    try {
      const response = await fetch('/api/authorized-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.email}`,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          name: name?.trim(),
          role: 'user',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add user')
      }

      const data = await response.json()
      saveAuthorizedUsers(ensureSuperAdminLocal(data.authorizedUsers || []))
      return true
    } catch (error) {
      console.error('Error adding authorized user:', error)
      return false
    }
  }

  const approveAccessRequest = async (email: string): Promise<boolean> => {
    const normalizedEmail = normalizeEmail(email)
    const request = accessRequests.find((r) => r.email.toLowerCase() === normalizedEmail)

    const success = await addAuthorizedUser(email, request?.name)
    if (!success) return false

    await rejectAccessRequest(email)
    await refreshAccessData(user?.email || email)
    return true
  }

  const rejectAccessRequest = async (email: string): Promise<void> => {
    const normalizedEmail = normalizeEmail(email)
    const remaining = accessRequests.filter((r) => r.email.toLowerCase() !== normalizedEmail)
    saveAccessRequests(remaining)

    try {
      await fetch(`/api/access-requests?email=${encodeURIComponent(normalizedEmail)}`, {
        method: 'DELETE',
        headers: {
          Authorization: user?.email ? `Bearer ${user.email}` : '',
        },
      })
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const requestAccess = async (
    email: string,
    name?: string,
    source: 'microsoft' | 'signup' | 'login' = 'login'
  ): Promise<boolean> => {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return false

    const now = new Date().toISOString()
    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          name: name?.trim(),
          source,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit request')
      }

      saveAccessRequests([
        {
          email: normalizedEmail,
          name: name?.trim(),
          requestedAt: now,
          source,
        },
        ...accessRequests.filter((r) => r.email.toLowerCase() !== normalizedEmail),
      ])

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'fis-latest-access-request',
          JSON.stringify({
            email: normalizedEmail,
            name: name?.trim(),
            requestedAt: now,
            source,
          })
        )
      }
      return true
    } catch (error) {
      console.error('Error requesting access:', error)
      return false
    }
  }

  const removeAuthorizedUser = async (email: string): Promise<boolean> => {
    if (!isAdmin) return false
    const normalizedEmail = normalizeEmail(email)
    if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase()) return false

    try {
      const response = await fetch(
        `/api/authorized-users?email=${encodeURIComponent(normalizedEmail)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user?.email}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to remove user')
      }

      const data = await response.json()
      saveAuthorizedUsers(ensureSuperAdminLocal(data.authorizedUsers || []))
      return true
    } catch (error) {
      console.error('Error removing authorized user:', error)
      return false
    }
  }

  const setUserRole = async (email: string, role: 'admin' | 'user'): Promise<boolean> => {
    if (!isAdmin) return false
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return false

    try {
      const response = await fetch('/api/authorized-users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.email}`,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          role,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update role')
      }

      const data = await response.json()
      saveAuthorizedUsers(ensureSuperAdminLocal(data.authorizedUsers || []))
      return true
    } catch (error) {
      console.error('Error updating user role:', error)
      return false
    }
  }

  const markUserLogin = (email: string) => {
    const normalized = email.toLowerCase()
    const now = new Date().toISOString()
    const updated = authorizedUsers.map((u) =>
      u.email.toLowerCase() === normalized
        ? {
            ...u,
            lastLoginAt: now,
          }
        : u
    )
    saveAuthorizedUsers(ensureSuperAdminLocal(updated))

    setUser((prev) =>
      prev && prev.email.toLowerCase() === normalized
        ? {
            ...prev,
            lastLoginAt: now,
          }
        : prev
    )
  }

  const loadAuthorizedForEmail = useCallback(
    async (email: string): Promise<AuthorizedUser[]> => {
      try {
        const list = await fetchAuthorizedUsersFromApi(email)
        saveAuthorizedUsers(list)
        return list
      } catch (error) {
        console.error('Error loading authorized users for login:', error)
        return ensureSuperAdminLocal(authorizedUsers)
      }
    },
    [authorizedUsers]
  )

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; needsAccess?: { email: string; name?: string } }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const storedUsers = localStorage.getItem('fis-users')
    if (storedUsers) {
      const users = JSON.parse(storedUsers)
      const foundUser = users.find((u: any) => u.email === email && u.password === password)
      if (foundUser) {
        const list = await loadAuthorizedForEmail(foundUser.email)
        const authorizedEntry = list.find((u) => u.email.toLowerCase() === foundUser.email.toLowerCase())
        if (!authorizedEntry || authorizedEntry.isActive === false) {
          return {
            success: false,
            needsAccess: {
              email: foundUser.email,
              name: foundUser.name,
            },
          }
        }

        const isSuperAdmin = foundUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        const now = new Date().toISOString()
        const userData: User = {
          email: foundUser.email,
          name: foundUser.name,
          role: isSuperAdmin ? 'admin' : authorizedEntry.role || 'user',
          lastLoginAt: now,
        }
        setUser(userData)
        localStorage.setItem('fis-user', JSON.stringify(userData))
        markUserLogin(foundUser.email)
        await refreshAccessData(foundUser.email)
        return { success: true }
      }
    }
    return { success: false }
  }

  const loginWithMicrosoft = async (): Promise<{
    success: boolean
    needsAccess?: { email: string; name?: string }
  }> => {
    if (typeof window === 'undefined') return { success: false }

    try {
      const clientId = process.env.NEXT_PUBLIC_MSAL_CLIENT_ID
      const tenantId = process.env.NEXT_PUBLIC_MSAL_TENANT_ID || 'common'

      if (!clientId) {
        const errorMsg =
          'Microsoft login is not configured. Please set NEXT_PUBLIC_MSAL_CLIENT_ID in Vercel environment variables.'
        console.error(errorMsg)
        alert(
          errorMsg + '\n\nCheck: Vercel Dashboard → Settings → Environment Variables'
        )
        return { success: false }
      }

      let instance = msalInstance
      if (!instance) {
        instance = new PublicClientApplication({
          auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            redirectUri:
              typeof window !== 'undefined' ? window.location.origin + '/signin' : '/signin',
          },
        })
        await instance.initialize()
        setMsalInstance(instance)
      }

      const accounts = instance.getAllAccounts()
      let result: AuthenticationResult

      if (accounts.length > 0) {
        try {
          result = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0],
          })
        } catch (error) {
          result = await instance.loginPopup({
            scopes: ['User.Read'],
          })
        }
      } else {
        try {
          result = await instance.loginPopup({
            scopes: ['User.Read', 'User.ReadBasic.All'],
          })
        } catch (popupError: any) {
          console.error('Popup login error:', popupError)

          if (popupError.errorCode === 'popup_window_error' || popupError.message?.includes('popup')) {
            alert('Popup was blocked. Please allow popups for this site and try again.')
            return { success: false }
          }

          if (
            popupError.errorCode?.includes('AADSTS500113') ||
            popupError.message?.includes('reply address')
          ) {
            const redirectUri =
              typeof window !== 'undefined' ? window.location.origin + '/signin' : '/signin'
            alert(
              `Redirect URI not configured in Azure Portal.\n\nPlease add this URI to Azure:\n${redirectUri}\n\nSee: Azure Portal → App Registrations → "FIS POD" → Authentication`
            )
            return { success: false }
          }

          alert(
            `Sign-in failed: ${
              popupError.message || popupError.errorCode || 'Unknown error'
            }\n\nCheck browser console (F12) for details.`
          )
          return { success: false }
        }
      }

      const account: AccountInfo | null = result.account
      if (account) {
        const list = await loadAuthorizedForEmail(account.username)
        const authorizedEntry = list.find(
          (u) => u.email.toLowerCase() === account.username.toLowerCase()
        )
        if (!authorizedEntry || authorizedEntry.isActive === false) {
          return {
            success: false,
            needsAccess: {
              email: account.username,
              name: account.name || account.username,
            },
          }
        }

        const isSuperAdmin = account.username.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        const now = new Date().toISOString()
        const userData: User = {
          email: account.username,
          name: authorizedEntry.name || account.name || account.username,
          role: authorizedEntry.role || (isSuperAdmin ? 'admin' : 'user'),
          lastLoginAt: now,
        }

        try {
          const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
            headers: {
              Authorization: `Bearer ${result.accessToken}`,
            },
          })

          if (photoResponse.ok) {
            const photoBlob = await photoResponse.blob()
            const base64String = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(photoBlob)
            })
            userData.photoUrl = base64String
          }
        } catch (error) {
          console.log('Could not fetch profile photo:', error)
        }

        setUser(userData)
        localStorage.setItem('fis-user', JSON.stringify(userData))
        markUserLogin(account.username)
        await refreshAccessData(account.username)
        return { success: true }
      }
      return { success: false }
    } catch (error: any) {
      console.error('Microsoft login failed:', error)

      if (error.errorCode?.includes('AADSTS500113') || error.message?.includes('reply address')) {
        const redirectUri =
          typeof window !== 'undefined' ? window.location.origin + '/signin' : '/signin'
        alert(
          `Redirect URI not configured!\n\nAdd this to Azure Portal:\n${redirectUri}\n\nGo to: Azure Portal → App Registrations → "FIS POD" → Authentication → Single-page application`
        )
      } else if (error.errorCode === 'popup_window_error' || error.message?.includes('popup')) {
        alert('Popup was blocked. Please allow popups for this site.')
      } else {
        alert(
          `Sign-in error: ${error.message || error.errorCode || 'Unknown error'}\n\nCheck browser console (F12) for details.`
        )
      }

      return { success: false }
    }
  }

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; needsAccess?: { email: string; name?: string } }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const storedUsers = localStorage.getItem('fis-users')
    const users = storedUsers ? JSON.parse(storedUsers) : []

    if (users.some((u: any) => u.email === email)) {
      return { success: false }
    }

    users.push({ name, email, password })
    localStorage.setItem('fis-users', JSON.stringify(users))

    const list = await loadAuthorizedForEmail(email)
    const authorizedEntry = list.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!authorizedEntry || authorizedEntry.isActive === false) {
      return {
        success: false,
        needsAccess: {
          email,
          name,
        },
      }
    }

    const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    const now = new Date().toISOString()
    const userData: User = {
      email,
      name,
      role: isSuperAdmin ? 'admin' : authorizedEntry.role || 'user',
      lastLoginAt: now,
    }
    setUser(userData)
    localStorage.setItem('fis-user', JSON.stringify(userData))
    markUserLogin(email)
    await refreshAccessData(email)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fis-user')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthorized,
        isAdmin,
        authorizedUsers,
        accessRequests,
        addAuthorizedUser,
        removeAuthorizedUser,
        approveAccessRequest,
        rejectAccessRequest,
        setUserRole,
        requestAccess,
        login,
        signup,
        logout,
        loginWithMicrosoft,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
