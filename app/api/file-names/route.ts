// API Route - File Names Storage
// SHARED DATA MODEL - All users see shared file names
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// Helper to get shared admin user_id (all admins upload to this shared location)
async function getSharedAdminUserId(): Promise<string> {
  // Use a consistent admin email for the shared data location
  const sharedAdminEmail = 'sbiru@fiscorponline.com'
  return await ensureUserExists(sharedAdminEmail)
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

    // Get shared admin's user_id - all users see shared file names
    const sharedAdminUserId = await getSharedAdminUserId()

    // Fetch file names from admin's user_metadata (shared)
    const { data, error } = await supabase
      .from('user_metadata')
      .select('visual_file_name, survey_file_name')
      .eq('user_id', sharedAdminUserId)
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

// POST - Save file names (ANY ADMIN CAN UPLOAD)
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

    // Check if user is admin (any admin can save file names)
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Only admin users can save file names' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { visualFileName, surveyFileName } = body

    // Use shared admin's user_id (shared data model - all admins upload to same location)
    const sharedAdminUserId = await getSharedAdminUserId()

    // Upsert file names under admin's account (shared)
    const { error } = await supabase
      .from('user_metadata')
      .upsert({
        user_id: sharedAdminUserId,
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

// DELETE - Clear file names (ANY ADMIN CAN DELETE)
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

    // Check if user is admin (any admin can delete file names)
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized: Only admin users can delete file names' 
      }, { status: 403 })
    }

    // Use shared admin's user_id (shared data model)
    const sharedAdminUserId = await getSharedAdminUserId()

    // Clear file names from shared location
    const { error } = await supabase
      .from('user_metadata')
      .update({
        visual_file_name: null,
        survey_file_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', sharedAdminUserId)

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





