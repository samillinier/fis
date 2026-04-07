import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// GET - Get all Lowe's team members (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')

    // Check if user is allowed to review team members
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    if (!actorData || (actorData.role !== 'admin' && actorData.role !== 'owner')) {
      return NextResponse.json({ error: 'Admin or owner access required' }, { status: 403 })
    }

    // Try to fetch from lowes_team_members table first (new system)
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('lowes_team_members')
      .select('*')
      .order('created_at', { ascending: false })

    let formattedMembers: any[] = []

    if (!teamMembersError && teamMembers && teamMembers.length > 0) {
      // Use new table - format members from lowes_team_members
      formattedMembers = teamMembers.map((member: any) => ({
        email: member.email,
        name: member.name,
        role: member.role,
        district: member.district,
        storeNumber: member.store_number,
        createdAt: member.created_at,
        lastActivity: member.last_login_at || member.created_at,
        conversationCount: 0, // Will need to count from conversations separately
        isActive: true
      }))

      // Also get conversation count for each member from lowes_chat_conversations
      for (const member of formattedMembers) {
        const { count } = await supabase
          .from('lowes_chat_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('lowes_email', member.email)
        
        if (count !== null) {
          member.conversationCount = count
        }
      }
    } else if (teamMembersError?.code === '42P01') {
      // Table doesn't exist - fall back to conversations (backward compatibility)
      console.log('[GET /api/lowes-team-members] lowes_team_members table not found, using conversations table')
      
      const { data: conversations, error: convError } = await supabase
        .from('lowes_chat_conversations')
        .select('lowes_email, user_name, user_role, district_store, district, store_number, created_at')
        .order('created_at', { ascending: false })

      if (convError) {
        console.error('Error fetching from conversations:', convError)
        return NextResponse.json(
          { error: 'Failed to fetch Lowe\'s team members', details: convError.message },
          { status: 500 }
        )
      }

      // Group conversations by email to get unique users
      const userMap = new Map<string, any>()
      
      conversations?.forEach((conv: any) => {
        const email = conv.lowes_email?.toLowerCase()
        if (!email) return

        let district = ''
        let storeNumber = ''
        
        if (conv.district && conv.store_number) {
          district = conv.district
          storeNumber = conv.store_number
        } else if (conv.district_store) {
          const parts = conv.district_store.split(' / Store ')
          district = parts[0] || ''
          storeNumber = parts[1] || ''
        }

        if (!userMap.has(email) || 
            (userMap.get(email).lastActivity && 
             new Date(conv.created_at) > new Date(userMap.get(email).lastActivity))) {
          userMap.set(email, {
            email: conv.lowes_email,
            name: conv.user_name,
            role: conv.user_role,
            district: district,
            storeNumber: storeNumber,
            createdAt: conv.created_at,
            lastActivity: conv.created_at,
            conversationCount: 1
          })
        } else {
          const existing = userMap.get(email)
          existing.conversationCount = (existing.conversationCount || 1) + 1
        }
      })

      formattedMembers = Array.from(userMap.values()).map((member: any) => ({
        email: member.email,
        name: member.name,
        role: member.role,
        district: member.district,
        storeNumber: member.storeNumber,
        createdAt: member.createdAt,
        lastActivity: member.lastActivity,
        conversationCount: member.conversationCount,
        isActive: true
      }))
    } else {
      // Other error with team_members table
      console.error('Error fetching from lowes_team_members:', teamMembersError)
      return NextResponse.json(
        { error: 'Failed to fetch Lowe\'s team members', details: teamMembersError.message },
        { status: 500 }
      )
    }

    // Sort by last activity (most recent first)
    formattedMembers.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    )

    return NextResponse.json({
      members: formattedMembers,
      count: formattedMembers.length
    })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-team-members:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new Lowe's team member (signup - can be called without auth, or by admin)
export async function POST(request: NextRequest) {
  try {
    // Optional admin check - if auth header is provided and user is admin, allow admin creation
    // Otherwise, allow public signup (for Lowe's team members to create their own accounts)
    const authHeader = request.headers.get('authorization')
    let isAdmin = false
    
    if (authHeader) {
      const userEmail = authHeader.replace('Bearer ', '')
      const { data: actorData } = await supabase
        .from('authorized_users')
        .select('role')
        .eq('email', userEmail.toLowerCase())
        .maybeSingle()
      
      isAdmin = actorData?.role === 'admin'
    }

    const body = await request.json()
    const { email, name, role, district, storeNumber, password, groupId } = body

    if (!email || !name || !role || !district || !storeNumber || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    // Check if member already exists in lowes_team_members (if table exists)
    const { data: existingTeamMember } = await supabase
      .from('lowes_team_members')
      .select('email')
      .eq('email', emailLower)
      .maybeSingle()

    // Also check if they have any conversations
    const { data: existingConversations } = await supabase
      .from('lowes_chat_conversations')
      .select('lowes_email')
      .eq('lowes_email', emailLower)
      .limit(1)

    if (existingTeamMember || (existingConversations && existingConversations.length > 0)) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Hash password before storing
    const passwordHash = await bcrypt.hash(password.trim(), 10)

    // Try to create in lowes_team_members first (if table exists)
    let newMember: any = null
    let createError: any = null

    const { data: teamMember, error: teamMemberError } = await supabase
      .from('lowes_team_members')
      .insert({
        email: emailLower,
        name: name.trim(),
        role: role.trim(),
        district: district.trim(),
        store_number: storeNumber.trim(),
        password_hash: passwordHash, // Store hashed password
        group_id: groupId || null
      })
      .select()
      .single()

    if (teamMemberError) {
      if (teamMemberError.code === '42P01') {
        // Table doesn't exist - that's okay, we'll create a placeholder conversation
        console.log('[POST /api/lowes-team-members] lowes_team_members table not found, will create placeholder conversation instead')
      } else {
        console.error('[POST /api/lowes-team-members] Error creating in lowes_team_members:', teamMemberError)
        createError = teamMemberError
      }
    } else {
      newMember = teamMember
    }

    // If lowes_team_members doesn't exist or failed, create a placeholder conversation to store password
    // This will allow login to work even without a real conversation
    if (!newMember && !createError) {
      // Create a minimal conversation entry just to store the user's password
      // We'll use a special conversation_key format to identify placeholder entries
      const placeholderKey = `signup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Build insert data - try with all columns first, fallback if columns don't exist
      const conversationData: any = {
        conversation_key: placeholderKey,
        lowes_email: emailLower,
        user_name: name.trim(),
        user_role: role.trim(),
        district_store: `${district.trim()} / Store ${storeNumber.trim()}`,
        quote_ims_number: 'SIGNUP',
        flooring_category: 'other',
        question_types: [],
        category: 'other',
        created_by: emailLower,
        status: 'closed' // Mark as closed so it doesn't show up as a real conversation
      }

      // Try to add optional columns if they exist (district, store_number, password_hash)
      // We'll try the insert and handle errors gracefully
      const insertData = { ...conversationData }
      
      // Try inserting with all optional columns
      const { data: placeholderConv, error: convError } = await supabase
        .from('lowes_chat_conversations')
        .insert({
          ...insertData,
          district: district.trim(),
          store_number: storeNumber.trim(),
          password_hash: passwordHash // Store hashed password (backward compatibility fallback)
        })
        .select()
        .single()

      if (convError) {
        // If columns don't exist, try without them
        if (convError.code === '42703' || convError.message?.includes('column')) {
          console.log('[POST /api/lowes-team-members] Some columns missing, trying without password_hash/district/store_number')
          
          // Try again without the optional columns
          const { data: fallbackConv, error: fallbackError } = await supabase
            .from('lowes_chat_conversations')
            .insert(insertData)
            .select()
            .single()

          if (fallbackError) {
            console.error('[POST /api/lowes-team-members] Error creating placeholder conversation:', fallbackError)
            return NextResponse.json(
              { error: 'Failed to create member', details: `Database error: ${fallbackError.message}. Please ensure the lowes_chat_conversations table exists with required columns.` },
              { status: 500 }
            )
          }

          // Return member data from conversation (password won't be stored in DB)
          newMember = {
            email: fallbackConv.lowes_email,
            name: fallbackConv.user_name,
            role: fallbackConv.user_role,
            district: district.trim(),
            store_number: storeNumber.trim(),
            group_id: groupId || null
          }
        } else {
          console.error('[POST /api/lowes-team-members] Error creating placeholder conversation:', convError)
          return NextResponse.json(
            { error: 'Failed to create member', details: `Database error: ${convError.message}` },
            { status: 500 }
          )
        }
      } else {
        // Successfully created with all columns
        newMember = {
          email: placeholderConv.lowes_email,
          name: placeholderConv.user_name,
          role: placeholderConv.user_role,
          district: placeholderConv.district || district.trim(),
          store_number: placeholderConv.store_number || storeNumber.trim(),
          group_id: groupId || null
        }
      }
    } else if (createError) {
      console.error('[POST /api/lowes-team-members] Error creating Lowe\'s team member:', createError)
      return NextResponse.json(
        { error: 'Failed to create member', details: `Database error: ${createError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: {
        email: newMember.email,
        name: newMember.name,
        role: newMember.role,
        district: newMember.district,
        storeNumber: newMember.store_number || newMember.storeNumber,
        groupId: newMember.group_id
      }
    })
  } catch (error: any) {
    console.error('[POST /api/lowes-team-members] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update Lowe's team member (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const actorEmailRaw = authHeader.replace('Bearer ', '')
    const actorEmail = actorEmailRaw.toLowerCase()

    // Check if actor is admin (FIS POD)
    let actorIsAdmin = false
    try {
      const { data: actorData } = await supabase
        .from('authorized_users')
        .select('role, is_active')
        .eq('email', actorEmail)
        .maybeSingle()
      actorIsAdmin = !!actorData && actorData.is_active !== false && actorData.role === 'admin'
    } catch {
      actorIsAdmin = false
    }

    const body = await request.json()
    const { memberEmail, name, role, district, storeNumber, groupId, password, currentPassword, newPassword } = body

    if (!memberEmail) {
      return NextResponse.json({ error: 'Member email is required' }, { status: 400 })
    }

    const emailLower = memberEmail.toLowerCase()
    const actorIsSelf = actorEmail === emailLower

    // Allow: admin can edit anyone, or user can edit themselves
    if (!actorIsAdmin && !actorIsSelf) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build update data
    const updateData: any = {}
    
    if (name) updateData.name = name.trim()
    if (role) updateData.role = role.trim()
    if (district) updateData.district = district.trim()
    if (storeNumber) updateData.store_number = storeNumber.trim()
    // Only admins can change group assignment
    if (actorIsAdmin && groupId !== undefined) updateData.group_id = groupId || null

    // Password changes:
    // - Admin: can set password via `password`
    // - Self: must provide `currentPassword` + `newPassword`
    const adminWantsPasswordReset = actorIsAdmin && typeof password === 'string' && password.trim().length > 0
    const selfWantsPasswordChange = actorIsSelf && typeof newPassword === 'string' && newPassword.trim().length > 0

    if (adminWantsPasswordReset) {
      const pw = password.trim()
      if (pw.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      updateData.password_hash = await bcrypt.hash(pw, 10)
    }

    if (selfWantsPasswordChange) {
      const cpw = typeof currentPassword === 'string' ? currentPassword : ''
      const npw = newPassword.trim()
      if (!cpw || !npw) {
        return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
      }
      if (npw.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }

      // Verify current password against lowes_team_members OR placeholder conversation
      let storedHash: string | null = null
      const { data: teamMember } = await supabase
        .from('lowes_team_members')
        .select('password_hash')
        .eq('email', emailLower)
        .maybeSingle()
      if (teamMember?.password_hash) {
        storedHash = teamMember.password_hash
      } else {
        const { data: placeholder } = await supabase
          .from('lowes_chat_conversations')
          .select('password_hash')
          .eq('lowes_email', emailLower)
          .eq('quote_ims_number', 'SIGNUP')
          .maybeSingle()
        if (placeholder?.password_hash) storedHash = placeholder.password_hash
      }

      if (!storedHash) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }

      let ok = false
      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        ok = await bcrypt.compare(cpw, storedHash)
      } else {
        ok = storedHash === cpw.trim()
      }

      if (!ok) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      updateData.password_hash = await bcrypt.hash(npw, 10)
    }

    // Try to update in lowes_team_members table
    const { data: updatedMember, error: updateError } = await supabase
      .from('lowes_team_members')
      .update(updateData)
      .eq('email', emailLower)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '42P01') {
        // Table doesn't exist
        // Best-effort fallback to placeholder conversation (migration period)
        const convUpdate: any = {}
        if (updateData.name) convUpdate.user_name = updateData.name
        if (updateData.role) convUpdate.user_role = updateData.role
        if (updateData.district) convUpdate.district = updateData.district
        if (updateData.store_number) convUpdate.store_number = updateData.store_number
        if (updateData.password_hash) convUpdate.password_hash = updateData.password_hash

        const { data: placeholder, error: convErr } = await supabase
          .from('lowes_chat_conversations')
          .update(convUpdate)
          .eq('lowes_email', emailLower)
          .eq('quote_ims_number', 'SIGNUP')
          .select('lowes_email, user_name, user_role, district, store_number')
          .maybeSingle()

        if (convErr || !placeholder) {
          return NextResponse.json(
            { error: 'Member not found', details: 'Account may need to be re-created or migrated.' },
            { status: 404 }
          )
        }

        // Also best-effort update all conversations for consistent display
        await supabase
          .from('lowes_chat_conversations')
          .update({
            user_name: convUpdate.user_name ?? undefined,
            user_role: convUpdate.user_role ?? undefined,
            district: convUpdate.district ?? undefined,
            store_number: convUpdate.store_number ?? undefined,
          })
          .eq('lowes_email', emailLower)

        return NextResponse.json({
          success: true,
          member: {
            email: placeholder.lowes_email,
            name: placeholder.user_name,
            role: placeholder.user_role,
            district: placeholder.district || '',
            storeNumber: placeholder.store_number || '',
            groupId: null,
          },
        })
      } else if (updateError.code === 'PGRST116') {
        // No rows updated - member doesn't exist
        // Fallback: try placeholder conversation (migration period)
        const convUpdate: any = {}
        if (updateData.name) convUpdate.user_name = updateData.name
        if (updateData.role) convUpdate.user_role = updateData.role
        if (updateData.district) convUpdate.district = updateData.district
        if (updateData.store_number) convUpdate.store_number = updateData.store_number
        if (updateData.password_hash) convUpdate.password_hash = updateData.password_hash

        const { data: placeholder, error: convErr } = await supabase
          .from('lowes_chat_conversations')
          .update(convUpdate)
          .eq('lowes_email', emailLower)
          .eq('quote_ims_number', 'SIGNUP')
          .select('lowes_email, user_name, user_role, district, store_number')
          .maybeSingle()

        if (convErr || !placeholder) {
          return NextResponse.json(
            { error: 'Member not found', details: 'Member may need to be created first.' },
            { status: 404 }
          )
        }

        // Also best-effort update all conversations for consistent display
        await supabase
          .from('lowes_chat_conversations')
          .update({
            user_name: convUpdate.user_name ?? undefined,
            user_role: convUpdate.user_role ?? undefined,
            district: convUpdate.district ?? undefined,
            store_number: convUpdate.store_number ?? undefined,
          })
          .eq('lowes_email', emailLower)

        return NextResponse.json({
          success: true,
          member: {
            email: placeholder.lowes_email,
            name: placeholder.user_name,
            role: placeholder.user_role,
            district: placeholder.district || '',
            storeNumber: placeholder.store_number || '',
            groupId: null,
          },
        })
      } else {
        console.error('[PATCH /api/lowes-team-members] Error updating member:', updateError)
        return NextResponse.json(
          { error: 'Failed to update member', details: updateError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      member: {
        email: updatedMember.email,
        name: updatedMember.name,
        role: updatedMember.role,
        district: updatedMember.district,
        storeNumber: updatedMember.store_number,
        groupId: updatedMember.group_id
      }
    })
  } catch (error: any) {
    console.error('[PATCH /api/lowes-team-members] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
