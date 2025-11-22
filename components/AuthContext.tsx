'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

