import { NextRequest, NextResponse } from 'next/server'
import { getSharedAdminUserId, supabase } from '@/lib/supabase'

const MAX_SNAPSHOT_CHARS = 2_000_000

function getAdminActor(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const userEmail = authHeader.replace('Bearer ', '').trim().toLowerCase()
  if (!userEmail) return { error: NextResponse.json({ error: 'Invalid user' }, { status: 401 }) }

  return { userEmail }
}

async function assertAdmin(userEmail: string): Promise<boolean> {
  const { data: actorData } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail)
    .maybeSingle()

  return actorData?.role === 'admin' && actorData?.is_active !== false
}

async function getActorRole(userEmail: string): Promise<'admin' | 'owner' | 'accounting' | 'user' | null> {
  const { data: actorData } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail)
    .maybeSingle()

  if (!actorData || actorData.is_active === false) return null
  if (actorData.role === 'admin' || actorData.role === 'owner' || actorData.role === 'accounting') return actorData.role
  return 'user'
}

function tableMissingResponse() {
  return NextResponse.json(
    {
      error: 'Table not found. Run database/bonus-cloud.sql in Supabase.',
      snapshot: null,
    },
    { status: 500 }
  )
}

function isTableMissing(error: { code?: string; message?: string | null }) {
  return (
    error.code === 'PGRST205' ||
    error.message?.includes('Could not find the table') ||
    error.message?.includes('does not exist')
  )
}

export async function GET(request: NextRequest) {
  try {
    const actor = getAdminActor(request)
    if ('error' in actor) return actor.error

    const role = await getActorRole(actor.userEmail)
    if (role !== 'admin' && role !== 'owner' && role !== 'accounting') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userId = await getSharedAdminUserId()
    const { data, error } = await supabase
      .from('bonus_page_snapshot')
      .select('rows_json, tiers_json, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (isTableMissing(error)) {
        return tableMissingResponse()
      }
      console.error('GET bonus-cloud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ snapshot: null })
    }

    return NextResponse.json({
      snapshot: {
        rows: Array.isArray(data.rows_json) ? data.rows_json : [],
        tiers: Array.isArray(data.tiers_json) ? data.tiers_json : [],
        updatedAt: data.updated_at,
      },
    })
  } catch (error: any) {
    console.error('GET /api/bonus-cloud:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = getAdminActor(request)
    if ('error' in actor) return actor.error

    const role = await getActorRole(actor.userEmail)
    if (role !== 'admin' && role !== 'accounting') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const rows = Array.isArray(body?.rows) ? body.rows : null
    const tiers = Array.isArray(body?.tiers) ? body.tiers : null

    if (!rows || !tiers) {
      return NextResponse.json({ error: 'rows and tiers are required' }, { status: 400 })
    }

    const snapshotSize = JSON.stringify({ rows, tiers }).length
    if (snapshotSize > MAX_SNAPSHOT_CHARS) {
      return NextResponse.json(
        { error: `Bonus snapshot is too large (max ${MAX_SNAPSHOT_CHARS} characters)` },
        { status: 400 }
      )
    }

    const userId = await getSharedAdminUserId()
    const updatedAt = new Date().toISOString()

    const { error } = await supabase.from('bonus_page_snapshot').upsert(
      {
        user_id: userId,
        rows_json: rows,
        tiers_json: tiers,
        updated_at: updatedAt,
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      if (isTableMissing(error)) {
        return tableMissingResponse()
      }
      console.error('POST bonus-cloud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updatedAt })
  } catch (error: any) {
    console.error('POST /api/bonus-cloud:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = getAdminActor(request)
    if ('error' in actor) return actor.error

    if (!(await assertAdmin(actor.userEmail))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userId = await getSharedAdminUserId()
    const { error } = await supabase.from('bonus_page_snapshot').delete().eq('user_id', userId)

    if (error) {
      if (isTableMissing(error)) {
        return tableMissingResponse()
      }
      console.error('DELETE bonus-cloud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/bonus-cloud:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
