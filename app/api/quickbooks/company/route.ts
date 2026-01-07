import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// Helper function to get QuickBooks API base URL
function getQuickBooksBaseUrl() {
  const isProduction = process.env.QUICKBOOKS_ENVIRONMENT === 'production'
  return isProduction 
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com'
}

// Helper function to refresh access token if needed
async function getValidAccessToken(userId: string) {
  const { data: connection, error } = await supabase
    .from('quickbooks_connections')
    .select('access_token, refresh_token, expires_at, realm_id')
    .eq('user_id', userId)
    .single()

  if (error || !connection) {
    throw new Error('No QuickBooks connection found')
  }

  // Check if token is expired
  const now = new Date()
  const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null
  
  if (expiresAt && expiresAt < now) {
    // Token expired, need to refresh
    const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || ''
    const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || ''
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('QuickBooks credentials not configured')
    }

    const refreshResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    })

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh access token')
    }

    const tokenData = await refreshResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Update tokens in database
    const expiresAtNew = new Date()
    expiresAtNew.setSeconds(expiresAtNew.getSeconds() + (expires_in || 3600))

    await supabase
      .from('quickbooks_connections')
      .update({
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAtNew.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return { access_token, realm_id: connection.realm_id }
  }

  return { access_token: connection.access_token, realm_id: connection.realm_id }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get valid access token (refresh if needed)
    const { access_token, realm_id } = await getValidAccessToken(userId)

    // Fetch company information from QuickBooks
    const baseUrl = getQuickBooksBaseUrl()
    const companyResponse = await fetch(
      `${baseUrl}/v3/company/${realm_id}/query?query=SELECT * FROM CompanyInfo MAXRESULTS 1`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!companyResponse.ok) {
      const errorText = await companyResponse.text()
      console.error('QuickBooks API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch company information', details: errorText },
        { status: companyResponse.status }
      )
    }

    const companyData = await companyResponse.json()
    const companyInfo = companyData.QueryResponse?.CompanyInfo?.[0]

    if (!companyInfo) {
      return NextResponse.json({ error: 'Company information not found' }, { status: 404 })
    }

    // Return formatted company information
    return NextResponse.json({
      companyName: companyInfo.CompanyName,
      legalName: companyInfo.LegalName,
      companyAddress: companyInfo.CompanyAddr,
      fiscalYearStartMonth: companyInfo.FiscalYearStartMonth,
      country: companyInfo.Country,
      email: companyInfo.Email?.Address,
      phone: companyInfo.Phone,
      webSite: companyInfo.WebSite,
      taxId: companyInfo.CompanyLegalAddr?.CountrySubDivisionCode,
      companyStartDate: companyInfo.CompanyStartDate,
    })
  } catch (error) {
    console.error('Error fetching QuickBooks company info:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
