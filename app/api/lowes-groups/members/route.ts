import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Add a member to a group
export async function POST(request: NextRequest) {
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

    // Add member to group
    const { data: newMember, error: addError } = await supabase
      .from('lowes_group_members')
      .insert({
        group_id: groupId,
        member_email: memberEmail.trim().toLowerCase(),
        member_name: memberName?.trim() || null,
        added_by: userEmail
      })
      .select()
      .single()

    if (addError) {
      if (addError.code === '23505') { // Unique violation - already a member
        return NextResponse.json(
          { error: 'This member is already in the group' },
          { status: 400 }
        )
      }
      console.error('Error adding member to group:', addError)
      return NextResponse.json(
        { error: 'Failed to add member to group', details: addError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        groupId: newMember.group_id,
        memberEmail: newMember.member_email,
        memberName: newMember.member_name,
        addedAt: newMember.added_at
      }
    })
  } catch (error: any) {
    console.error('Error in POST /api/lowes-groups/members:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a member from a group
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const memberEmail = searchParams.get('memberEmail')

    if (!groupId || !memberEmail) {
      return NextResponse.json(
        { error: 'Group ID and member email are required' },
        { status: 400 }
      )
    }

    // Remove member from group
    const { error: deleteError } = await supabase
      .from('lowes_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('member_email', memberEmail.toLowerCase())

    if (deleteError) {
      console.error('Error removing member from group:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member from group', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/lowes-groups/members:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
