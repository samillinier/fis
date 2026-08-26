// API Route - Payment Data (Monthly) — Supabase shared model
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
      .from('payment_data')
      .select('*')
      .eq('user_id', sharedAdminUserId)
      .order('id', { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const row = data?.[0]
    const payments = row?.data_jsonb
      ? (Array.isArray(row.data_jsonb) ? row.data_jsonb : [])
      : []

    return NextResponse.json({
      payments,
      fileName: row?.file_name || null,
      uploadDate: row?.upload_date || null,
    })
  } catch (error: any) {
    console.error('Payment API GET error:', error)
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
    const { payments, fileName } = body
    const sharedAdminUserId = await getSharedAdminUserId()
    const now = new Date().toISOString()

    await supabase.from('payment_data').delete().eq('user_id', sharedAdminUserId)

    const { error } = await supabase.from('payment_data').insert({
      user_id: sharedAdminUserId,
      data_jsonb: payments || [],
      file_name: fileName || null,
      upload_date: now,
      updated_at: now,
    })

    if (error) throw error

    if (fileName) {
      await supabase.from('payment_metadata').upsert(
        {
          user_id: sharedAdminUserId,
          payment_file_name: fileName,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )
    }

    return NextResponse.json({ success: true, count: (payments || []).length })
  } catch (error: any) {
    console.error('Payment API POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const sharedAdminUserId = await getSharedAdminUserId()
    const now = new Date().toISOString()

    await supabase.from('payment_data').delete().eq('user_id', sharedAdminUserId)

    await supabase.from('payment_metadata').upsert(
      {
        user_id: sharedAdminUserId,
        payment_file_name: null,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment API DELETE error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
