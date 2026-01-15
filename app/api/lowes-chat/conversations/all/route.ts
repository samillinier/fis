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
      
      // If error is about missing columns, try fallback filtering using district_store field
      if (error.message?.includes('column') && (error.message?.includes('does not exist') || error.message?.includes('district') || error.message?.includes('store_number'))) {
        console.log('New columns not found, using district_store field for filtering')
        
        // Fallback: filter by district_store field using pattern matching
        const districtStorePattern = `${userDistrict.trim()} / Store ${userStoreNumber.trim()}`
        const { data: fallbackConversations, error: fallbackError } = await supabase
          .from('lowes_chat_conversations')
          .select('*')
          .ilike('district_store', `%${districtStorePattern}%`)
          .order('last_message_at', { ascending: false })
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          // Last resort: return all conversations
          const { data: allConversations, error: allError } = await supabase
            .from('lowes_chat_conversations')
            .select('*')
            .order('last_message_at', { ascending: false })
          
          if (allError) {
            return NextResponse.json(
              { error: 'Failed to fetch conversations', details: allError.message },
              { status: 500 }
            )
          }
          
          return NextResponse.json({ conversations: allConversations || [] })
        }
        
        return NextResponse.json({ conversations: fallbackConversations || [] })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
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
