// API Route to get ALL conversations (for Lowe's team dashboard)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header (even if not strict, we log it)
    const authHeader = request.headers.get('authorization')
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : 'lowes-team'

    // Fetch all conversations ordered by last message time
    const { data: conversations, error } = await supabase
      .from('lowes_chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    console.log(`[Lowes Dashboard] Fetched ${conversations?.length || 0} conversations for ${userEmail}`)
    return NextResponse.json({ conversations: conversations || [] })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-chat/conversations/all:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
