// API Route to get ALL conversations (for Lowe's team dashboard)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header (even if not strict, we log it)
    const authHeader = request.headers.get('authorization')
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : 'lowes-team'

    // Get user's district and store number from headers
    const userDistrict = request.headers.get('x-user-district') || ''
    const userStoreNumber = request.headers.get('x-user-store-number') || ''

    // Build query - filter by matching district AND store_number
    let query = supabase
      .from('lowes_chat_conversations')
      .select('*')

    // Only filter if both district and storeNumber are provided
    if (userDistrict && userStoreNumber) {
      query = query
        .eq('district', userDistrict.trim())
        .eq('store_number', userStoreNumber.trim())
    }

    // Order by last message time
    const { data: conversations, error } = await query
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    console.log(`[Lowes Dashboard] Fetched ${conversations?.length || 0} conversations for ${userEmail} (District: ${userDistrict}, Store: ${userStoreNumber})`)
    return NextResponse.json({ conversations: conversations || [] })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-chat/conversations/all:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
