import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PATCH - Update member name in group
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { groupId, memberEmail, memberName } = body

    if (!groupId || !memberEmail) {
      return NextResponse.json(
        { error: 'Group ID and member email are required' },
        { status: 400 }
      )
    }

    // Update member name in group
    const { error: updateError } = await supabase
      .from('lowes_group_members')
      .update({ member_name: memberName?.trim() || null })
      .eq('group_id', groupId)
      .eq('member_email', memberEmail.toLowerCase())

    if (updateError) {
      console.error('Error updating member name:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member name', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in PATCH /api/lowes-groups/members/update-name:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
