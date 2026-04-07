import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Get group name for a specific user email or group ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const groupId = searchParams.get('groupId')

    // If groupId is provided, fetch directly by ID
    if (groupId) {
      const { data: group, error: groupError } = await supabase
        .from('lowes_groups')
        .select('name')
        .eq('id', groupId)
        .single()

      if (groupError) {
        // If table doesn't exist, return null
        if (groupError.code === '42P01' || groupError.code === 'PGRST116') {
          return NextResponse.json({ groupName: null })
        }
        console.error('Error fetching group by ID:', groupError)
        return NextResponse.json({ groupName: null })
      }

      return NextResponse.json({ groupName: group?.name || null })
    }

    // Otherwise, use email to find the group
    if (!email) {
      return NextResponse.json(
        { error: 'Email or groupId parameter is required' },
        { status: 400 }
      )
    }

    // Find which group(s) this user belongs to
    const { data: groupMembers, error: membersError } = await supabase
      .from('lowes_group_members')
      .select('group_id')
      .eq('member_email', email.toLowerCase())
      .limit(1)

    if (membersError) {
      console.error('Error fetching user group membership:', membersError)
      // If table doesn't exist, return null
      if (membersError.code === '42P01' || membersError.code === 'PGRST116') {
        return NextResponse.json({ groupName: null })
      }
      return NextResponse.json(
        { error: 'Failed to fetch user group', details: membersError.message },
        { status: 500 }
      )
    }

    if (!groupMembers || groupMembers.length === 0) {
      return NextResponse.json({ groupName: null })
    }

    // Fetch the group name
    const { data: group, error: groupError } = await supabase
      .from('lowes_groups')
      .select('name')
      .eq('id', groupMembers[0].group_id)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ groupName: null })
    }

    return NextResponse.json({ groupName: group.name })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-groups/user-group:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error', groupName: null },
      { status: 500 }
    )
  }
}
