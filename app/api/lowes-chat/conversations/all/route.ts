// API Route to get ALL conversations (for Lowe's team dashboard)
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'
import { workroomStoreData } from '@/data/workroomStoreData'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function jsonNoStore(body: any, init?: Parameters<typeof NextResponse.json>[1]) {
  const res = NextResponse.json(body, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase()
}

function parseStoreNumberFromConversation(conv: any): number | null {
  // Preferred: new schema
  const direct = conv?.store_number ?? conv?.storeNumber ?? conv?.store
  if (direct != null && String(direct).trim() !== '') {
    const n = Number(String(direct).replace(/[^\d]/g, ''))
    return Number.isFinite(n) && n > 0 ? n : null
  }

  // Fallback: legacy district_store text, e.g. "District X / Store 2221"
  const ds = String(conv?.district_store || '')
  const m = ds.match(/store\s*#?\s*(\d+)/i)
  if (m?.[1]) {
    const n = Number(m[1])
    return Number.isFinite(n) && n > 0 ? n : null
  }

  return null
}

function getWorkroomForStore(storeNumber: number): string | null {
  const mapped = workroomStoreData.find((r) => r.store === storeNumber)
  return mapped?.workroom || null
}

// Helper function to add group names to conversations
async function addGroupNamesToConversations(conversations: any[]) {
  return Promise.all(
    conversations.map(async (conv: any) => {
      // Fetch group name for the conversation creator (lowes_email)
      const { data: groupMember } = await supabase
        .from('lowes_group_members')
        .select('group_id')
        .eq('member_email', conv.lowes_email?.toLowerCase() || '')
        .maybeSingle()

      let groupName = null
      if (groupMember?.group_id) {
        const { data: group } = await supabase
          .from('lowes_groups')
          .select('name')
          .eq('id', groupMember.group_id)
          .maybeSingle()
        
        if (group) {
          groupName = group.name
        }
      }

      return {
        ...conv,
        group_name: groupName
      }
    })
  )
}

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header (even if not strict, we log it)
    const authHeader = request.headers.get('authorization')
    const userEmailRaw = authHeader ? authHeader.replace('Bearer ', '') : 'lowes-team'
    const userEmail = normalizeEmail(userEmailRaw)

    // Get user's district and store number from headers
    const userDistrict = request.headers.get('x-user-district') || ''
    const userStoreNumber = request.headers.get('x-user-store-number') || ''

    // Determine if this is a FIS POD authenticated user (authorized_users table)
    let isFisUser = false
    let isFisAdmin = false
    try {
      const { data: actor } = await supabase
        .from('authorized_users')
        .select('role, is_active')
        .eq('email', userEmail)
        .maybeSingle()
      if (actor && actor.is_active !== false) {
        isFisUser = true
        isFisAdmin = actor.role === 'admin'
      }
    } catch {
      // ignore (table might not exist in some environments)
    }

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
    const { data: conversationsRaw, error } = await query
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
            return jsonNoStore(
              { error: 'Failed to fetch conversations', details: allError.message },
              { status: 500 }
            )
          }
          
          // Apply workroom filter for FIS POD users if needed (best-effort)
          let finalAll = allConversations || []
          if (isFisUser && !isFisAdmin) {
            const userId = await ensureUserExists(userEmailRaw)
            const { data: meta } = await supabase
              .from('user_metadata')
              .select('workroom')
              .eq('user_id', userId)
              .maybeSingle()
            const userWorkroom = (meta?.workroom || '').trim()
            if (userWorkroom) {
              finalAll = finalAll.filter((c: any) => {
                const storeNum = parseStoreNumberFromConversation(c)
                if (!storeNum) return false
                return getWorkroomForStore(storeNum) === userWorkroom
              })
            } else {
              finalAll = []
            }
          }

          const allConversationsWithGroups = await addGroupNamesToConversations(finalAll || [])
          return jsonNoStore({ conversations: allConversationsWithGroups || [], workroomFiltered: isFisUser && !isFisAdmin })
        }
        
        const fallbackConversationsWithGroups = await addGroupNamesToConversations(fallbackConversations || [])
        return jsonNoStore({ conversations: fallbackConversationsWithGroups || [] })
      }
      
      return jsonNoStore(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      )
    }

    // Apply workroom filtering for FIS POD users:
    // - Admins can see all conversations
    // - Non-admin staff only see conversations mapped to their workroom (by store number -> workroom map)
    // - If staff has no workroom set, return empty with a hint so they set it in their profile
    let conversations = conversationsRaw || []
    let workroomFiltered = false
    let requiredWorkroom: string | null = null

    if (isFisUser && !isFisAdmin) {
      workroomFiltered = true
      const userId = await ensureUserExists(userEmailRaw)
      const { data: meta } = await supabase
        .from('user_metadata')
        .select('workroom')
        .eq('user_id', userId)
        .maybeSingle()
      const userWorkroom = (meta?.workroom || '').trim()
      requiredWorkroom = userWorkroom || null

      if (!userWorkroom) {
        // Force staff to set a workroom; otherwise they would see everything.
        conversations = []
      } else {
        conversations = conversations.filter((c: any) => {
          const storeNum = parseStoreNumberFromConversation(c)
          if (!storeNum) return false
          return getWorkroomForStore(storeNum) === userWorkroom
        })
      }
    }

    // Fetch group names for each conversation creator (after filtering)
    const conversationsWithGroups = await addGroupNamesToConversations(conversations || [])

    console.log(
      `[Lowes Dashboard] Fetched ${conversationsWithGroups?.length || 0} conversations for ${userEmailRaw} (District: ${userDistrict}, Store: ${userStoreNumber}, workroomFiltered: ${workroomFiltered ? 'yes' : 'no'}${requiredWorkroom ? `, workroom: ${requiredWorkroom}` : ''})`
    )
    return jsonNoStore({
      conversations: conversationsWithGroups || [],
      workroomFiltered,
      workroom: requiredWorkroom,
    })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-chat/conversations/all:', error)
    return jsonNoStore(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
