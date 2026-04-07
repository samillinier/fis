import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase()
}

// PATCH - Update last login time for a user
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedEmail = normalizeEmail(body.email)
    const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl : null
    
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const updates: Record<string, any> = { last_login_at: now }
    // If provided, persist photo so other staff can see avatars in the chat widget
    if (photoUrl && photoUrl.startsWith('data:image/')) {
      updates.photo_url = photoUrl
    }

    const { error } = await supabase
      .from('authorized_users')
      .update(updates)
      .eq('email', normalizedEmail)

    if (error) {
      // If column doesn't exist, log warning but don't fail
      if (error.code === '42703' || error.message?.includes('column')) {
        console.warn('One or more columns not found in authorized_users table (last_login_at/photo_url)')
        return NextResponse.json({ success: true, lastLoginAt: now })
      }
      throw error
    }

    return NextResponse.json({ success: true, lastLoginAt: now })
  } catch (error: any) {
    console.error('Error updating last login:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
