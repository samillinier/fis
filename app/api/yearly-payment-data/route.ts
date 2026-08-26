// API Route - Yearly Payment Data — Supabase shared model
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
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const year = parseYear(request)
    if (!year) {
      return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })
    }

    const sharedAdminUserId = await getSharedAdminUserId()

    const { data, error } = await supabase
      .from('yearly_payment_data')
      .select('*')
      .eq('user_id', sharedAdminUserId)
      .eq('year', year)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const payments = data?.data_jsonb
      ? (Array.isArray(data.data_jsonb) ? data.data_jsonb : [])
      : []

    return NextResponse.json({
      payments,
      fileName: data?.file_name || null,
      uploadDate: data?.upload_date || null,
    })
  } catch (error: any) {
    console.error('Yearly Payment API GET error:', error)
    return NextResponse.json({
      payments: [],
      fileName: null,
      uploadDate: null,
      error: error?.message,
    }, { status: 500 })
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
    const { payments, fileName, year } = body

    if (!year || year < 2000 || year > 3000) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }

    const sharedAdminUserId = await getSharedAdminUserId()
    const now = new Date().toISOString()

    await supabase
      .from('yearly_payment_data')
      .delete()
      .eq('user_id', sharedAdminUserId)
      .eq('year', year)

    const { error } = await supabase.from('yearly_payment_data').insert({
      user_id: sharedAdminUserId,
      year,
      data_jsonb: payments || [],
      file_name: fileName || null,
      upload_date: now,
      updated_at: now,
    })

    if (error) throw error

    if (fileName) {
      await supabase.from('yearly_payment_metadata').upsert(
        {
          user_id: sharedAdminUserId,
          year,
          payment_file_name: fileName,
          updated_at: now,
        },
        { onConflict: 'user_id,year' }
      )
    }

    return NextResponse.json({ success: true, count: (payments || []).length })
  } catch (error: any) {
    console.error('Yearly Payment API POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const year = parseYear(request)
    if (!year) {
      return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })
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

    const sharedAdminUserId = await getSharedAdminUserId()

    await supabase
      .from('yearly_payment_data')
      .delete()
      .eq('user_id', sharedAdminUserId)
      .eq('year', year)

    await supabase.from('yearly_payment_metadata').upsert(
      {
        user_id: sharedAdminUserId,
        year,
        payment_file_name: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,year' }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Yearly Payment API DELETE error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
