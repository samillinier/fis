// API Route - File Names Storage
// SHARED DATA MODEL - All users see admin's file names
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// SUPER ADMIN - File names are stored under admin's account (shared)
const SUPER_ADMIN_EMAIL = 'sbiru@fiscorponline.com'

// Helper to get admin user_id
async function getAdminUserId(): Promise<string> {
  return await ensureUserExists(SUPER_ADMIN_EMAIL)
}

// GET - Fetch file names (shared - from admin's account)
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

    // Get admin's user_id - all users see admin's file names
    const adminUserId = await getAdminUserId()

    // Fetch file names from admin's user_metadata (shared)
    const { data, error } = await supabase
      .from('user_metadata')
      .select('visual_file_name, survey_file_name')
      .eq('user_id', adminUserId)
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

// POST - Save file names (ADMIN ONLY)
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

    // Only admin can save file names
    const isAdmin = userEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Only admin can save file names' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { visualFileName, surveyFileName } = body

    // Use admin's user_id (shared data model)
    const adminUserId = await getAdminUserId()

    // Upsert file names under admin's account (shared)
    const { error } = await supabase
      .from('user_metadata')
      .upsert({
        user_id: adminUserId,
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

// DELETE - Clear file names (ADMIN ONLY)
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

    // Only admin can delete file names
    const isAdmin = userEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Only admin can delete file names' 
      }, { status: 403 })
    }

    // Use admin's user_id (shared data model)
    const adminUserId = await getAdminUserId()

    // Clear file names from admin's account
    const { error } = await supabase
      .from('user_metadata')
      .update({
        visual_file_name: null,
        survey_file_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', adminUserId)

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





