'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from './AuthContext'
import { DollarSign, Link2, Unlink, TrendingUp, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'

interface QuickBooksConnection {
  connected: boolean
  companyName?: string
  connectedAt?: string
  realmId?: string
}

export default function FinanceHub() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [connection, setConnection] = useState<QuickBooksConnection>({ connected: false })
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Production Client ID (from Keys & Credentials in Intuit Dashboard - Production tab)
  const CLIENT_ID = process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID || 'ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS'
  // Use FIXED production domain for QuickBooks (preview URLs change on each deployment)
  // Set NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN in Vercel environment variables
  // This ensures the redirect URI always matches what's configured in Intuit Dashboard
  const PRODUCTION_DOMAIN = process.env.NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN || 'https://fis-phi.vercel.app'
  const REDIRECT_URI = `${PRODUCTION_DOMAIN}/api/quickbooks/callback`
  const SCOPE = 'com.intuit.quickbooks.accounting'
  // OAuth 2.0 authorization URL - must start with https://appcenter.intuit.com/connect/oauth2
  const INTUIT_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2'

  const checkConnectionStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user?.email) {
        console.warn('⚠️ No user email available for status check')
        setConnection({ connected: false })
        setLoading(false)
        return
      }

      console.log('🔍 Checking QuickBooks connection status for:', user.email)
      
      const response = await fetch('/api/quickbooks/status', {
        headers: {
          'Authorization': `Bearer ${user.email}`,
        },
      })

      console.log('📡 Status API response:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Connection status data:', data)
        setConnection(data)
        
        if (data.connected) {
          console.log('✅ QuickBooks is connected!', {
            companyName: data.companyName,
            realmId: data.realmId,
            connectedAt: data.connectedAt
          })
        } else {
          console.log('ℹ️ QuickBooks is not connected')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Status check failed:', response.status, errorData)
        setConnection({ connected: false })
        if (errorData.error) {
          setError(errorData.error)
        }
      }
    } catch (err) {
      console.error('❌ Error checking connection status:', err)
      setConnection({ connected: false })
      setError('Failed to check connection status. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  // Check connection status when component mounts and user is available
  useEffect(() => {
    if (user?.email) {
      checkConnectionStatus()
    }
  }, [user?.email, checkConnectionStatus])

  // Handle OAuth callback parameters (runs whenever URL search params change)
  useEffect(() => {
    const connected = searchParams.get('connected')
    const errorParam = searchParams.get('error')
    
    if (connected === 'true') {
      // Connection successful - wait a moment for database write to complete, then refresh
      setTimeout(() => {
        if (user?.email) {
          checkConnectionStatus()
        }
      }, 500) // Small delay to ensure database write completes
      // Clean up URL (remove query params)
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/finance-hub')
      }
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam))
      // Clean up URL (remove query params)
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/finance-hub')
      }
    }
  }, [searchParams, user?.email, checkConnectionStatus]) // Re-run when search params or user changes

  const handleConnect = () => {
    try {
      setIsConnecting(true)
      setError(null)

      if (!user?.email) {
        setError('You must be logged in to connect QuickBooks')
        setIsConnecting(false)
        return
      }

      // Validate required values
      if (!CLIENT_ID) {
        setError('QuickBooks Client ID is not configured. Please contact support.')
        setIsConnecting(false)
        return
      }

      if (!REDIRECT_URI) {
        setError('Redirect URI is not configured. Please contact support.')
        setIsConnecting(false)
        return
      }

      // Generate state for OAuth security
      // Include user email in state for callback retrieval
      const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const stateString = `${user.email}|${randomString}`
      const state = btoa(stateString) // Use browser's btoa instead of Buffer
      sessionStorage.setItem('qb_oauth_state', state)
      
      // Store user email in cookie for callback (backup)
      document.cookie = `user_email=${user.email}; path=/; max-age=3600; SameSite=Lax`

      // Build OAuth URL with all required parameters
      // Must start with https://appcenter.intuit.com/connect/oauth2
      if (!INTUIT_AUTH_URL.startsWith('https://appcenter.intuit.com/connect/oauth2')) {
        console.error('❌ ERROR: OAuth URL must start with https://appcenter.intuit.com/connect/oauth2')
        setError('Invalid OAuth configuration. Please contact support.')
        setIsConnecting(false)
        return
      }
      
      const authUrl = new URL(INTUIT_AUTH_URL)
      authUrl.searchParams.set('client_id', CLIENT_ID)
      authUrl.searchParams.set('scope', SCOPE)
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('access_type', 'offline')

      // Log for debugging (remove sensitive data in production)
      console.log('=== QuickBooks OAuth Configuration ===')
      console.log('Client ID:', CLIENT_ID)
      console.log('Redirect URI:', REDIRECT_URI)
      console.log('Redirect URI Length:', REDIRECT_URI.length)
      console.log('Redirect URI (encoded):', encodeURIComponent(REDIRECT_URI))
      console.log('Scope:', SCOPE)
      console.log('OAuth URL:', INTUIT_AUTH_URL)
      console.log('Full OAuth URL (state hidden):', authUrl.toString().replace(/state=[^&]+/, 'state=***'))
      console.log('=====================================')
      console.log('🔍 DIAGNOSTIC: Copy the "Redirect URI" value above')
      console.log('🔍 Compare it EXACTLY with Intuit Dashboard → Settings → Redirect URIs → Development')
      console.log('🔍 They must match character-by-character (no trailing slash, exact case)')
      
      // Validate redirect URI format
      if (!REDIRECT_URI.startsWith('http://') && !REDIRECT_URI.startsWith('https://')) {
        setError('Invalid redirect URI format. Please check your configuration.')
        setIsConnecting(false)
        return
      }
      
      // Warn if redirect URI might not match Intuit Dashboard
      if (REDIRECT_URI.endsWith('/')) {
        console.error('❌ ERROR: Redirect URI has trailing slash!')
        console.error('Remove the trailing slash. It should be:', REDIRECT_URI.slice(0, -1))
        setError('Redirect URI has trailing slash. Remove it and try again.')
        setIsConnecting(false)
        return
      }
      
      // Check if redirect URI looks correct
      if (!REDIRECT_URI.includes('/api/quickbooks/callback')) {
        console.warn('⚠️ WARNING: Redirect URI might be incorrect. Should end with /api/quickbooks/callback')
      }
      
      // Display diagnostic info to user
      console.log('📋 DIAGNOSTIC INFO:')
      console.log('1. Make sure this Redirect URI is in Intuit Dashboard → Keys & OAuth:')
      console.log('   ', REDIRECT_URI)
      console.log('2. ⚠️ CRITICAL: Make sure App Name is set in Intuit Dashboard (not empty/undefined)')
      console.log('   - Go to Intuit Dashboard → App Overview or Settings')
      console.log('   - Set App Name to: FISPOD')
      console.log('   - This is the #1 cause of "undefined didn\'t connect" error!')
      console.log('3. ⚠️ ENVIRONMENT MATCH: Make sure redirect URI is in BOTH Development AND Production tabs')
      console.log('   - In Intuit Dashboard → Redirect URIs, check BOTH "</> Development" and "Production" tabs')
      console.log('   - Add the same redirect URI to BOTH environments')
      console.log('4. After making changes in Intuit Dashboard, wait 5-10 minutes before testing')
      
      // Verify redirect URI matches expected domain
      if (!REDIRECT_URI.includes('fis-phi.vercel.app') && !REDIRECT_URI.includes('fis-bcbs9n06m-samilliniers-projects.vercel.app')) {
        console.warn('⚠️ WARNING: Redirect URI domain might not match Intuit Dashboard configuration')
        console.warn('Expected domain: fis-phi.vercel.app or fis-bcbs9n06m-samilliniers-projects.vercel.app')
        console.warn('Actual:', REDIRECT_URI)
      }

      // Redirect to Intuit OAuth
      window.location.href = authUrl.toString()
    } catch (err) {
      console.error('Error initiating connection:', err)
      setError('Failed to initiate QuickBooks connection. Please try again.')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setError(null)
      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.email || ''}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setConnection({ connected: false })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to disconnect from QuickBooks')
      }
    } catch (err) {
      console.error('Error disconnecting:', err)
      setError('Failed to disconnect from QuickBooks. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Finance Hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <DollarSign className="text-blue-600" size={32} />
              Finance Hub
            </h1>
            <p className="text-gray-600">Connect and manage your QuickBooks integration</p>
          </div>
        </div>
      </div>

      {/* QuickBooks Connection Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Link2 className="text-blue-600" size={24} />
            QuickBooks Connection
          </h2>
          {connection.connected ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={20} />
              <span className="font-medium">Connected</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-gray-500">
              <Unlink size={20} />
              <span className="font-medium">Not Connected</span>
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {connection.connected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <p className="font-semibold text-green-900">Successfully Connected to QuickBooks</p>
              </div>
              {connection.companyName && (
                <p className="text-green-800 text-sm mb-1">
                  <strong>Company:</strong> {connection.companyName}
                </p>
              )}
              {connection.realmId && (
                <p className="text-green-800 text-sm mb-1">
                  <strong>Realm ID:</strong> {connection.realmId}
                </p>
              )}
              {connection.connectedAt && (
                <p className="text-green-800 text-sm">
                  <strong>Connected:</strong> {new Date(connection.connectedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Unlink size={18} />
                Disconnect QuickBooks
              </button>
              <button
                onClick={checkConnectionStatus}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Link2 size={18} />
                Refresh Status
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm mb-3">
                Connect your QuickBooks account to sync financial data and access accounting features.
              </p>
              <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                <li>View company financial information</li>
                <li>Sync invoices and payments</li>
                <li>Access accounting reports</li>
                <li>Manage financial data</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 size={20} />
                    Connect to QuickBooks
                  </>
                )}
              </button>
              <button
                onClick={checkConnectionStatus}
                disabled={loading}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh connection status"
              >
                <Link2 size={18} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features Section */}
      {connection.connected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <TrendingUp className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold mb-2">Financial Reports</h3>
            <p className="text-gray-600 text-sm">Access profit & loss, balance sheets, and cash flow reports.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <FileText className="text-green-600 mb-3" size={32} />
            <h3 className="font-semibold mb-2">Invoices & Payments</h3>
            <p className="text-gray-600 text-sm">View and manage invoices, payments, and transactions.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <DollarSign className="text-purple-600 mb-3" size={32} />
            <h3 className="font-semibold mb-2">Accounting Data</h3>
            <p className="text-gray-600 text-sm">Sync and analyze your accounting data in real-time.</p>
          </div>
        </div>
      )}

    </div>
  )
}

