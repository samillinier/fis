import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Get all groups (public endpoint for signup page)
export async function GET(request: NextRequest) {
  try {
    // Fetch all groups (public access - no auth required for signup)
    const { data: groups, error: groupsError } = await supabase
      .from('lowes_groups')
      .select('id, name, description')
      .order('name', { ascending: true })

    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      // If table doesn't exist, return empty array
      if (groupsError.code === '42P01' || groupsError.code === 'PGRST116') {
        return NextResponse.json({ groups: [] })
      }
      return NextResponse.json(
        { error: 'Failed to fetch groups', details: groupsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      groups: groups || [],
      count: groups?.length || 0
    })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-groups/public:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error', groups: [] },
      { status: 500 }
    )
  }
}
