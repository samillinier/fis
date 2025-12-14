import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase()
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    if (error) {
      throw error
    }

    const accessRequests =
      data?.map((row) => ({
        email: row.email,
        name: row.name || undefined,
        source: row.source || 'login',
        requestedAt: row.requested_at || row.created_at,
      })) || []

    return NextResponse.json({ accessRequests })
  } catch (error: any) {
    console.error('access-requests GET error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error', accessRequests: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedEmail = normalizeEmail(body.email)
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const name = body.name?.trim() || null
    const source = body.source || 'login'
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('access_requests')
      .upsert(
        {
          email: normalizedEmail,
          name,
          source,
          requested_at: now,
        },
        {
          onConflict: 'email',
        }
      )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('access-requests POST error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = normalizeEmail(searchParams.get('email') || undefined)

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { error } = await supabase.from('access_requests').delete().eq('email', email)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('access-requests DELETE error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

