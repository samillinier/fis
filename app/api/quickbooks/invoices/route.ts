import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// Helper function to get QuickBooks API base URL
function getQuickBooksBaseUrl() {
  const isProduction = process.env.QUICKBOOKS_ENVIRONMENT === 'production'
  return isProduction 
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com'
}

// Helper function to get valid access token (same as company route)
async function getValidAccessToken(userId: string) {
  const { data: connection, error } = await supabase
    .from('quickbooks_connections')
    .select('access_token, refresh_token, expires_at, realm_id')
    .eq('user_id', userId)
    .single()

  if (error || !connection) {
    throw new Error('No QuickBooks connection found')
  }

  const now = new Date()
  const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null
  
  if (expiresAt && expiresAt < now) {
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

    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams
    const maxResults = parseInt(searchParams.get('maxResults') || '20')
    const startPosition = parseInt(searchParams.get('startPosition') || '1')

    // Get valid access token
    const { access_token, realm_id } = await getValidAccessToken(userId)

    // Fetch invoices from QuickBooks
    const baseUrl = getQuickBooksBaseUrl()
    const query = `SELECT * FROM Invoice ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`
    
    const invoicesResponse = await fetch(
      `${baseUrl}/v3/company/${realm_id}/query?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!invoicesResponse.ok) {
      const errorText = await invoicesResponse.text()
      console.error('QuickBooks API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch invoices', details: errorText },
        { status: invoicesResponse.status }
      )
    }

    const invoicesData = await invoicesResponse.json()
    const invoices = invoicesData.QueryResponse?.Invoice || []

    // Format invoices for display
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.Id,
      docNumber: invoice.DocNumber,
      txnDate: invoice.TxnDate,
      dueDate: invoice.DueDate,
      customerRef: invoice.CustomerRef?.name || 'Unknown Customer',
      totalAmt: invoice.TotalAmt,
      balance: invoice.Balance,
      status: invoice.Balance > 0 ? 'Unpaid' : 'Paid',
      currencyRef: invoice.CurrencyRef?.value || 'USD',
    }))

    return NextResponse.json({
      invoices: formattedInvoices,
      maxResults: invoicesData.QueryResponse?.maxResults || maxResults,
      startPosition: invoicesData.QueryResponse?.startPosition || startPosition,
      totalCount: invoices.length,
    })
  } catch (error) {
    console.error('Error fetching QuickBooks invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
