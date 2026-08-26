import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSharedAdminUserId } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sharedAdminUserId = await getSharedAdminUserId()
    const { data, error } = await supabase
      .from('scheduled_job_metadata')
      .select('scheduled_job_file_name')
      .eq('user_id', sharedAdminUserId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      scheduledJobFileName: data?.scheduled_job_file_name || null,
    })
  } catch (error: any) {
    console.error('Scheduled job file names GET error:', error)
    return NextResponse.json({ scheduledJobFileName: null, error: error?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const sharedAdminUserId = await getSharedAdminUserId()
    const now = new Date().toISOString()

    const { error } = await supabase.from('scheduled_job_metadata').upsert(
      {
        user_id: sharedAdminUserId,
        scheduled_job_file_name: body.scheduledJobFileName || null,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Scheduled job file names POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
