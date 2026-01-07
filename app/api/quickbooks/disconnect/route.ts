import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    // Delete QuickBooks connection
    const { error } = await supabase
      .from('quickbooks_connections')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error disconnecting QuickBooks:', error)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/quickbooks/disconnect:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

