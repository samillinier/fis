import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SUPER_ADMIN_EMAIL = 'sbiru@fiscorponline.com'

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase()
}

async function ensureSuperAdmin() {
  const normalized = normalizeEmail(SUPER_ADMIN_EMAIL)
  const { data } = await supabase
    .from('authorized_users')
    .select('email')
    .eq('email', normalized)
    .maybeSingle()

  if (!data) {
    await supabase
      .from('authorized_users')
      .insert({
        email: normalized,
        role: 'admin',
        is_active: true,
      })
  }
}

async function listAuthorizedUsers() {
  await ensureSuperAdmin()

  const { data, error } = await supabase
    .from('authorized_users')
    .select('*')
    .order('email', { ascending: true })

  if (error) {
    throw error
  }

  return (
    data?.map((row) => ({
      email: row.email,
      name: row.name || undefined,
      role: row.role === 'admin' ? 'admin' : 'user',
      isActive: row.is_active !== false,
      createdAt: row.created_at || undefined,
      createdBy: row.created_by || undefined,
    })) || []
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const authorizedUsers = await listAuthorizedUsers()
    return NextResponse.json({ authorizedUsers })
  } catch (error: any) {
    console.error('authorized-users GET error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error', authorizedUsers: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const normalizedEmail = normalizeEmail(body.email)
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const name = body.name?.trim() || null
    const role = body.role === 'admin' ? 'admin' : 'user'
    const createdBy = authHeader.replace('Bearer ', '') || null

    if (normalizedEmail === normalizeEmail(SUPER_ADMIN_EMAIL)) {
      // super admin always admin/active
      const { error } = await supabase
        .from('authorized_users')
        .upsert({
          email: normalizedEmail,
          name,
          role: 'admin',
          is_active: true,
          created_by: createdBy,
        })

      if (error) {
        throw error
      }
    } else {
      const { error } = await supabase
        .from('authorized_users')
        .upsert(
          {
            email: normalizedEmail,
            name,
            role,
            is_active: true,
            created_by: createdBy,
          },
          {
            onConflict: 'email',
          }
        )

      if (error) {
        throw error
      }
    }

    const authorizedUsers = await listAuthorizedUsers()
    return NextResponse.json({ authorizedUsers })
  } catch (error: any) {
    console.error('authorized-users POST error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const normalizedEmail = normalizeEmail(body.email)
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (body.role) {
      updates.role = body.role === 'admin' ? 'admin' : 'user'
    }
    if (typeof body.isActive === 'boolean') {
      updates.is_active = body.isActive
    }

    // Super admin always admin and active
    if (normalizedEmail === normalizeEmail(SUPER_ADMIN_EMAIL)) {
      updates.role = 'admin'
      updates.is_active = true
    }

    const { error } = await supabase
      .from('authorized_users')
      .update(updates)
      .eq('email', normalizedEmail)

    if (error) {
      throw error
    }

    const authorizedUsers = await listAuthorizedUsers()
    return NextResponse.json({ authorizedUsers })
  } catch (error: any) {
    console.error('authorized-users PATCH error:', error)
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

    if (email === normalizeEmail(SUPER_ADMIN_EMAIL)) {
      return NextResponse.json({ error: 'Cannot remove super admin' }, { status: 400 })
    }

    const { error } = await supabase.from('authorized_users').delete().eq('email', email)

    if (error) {
      throw error
    }

    const authorizedUsers = await listAuthorizedUsers()
    return NextResponse.json({ authorizedUsers })
  } catch (error: any) {
    console.error('authorized-users DELETE error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}






