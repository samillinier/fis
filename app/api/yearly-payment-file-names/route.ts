// API Route - Yearly payment file names (Supabase)
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
      .from('yearly_payment_metadata')
      .select('payment_file_name')
      .eq('user_id', sharedAdminUserId)
      .eq('year', year)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      paymentFileName: data?.payment_file_name || null,
    })
  } catch (error: any) {
    console.error('Yearly payment file names GET error:', error)
    return NextResponse.json({ paymentFileName: null }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { paymentFileName } = body
    const sharedAdminUserId = await getSharedAdminUserId()

    const { error } = await supabase
      .from('yearly_payment_metadata')
      .upsert(
        {
          user_id: sharedAdminUserId,
          year,
          payment_file_name: paymentFileName || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,year' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Yearly payment file names POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
