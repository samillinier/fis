// API Route - Jobs Data — Supabase shared model
import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSharedAdminUserId } from '@/lib/supabase'

export const maxDuration = 60

async function requireAdminOrOwner(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { ok: false as const, status: 401, error: 'Unauthorized' }
  }

  const userEmail = authHeader.replace('Bearer ', '').toLowerCase()
  const { data: actorData } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail)
    .maybeSingle()

  const role = actorData?.role
  const isActive = actorData?.is_active !== false
  const allowed = isActive && (role === 'admin' || role === 'owner')
  if (!allowed) {
    return { ok: false as const, status: 403, error: 'Unauthorized' }
  }

  return { ok: true as const }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sharedAdminUserId = await getSharedAdminUserId()

    const { data, error } = await supabase
      .from('jobs_data')
      .select('*')
      .eq('user_id', sharedAdminUserId)
      .order('id', { ascending: false })
      .limit(1)

    if (error) throw error

    const row = data?.[0]
    const records = row?.data_jsonb
      ? (Array.isArray(row.data_jsonb) ? row.data_jsonb : [])
      : []

    return NextResponse.json({
      records,
      fileName: row?.file_name || null,
      uploadedAt: row?.upload_date || null,
    })
  } catch (error: any) {
    console.error('Jobs API GET error:', error)
    return NextResponse.json(
      { records: [], fileName: null, uploadedAt: null, error: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrOwner(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const records = Array.isArray(body?.records) ? body.records : []
    const fileName = typeof body?.fileName === 'string' ? body.fileName : null
    const sharedAdminUserId = await getSharedAdminUserId()
    const now = new Date().toISOString()

    await supabase.from('jobs_data').delete().eq('user_id', sharedAdminUserId)

    const { error } = await supabase.from('jobs_data').insert({
      user_id: sharedAdminUserId,
      data_jsonb: records,
      file_name: fileName,
      upload_date: now,
      updated_at: now,
    })

    if (error) throw error

    return NextResponse.json({ success: true, count: records.length })
  } catch (error: any) {
    console.error('Jobs API POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminOrOwner(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const sharedAdminUserId = await getSharedAdminUserId()
    await supabase.from('jobs_data').delete().eq('user_id', sharedAdminUserId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Jobs API DELETE error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
