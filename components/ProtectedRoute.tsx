'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect if on auth pages
    if (pathname === '/signin' || pathname === '/signup') {
      return
    }

    // Wait for auth check to complete
    if (isLoading) {
      return
    }

    // Redirect to sign in if not authenticated
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    // Restrict certain routes for non-admin users
    if (!isAdmin) {
      const adminOnlyPaths = [
        '/analytics',
        '/performance',
        '/store',
        '/workroom-summary',
        '/workroom-report',
        '/profile',
      ]
      if (adminOnlyPaths.includes(pathname)) {
        router.push('/')
      }
    }
    // Settings page is accessible to all authenticated users
  }, [isAuthenticated, isAdmin, isLoading, router, pathname])

  // Don't render children if not authenticated (except on auth pages)
  if (!isLoading && !isAuthenticated && pathname !== '/signin' && pathname !== '/signup') {
    return null
  }

  return <>{children}</>
}

