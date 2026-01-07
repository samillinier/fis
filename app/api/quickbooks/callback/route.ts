import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// Get production credentials from environment (only validate at runtime, not build time)
function getQuickBooksCredentials() {
  // Production Client ID and Secret
  const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || 'ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS'
  const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || ''
  
  // Use fixed production domain to match frontend (preview URLs change on each deployment)
  const PRODUCTION_DOMAIN = process.env.NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN || 'https://fis-phi.vercel.app'
  const REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI || `${PRODUCTION_DOMAIN}/api/quickbooks/callback`

  // Validate required credentials at runtime
  if (!CLIENT_SECRET) {
    console.error('QUICKBOOKS_CLIENT_SECRET is not set in environment variables')
    throw new Error('QuickBooks Client Secret is required. Please set QUICKBOOKS_CLIENT_SECRET in your environment variables.')
  }

  return { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI }
}

export async function GET(request: NextRequest) {
  try {
    // Get credentials at runtime
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = getQuickBooksCredentials()
    
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const realmId = searchParams.get('realmId')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('QuickBooks OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/finance-hub?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !realmId) {
      return NextResponse.redirect(
        new URL('/finance-hub?error=missing_parameters', request.url)
      )
    }

    // Verify state (should match what we stored in sessionStorage)
    // Note: In production, you should verify this against a stored value

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      console.error('CLIENT_ID:', CLIENT_ID)
      console.error('CLIENT_SECRET exists:', !!CLIENT_SECRET)
      console.error('REDIRECT_URI:', REDIRECT_URI || `${request.nextUrl.origin}/api/quickbooks/callback`)
      return NextResponse.redirect(
        new URL('/finance-hub?error=token_exchange_failed', request.url)
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Get company info
    // Production mode: uses production QuickBooks API
    const isProduction = process.env.QUICKBOOKS_ENVIRONMENT === 'production'
    const baseUrl = isProduction 
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com'
    
    let companyName = null
    try {
      const companyResponse = await fetch(`${baseUrl}/v3/company/${realmId}/query?query=SELECT * FROM CompanyInfo MAXRESULTS 1`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
      })

      if (companyResponse.ok) {
        const companyData = await companyResponse.json()
        if (companyData.QueryResponse?.CompanyInfo?.[0]?.CompanyName) {
          companyName = companyData.QueryResponse.CompanyInfo[0].CompanyName
        }
      }
    } catch (err) {
      console.error('Error fetching company info:', err)
      // Continue even if company info fetch fails
    }

    // Extract user email from state parameter
    // Format: state = base64(userEmail + '|' + randomString)
    let userEmail: string | null = null
    
    if (state) {
      try {
        const decodedState = Buffer.from(state, 'base64').toString('utf-8')
        const [email] = decodedState.split('|')
        if (email && email.includes('@')) {
          userEmail = email
        }
      } catch (e) {
        console.error('Error decoding state:', e)
      }
    }
    
    // Fallback to cookie if state decode failed
    if (!userEmail) {
      userEmail = request.cookies.get('user_email')?.value || null
    }

    if (!userEmail) {
      // Redirect to sign in if no user found
      return NextResponse.redirect(
        new URL('/signin?redirect=/finance-hub', request.url)
      )
    }

    const userId = await ensureUserExists(userEmail)

    // Calculate expiration time
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600))

    // Store tokens in database
    // Using service_role key bypasses RLS, so we can insert directly
    const { error: dbError } = await supabase
      .from('quickbooks_connections')
      .upsert({
        user_id: userId,
        realm_id: realmId,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt.toISOString(),
        company_name: companyName,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (dbError) {
      console.error('Error saving QuickBooks connection:', dbError)
      console.error('Database error details:', JSON.stringify(dbError, null, 2))
      console.error('User ID:', userId)
      console.error('Realm ID:', realmId)
      
      // Provide more specific error message
      const errorMessage = dbError.message || 'Unknown database error'
      return NextResponse.redirect(
        new URL(`/finance-hub?error=database_error&details=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }

    // Redirect back to Finance Hub with success
    return NextResponse.redirect(
      new URL('/finance-hub?connected=true', request.url)
    )
  } catch (error) {
    console.error('Error in QuickBooks callback:', error)
    return NextResponse.redirect(
      new URL('/finance-hub?error=internal_error', request.url)
    )
  }
}

