import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// POST - Login Lowe's team member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    // Try to find member in lowes_team_members table first
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('lowes_team_members')
      .select('*')
      .eq('email', emailLower)
      .maybeSingle()

    let passwordHash: string | null = null

    if (!teamMemberError && teamMember) {
      // Found in lowes_team_members table
      passwordHash = teamMember.password_hash
    } else {
      // Fallback: check if password_hash column exists in lowes_chat_conversations
      // This is for backward compatibility during migration
      const { data: placeholderConv, error: convError } = await supabase
        .from('lowes_chat_conversations')
        .select('password_hash, lowes_email, user_name, user_role, district, store_number')
        .eq('lowes_email', emailLower)
        .eq('quote_ims_number', 'SIGNUP') // Only check placeholder conversations
        .maybeSingle()

      if (!convError && placeholderConv && placeholderConv.password_hash) {
        passwordHash = placeholderConv.password_hash
      }
    }

    // If no password found anywhere, user doesn't exist
    if (!passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password - handle both bcrypt hashed and plain text (for migration period)
    let isPasswordValid = false
    
    // Check if password_hash is bcrypt hashed (starts with $2a$ or $2b$)
    if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$')) {
      // Bcrypt hash - verify normally
      isPasswordValid = await bcrypt.compare(password, passwordHash)
    } else {
      // Plain text (old format) - compare directly for backward compatibility
      // This allows old users to login during migration
      isPasswordValid = passwordHash === password.trim()
      
      // TODO: If plain text match succeeds, should hash and update the password in the database
      // For now, we'll allow it but log a warning
      if (isPasswordValid) {
        console.warn(`[Login] Plain text password detected for ${emailLower} - should migrate to hashed password`)
      }
    }
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Get user data (from whichever table had the password)
    let userData: any = null
    if (teamMember) {
      userData = {
        email: teamMember.email,
        name: teamMember.name,
        role: teamMember.role,
        district: teamMember.district,
        storeNumber: teamMember.store_number,
        groupId: teamMember.group_id,
        photoUrl: teamMember.photo_url
      }

      // Update last_login_at
      await supabase
        .from('lowes_team_members')
        .update({ last_login_at: new Date().toISOString() })
        .eq('email', emailLower)
    } else {
      // Get from conversation placeholder
      const { data: conv } = await supabase
        .from('lowes_chat_conversations')
        .select('lowes_email, user_name, user_role, district, store_number')
        .eq('lowes_email', emailLower)
        .eq('quote_ims_number', 'SIGNUP')
        .maybeSingle()

      if (conv) {
        userData = {
          email: conv.lowes_email,
          name: conv.user_name,
          role: conv.user_role,
          district: conv.district || '',
          storeNumber: conv.store_number || '',
          groupId: null, // Will need to fetch from group_members table
          photoUrl: null
        }
      }
    }

    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 500 })
    }

    // If groupId is null, try to fetch it from group_members
    if (!userData.groupId) {
      const { data: groupMember } = await supabase
        .from('lowes_group_members')
        .select('group_id')
        .eq('member_email', emailLower)
        .maybeSingle()

      if (groupMember) {
        userData.groupId = groupMember.group_id
      }
    }

    return NextResponse.json({
      success: true,
      user: userData
    })
  } catch (error: any) {
    console.error('[POST /api/lowes-auth/login] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
