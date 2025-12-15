// API Route - File Names Storage
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// GET - Fetch file names for a user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    // Fetch file names from user_metadata table
    const { data, error } = await supabase
      .from('user_metadata')
      .select('visual_file_name, survey_file_name')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return NextResponse.json({
      visualFileName: data?.visual_file_name || null,
      surveyFileName: data?.survey_file_name || null,
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error',
      visualFileName: null,
      surveyFileName: null,
    }, { status: 500 })
  }
}

// POST - Save file names for a user
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const body = await request.json()
    const { visualFileName, surveyFileName } = body

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    // Upsert file names (insert or update)
    const { error } = await supabase
      .from('user_metadata')
      .upsert({
        user_id: userId,
        visual_file_name: visualFileName || null,
        survey_file_name: surveyFileName || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE - Clear file names for a user
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    // Clear file names
    const { error } = await supabase
      .from('user_metadata')
      .update({
        visual_file_name: null,
        survey_file_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error'
    }, { status: 500 })
  }
}



