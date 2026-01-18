import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Get all groups and their members
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

    // Fetch all groups
    const { data: groups, error: groupsError } = await supabase
      .from('lowes_groups')
      .select('*')
      .order('name', { ascending: true })

    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      return NextResponse.json(
        { error: 'Failed to fetch groups', details: groupsError.message },
        { status: 500 }
      )
    }

    // Fetch all group members
    const { data: members, error: membersError } = await supabase
      .from('lowes_group_members')
      .select('*')
      .order('added_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching group members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch group members', details: membersError.message },
        { status: 500 }
      )
    }

    // Group members by group_id
    const membersByGroup: Record<string, any[]> = {}
    members?.forEach((member) => {
      if (!membersByGroup[member.group_id]) {
        membersByGroup[member.group_id] = []
      }
      membersByGroup[member.group_id].push(member)
    })

    // Attach members to each group
    const groupsWithMembers = (groups || []).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.created_at,
      members: membersByGroup[group.id] || [],
    }))

    return NextResponse.json({
      groups: groupsWithMembers,
      count: groupsWithMembers.length
    })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-groups:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new group
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
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Create group
    const { data: newGroup, error: createError } = await supabase
      .from('lowes_groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (createError) {
      // Check if table doesn't exist
      if (createError.code === '42P01' || createError.code === 'PGRST116' || createError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the migration: database/lowes-groups-schema.sql in Supabase SQL Editor.',
            details: 'The lowes_groups table does not exist. Run the migration to create it.'
          },
          { status: 500 }
        )
      }
      
      if (createError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A group with this name already exists' },
          { status: 400 }
        )
      }
      
      console.error('Error creating group:', createError)
      return NextResponse.json(
        { 
          error: 'Failed to create group', 
          details: createError.message || String(createError),
          code: createError.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      group: {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        createdAt: newGroup.created_at,
        members: []
      }
    })
  } catch (error: any) {
    console.error('Error in POST /api/lowes-groups:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update group name and description
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
    const { groupId, name, description } = body

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Update group
    const { data: updatedGroup, error: updateError } = await supabase
      .from('lowes_groups')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A group with this name already exists' },
          { status: 400 }
        )
      }
      console.error('Error updating group:', updateError)
      return NextResponse.json(
        { error: 'Failed to update group', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        createdAt: updatedGroup.created_at,
        updatedAt: updatedGroup.updated_at
      }
    })
  } catch (error: any) {
    console.error('Error in PATCH /api/lowes-groups:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a group
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

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Delete group (cascade will delete members)
    const { error: deleteError } = await supabase
      .from('lowes_groups')
      .delete()
      .eq('id', groupId)

    if (deleteError) {
      console.error('Error deleting group:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete group', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/lowes-groups:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
