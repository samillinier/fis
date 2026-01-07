import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

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

    // Check for QuickBooks connection in database
    // We'll store tokens in a quickbooks_connections table
    console.log('🔍 [Status API] Checking connection for user_id:', userId)
    
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected when not connected
        console.log('ℹ️ [Status API] No connection found for user_id:', userId)
        return NextResponse.json({ connected: false })
      }
      console.error('❌ [Status API] Error fetching QuickBooks connection:', error)
      console.error('❌ [Status API] Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to fetch connection status', details: error.message }, { status: 500 })
    }

    if (!data) {
      console.log('ℹ️ [Status API] No connection data found')
      return NextResponse.json({ connected: false })
    }

    console.log('✅ [Status API] Found connection:', {
      companyName: data.company_name,
      realmId: data.realm_id,
      expiresAt: data.expires_at
    })

    // Check if token is still valid (not expired)
    const now = new Date()
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null
    
    if (expiresAt && expiresAt < now) {
      // Token expired, return not connected
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      companyName: data.company_name || null,
      connectedAt: data.created_at || null,
      realmId: data.realm_id || null,
    })
  } catch (error) {
    console.error('Error in GET /api/quickbooks/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

