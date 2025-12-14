import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// GET - Fetch user profile (workroom and role)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Ensure user exists in database
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user metadata
    const { data, error } = await supabase
      .from('user_metadata')
      .select('workroom, user_role')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({
      workroom: data?.workroom || null,
      role: data?.user_role || null,
    })
  } catch (error) {
    console.error('Error in GET /api/user-profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save user profile (workroom and role)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const body = await request.json()
    const { workroom, role } = body

    // Validate role
    if (role && !['GM', 'PC', 'Other'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Ensure user exists in database
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user_metadata table exists by trying to query it
    const { error: tableCheckError } = await supabase
      .from('user_metadata')
      .select('id')
      .limit(1)
    
    if (tableCheckError) {
      console.error('user_metadata table check error:', tableCheckError)
      if (tableCheckError.message?.includes('does not exist') || tableCheckError.message?.includes('schema cache')) {
        return NextResponse.json({ 
          error: 'Database table not found. Please run the migration: database/setup-user-profile-complete.sql in Supabase SQL Editor.',
          details: 'The user_metadata table does not exist. Run the complete migration to create it.'
        }, { status: 500 })
      }
    }

    // Try to upsert user metadata
    // First check if record exists
    const { data: existingData } = await supabase
      .from('user_metadata')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let error
    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_metadata')
        .update({
          workroom: workroom || null,
          user_role: role || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
      error = updateError
    } else {
      // Insert new record - try with all fields first
      const insertData: any = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      }
      
      // Only include workroom and user_role if columns exist
      // We'll try to insert them, and if they fail, we know the migration hasn't been run
      if (workroom) insertData.workroom = workroom
      if (role) insertData.user_role = role
      
      const { error: insertError } = await supabase
        .from('user_metadata')
        .insert(insertData)
      error = insertError
    }

    if (error) {
      console.error('Error saving user profile:', error)
      // Check if it's a column error (migration not run)
      const errorMessage = error.message || String(error)
      if (errorMessage.includes('column') && (errorMessage.includes('workroom') || errorMessage.includes('user_role'))) {
        return NextResponse.json({ 
          error: 'Database schema error. Please run the migration: database/add-user-profile.sql in Supabase SQL Editor.',
          details: 'The workroom and user_role columns are missing from user_metadata table.'
        }, { status: 500 })
      }
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        return NextResponse.json({ 
          error: 'Database table not found. Please ensure user_metadata table exists.',
          details: errorMessage
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: 'Failed to save profile to database',
        details: errorMessage
      }, { status: 500 })
    }

    // Also save to localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('fis-user-profile', JSON.stringify({ workroom, role }))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/user-profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
