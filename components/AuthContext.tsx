'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser'

interface User {
  email: string
  name: string
  photoUrl?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  loginWithMicrosoft: () => Promise<boolean>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null)

  useEffect(() => {
    // Check for existing session on mount
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('fis-user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('fis-user')
        }
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call - in production, this would call your backend
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simple validation - in production, validate against your backend
    const storedUsers = localStorage.getItem('fis-users')
    if (storedUsers) {
      const users = JSON.parse(storedUsers)
      const foundUser = users.find((u: any) => u.email === email && u.password === password)
      if (foundUser) {
        const userData = { email: foundUser.email, name: foundUser.name }
        setUser(userData)
        localStorage.setItem('fis-user', JSON.stringify(userData))
        return true
      }
    }
    return false
  }

  const loginWithMicrosoft = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    try {
      const clientId = process.env.NEXT_PUBLIC_MSAL_CLIENT_ID
      // Use 'common' to allow multi-tenant access (users from any Azure AD tenant)
      const tenantId = process.env.NEXT_PUBLIC_MSAL_TENANT_ID || 'common'

      if (!clientId) {
        const errorMsg = 'Microsoft login is not configured. Please set NEXT_PUBLIC_MSAL_CLIENT_ID in Vercel environment variables.'
        console.error(errorMsg)
        alert(errorMsg + '\n\nCheck: Vercel Dashboard → Settings → Environment Variables')
        return false
      }

      let instance = msalInstance
      if (!instance) {
        instance = new PublicClientApplication({
          auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            redirectUri: typeof window !== 'undefined' ? window.location.origin + '/signin' : '/signin',
          },
        })
        await instance.initialize()
        setMsalInstance(instance)
      }

      const accounts = instance.getAllAccounts()
      let result: AuthenticationResult
      
      if (accounts.length > 0) {
        // Silent token acquisition
        try {
          result = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0],
          })
        } catch (error) {
          // Fall back to popup if silent fails
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
          
          // Check for specific errors
          if (popupError.errorCode === 'popup_window_error' || popupError.message?.includes('popup')) {
            alert('Popup was blocked. Please allow popups for this site and try again.')
            return false
          }
          
          if (popupError.errorCode?.includes('AADSTS500113') || popupError.message?.includes('reply address')) {
            const redirectUri = window.location.origin + '/signin'
            alert(`Redirect URI not configured in Azure Portal.\n\nPlease add this URI to Azure:\n${redirectUri}\n\nSee: Azure Portal → App Registrations → "FIS POD" → Authentication`)
            return false
          }
          
          alert(`Sign-in failed: ${popupError.message || popupError.errorCode || 'Unknown error'}\n\nCheck browser console (F12) for details.`)
          return false
        }
      }

      const account: AccountInfo | null = result.account
      if (account) {
        const userData: User = {
          email: account.username,
          name: account.name || account.username,
        }
        
        // Fetch profile photo from Microsoft Graph
        try {
          const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
            headers: {
              'Authorization': `Bearer ${result.accessToken}`,
            },
          })
          
          if (photoResponse.ok) {
            const photoBlob = await photoResponse.blob()
            // Convert blob to base64 for storage
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
          // Continue without photo if fetch fails
        }
        
        setUser(userData)
        localStorage.setItem('fis-user', JSON.stringify(userData))
        return true
      }
      return false
    } catch (error: any) {
      console.error('Microsoft login failed:', error)
      
      // Provide helpful error messages
      if (error.errorCode?.includes('AADSTS500113') || error.message?.includes('reply address')) {
        const redirectUri = typeof window !== 'undefined' ? window.location.origin + '/signin' : '/signin'
        alert(`Redirect URI not configured!\n\nAdd this to Azure Portal:\n${redirectUri}\n\nGo to: Azure Portal → App Registrations → "FIS POD" → Authentication → Single-page application`)
      } else if (error.errorCode === 'popup_window_error' || error.message?.includes('popup')) {
        alert('Popup was blocked. Please allow popups for this site.')
      } else {
        alert(`Sign-in error: ${error.message || error.errorCode || 'Unknown error'}\n\nCheck browser console (F12) for details.`)
      }
      
      return false
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Store user data - in production, this would call your backend
    const storedUsers = localStorage.getItem('fis-users')
    const users = storedUsers ? JSON.parse(storedUsers) : []
    
    // Check if user already exists
    if (users.some((u: any) => u.email === email)) {
      return false
    }

    // Add new user
    users.push({ name, email, password })
    localStorage.setItem('fis-users', JSON.stringify(users))

    // Auto-login after signup
    const userData = { email, name }
    setUser(userData)
    localStorage.setItem('fis-user', JSON.stringify(userData))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('fis-user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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

