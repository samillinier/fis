import { NextRequest, NextResponse } from 'next/server'
import { getSharedAdminUserId, supabase } from '@/lib/supabase'

function getActor(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const userEmail = authHeader.replace('Bearer ', '').trim().toLowerCase()
  if (!userEmail) return { error: NextResponse.json({ error: 'Invalid user' }, { status: 401 }) }

  return { userEmail }
}

async function getActorRole(userEmail: string): Promise<'admin' | 'owner' | 'accounting' | 'user' | null> {
  const { data } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail)
    .maybeSingle()

  if (!data || data.is_active === false) return null
  if (data.role === 'admin' || data.role === 'owner' || data.role === 'accounting') return data.role
  return 'user'
}

function isTableMissing(error: { code?: string; message?: string | null }) {
  return (
    error.code === 'PGRST205' ||
    error.message?.includes('Could not find the table') ||
    error.message?.includes('does not exist')
  )
}

function tableMissingResponse() {
  return NextResponse.json(
    { error: 'Table not found. Run database/bonus-accounting-requests.sql in Supabase.', requests: [] },
    { status: 500 }
  )
}

export async function GET(request: NextRequest) {
  try {
    const actor = getActor(request)
    if ('error' in actor) return actor.error

    const actorRole = await getActorRole(actor.userEmail)
    if (actorRole !== 'admin' && actorRole !== 'owner' && actorRole !== 'accounting') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userId = await getSharedAdminUserId()
    const { data, error } = await supabase
      .from('bonus_accounting_requests')
      .select('id, submitted_by_email, summary_json, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isTableMissing(error)) return tableMissingResponse()
      console.error('GET bonus-accounting-requests:', error)
      return NextResponse.json({ error: error.message, requests: [] }, { status: 500 })
    }

    return NextResponse.json({ requests: data || [] })
  } catch (error: any) {
    console.error('GET /api/bonus-accounting-requests:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error', requests: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = getActor(request)
    if ('error' in actor) return actor.error

    const actorRole = await getActorRole(actor.userEmail)
    if (actorRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const summaryRows = Array.isArray(body?.summaryRows) ? body.summaryRows : null
    if (!summaryRows || summaryRows.length === 0) {
      return NextResponse.json({ error: 'summaryRows are required' }, { status: 400 })
    }

    const userId = await getSharedAdminUserId()
    const createdAt = new Date().toISOString()
    const { data, error } = await supabase
      .from('bonus_accounting_requests')
      .insert({
        user_id: userId,
        submitted_by_email: actor.userEmail,
        summary_json: summaryRows,
        created_at: createdAt,
      })
      .select('id, submitted_by_email, summary_json, created_at')
      .single()

    if (error) {
      if (isTableMissing(error)) return tableMissingResponse()
      console.error('POST bonus-accounting-requests:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    console.error('POST /api/bonus-accounting-requests:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = getActor(request)
    if ('error' in actor) return actor.error

    const actorRole = await getActorRole(actor.userEmail)
    if (actorRole !== 'accounting' && actorRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const requestId = Number(body?.requestId)
    const rowIndex = Number(body?.rowIndex)
    const paymentStatus =
      body?.paymentStatus === 'paid' || body?.paymentStatus === 'not_paid' ? body.paymentStatus : 'pending'

    if (!Number.isFinite(requestId) || requestId <= 0 || !Number.isInteger(rowIndex) || rowIndex < 0) {
      return NextResponse.json({ error: 'requestId and rowIndex are required' }, { status: 400 })
    }

    const userId = await getSharedAdminUserId()
    const { data: existing, error: loadError } = await supabase
      .from('bonus_accounting_requests')
      .select('id, submitted_by_email, created_at, summary_json')
      .eq('user_id', userId)
      .eq('id', requestId)
      .maybeSingle()

    if (loadError) {
      if (isTableMissing(loadError)) return tableMissingResponse()
      return NextResponse.json({ error: loadError.message }, { status: 500 })
    }

    const currentRows = Array.isArray(existing?.summary_json) ? existing.summary_json : []
    if (!existing || !currentRows[rowIndex]) {
      return NextResponse.json({ error: 'Request row not found' }, { status: 404 })
    }

    const nextRows = currentRows.map((row: any, index: number) =>
      index === rowIndex ? { ...row, paymentStatus } : row
    )

    const { data, error } = await supabase
      .from('bonus_accounting_requests')
      .update({ summary_json: nextRows })
      .eq('user_id', userId)
      .eq('id', requestId)
      .select('id, submitted_by_email, summary_json, created_at')
      .single()

    if (error) {
      if (isTableMissing(error)) return tableMissingResponse()
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      request: {
        id: data?.id ?? existing.id,
        submitted_by_email: data?.submitted_by_email ?? existing.submitted_by_email,
        created_at: data?.created_at ?? existing.created_at,
        summary_json: nextRows,
      },
    })
  } catch (error: any) {
    console.error('PATCH /api/bonus-accounting-requests:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = getActor(request)
    if ('error' in actor) return actor.error

    const actorRole = await getActorRole(actor.userEmail)
    if (actorRole !== 'accounting' && actorRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = Number(searchParams.get('requestId'))
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
    }

    const userId = await getSharedAdminUserId()
    const { error } = await supabase
      .from('bonus_accounting_requests')
      .delete()
      .eq('user_id', userId)
      .eq('id', requestId)

    if (error) {
      if (isTableMissing(error)) return tableMissingResponse()
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, requestId })
  } catch (error: any) {
    console.error('DELETE /api/bonus-accounting-requests:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
