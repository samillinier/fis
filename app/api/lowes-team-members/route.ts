import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Get all Lowe's team members (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')

    // Check if user is admin
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    if (!actorData || actorData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch Lowe's team members from lowes_chat_conversations table
    // Get unique users based on their email and get their latest activity
    // Try with new columns first, fallback to district_store if they don't exist
    let conversations: any[] = []
    let fetchError: any = null

    // First try with separate district and store_number columns
    const { data: dataWithNewCols, error: errorWithNewCols } = await supabase
      .from('lowes_chat_conversations')
      .select('lowes_email, user_name, user_role, district_store, district, store_number, created_at, created_by')
      .order('created_at', { ascending: false })

    if (!errorWithNewCols && dataWithNewCols) {
      conversations = dataWithNewCols
    } else if (errorWithNewCols?.code === '42703' || errorWithNewCols?.message?.includes('column')) {
      // New columns don't exist, try with just district_store
      const { data: dataWithOldCols, error: errorWithOldCols } = await supabase
        .from('lowes_chat_conversations')
        .select('lowes_email, user_name, user_role, district_store, created_at, created_by')
        .order('created_at', { ascending: false })
      
      if (!errorWithOldCols && dataWithOldCols) {
        conversations = dataWithOldCols
      } else {
        fetchError = errorWithOldCols
      }
    } else {
      fetchError = errorWithNewCols
    }

    if (fetchError) {
      console.error('Error fetching Lowe\'s team members from conversations:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch Lowe\'s team members', details: fetchError.message },
        { status: 500 }
      )
    }

    // Group conversations by lowes_email to get unique users
    const userMap = new Map<string, any>()
    
    conversations?.forEach((conv: any) => {
      const email = conv.lowes_email?.toLowerCase()
      if (!email) return

      // Extract district and store number - handle both new and old column formats
      let district = ''
      let storeNumber = ''
      
      if (conv.district && conv.store_number) {
        // New format: separate columns
        district = conv.district
        storeNumber = conv.store_number
      } else if (conv.district_store) {
        // Old format: combined in district_store
        const parts = conv.district_store.split(' / Store ')
        district = parts[0] || ''
        storeNumber = parts[1] || ''
      }

      // If user doesn't exist in map, or this conversation is newer, update the user info
      if (!userMap.has(email) || 
          (userMap.get(email).lastActivity && 
           new Date(conv.created_at) > new Date(userMap.get(email).lastActivity))) {
        userMap.set(email, {
          email: conv.lowes_email,
          name: conv.user_name,
          role: conv.user_role,
          district: district,
          storeNumber: storeNumber,
          createdAt: conv.created_at,
          lastActivity: conv.created_at,
          conversationCount: 1
        })
      } else {
        // Increment conversation count
        const existing = userMap.get(email)
        existing.conversationCount = (existing.conversationCount || 1) + 1
      }
    })

    // Convert map to array and format
    const formattedMembers = Array.from(userMap.values()).map((member: any) => ({
      email: member.email,
      name: member.name,
      role: member.role,
      district: member.district,
      storeNumber: member.storeNumber,
      createdAt: member.createdAt,
      lastActivity: member.lastActivity,
      conversationCount: member.conversationCount,
      isActive: true // All users who created conversations are considered active
    }))

    // Sort by last activity (most recent first)
    formattedMembers.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    )

    return NextResponse.json({
      members: formattedMembers,
      count: formattedMembers.length
    })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-team-members:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
