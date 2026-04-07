// API Route - Yearly file names storage (Supabase)
// SHARED DATA MODEL - File names are shared, partitioned by year.
import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSharedAdminUserId } from '@/lib/supabase'

function parseYear(request: NextRequest): number | null {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('year')
  if (!raw) return null
  const year = Number(raw)
  if (!Number.isFinite(year) || year < 2000 || year > 3000) return null
  return year
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const year = parseYear(request)
    if (!year) return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) return NextResponse.json({ error: 'Invalid user' }, { status: 401 })

    const sharedAdminUserId = await getSharedAdminUserId()

    const { data, error } = await supabase
      .from('yearly_user_metadata')
      .select('visual_file_name, survey_file_name')
      .eq('user_id', sharedAdminUserId)
      .eq('year', year)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      visualFileName: data?.visual_file_name || null,
      surveyFileName: data?.survey_file_name || null,
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Internal server error',
        visualFileName: null,
        surveyFileName: null,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const year = parseYear(request)
    if (!year) return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) return NextResponse.json({ error: 'Invalid user' }, { status: 401 })

    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()
    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can save yearly file names' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { visualFileName, surveyFileName } = body

    const sharedAdminUserId = await getSharedAdminUserId()

    const { error } = await supabase
      .from('yearly_user_metadata')
      .upsert(
        {
          user_id: sharedAdminUserId,
          year,
          visual_file_name: visualFileName || null,
          survey_file_name: surveyFileName || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,year' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const year = parseYear(request)
    if (!year) return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) return NextResponse.json({ error: 'Invalid user' }, { status: 401 })

    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()
    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can delete yearly file names' },
        { status: 403 }
      )
    }

    const sharedAdminUserId = await getSharedAdminUserId()

    const { error } = await supabase
      .from('yearly_user_metadata')
      .upsert(
        {
          user_id: sharedAdminUserId,
          year,
          visual_file_name: null,
          survey_file_name: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,year' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

