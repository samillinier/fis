import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SUPER_ADMIN_EMAIL = 'sbiru@fiscorponline.com'

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase()
}

// GET - Check if user has chat widget access, or get list of all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    const normalizedEmail = normalizeEmail(userEmail)

    // Check if requester is allowed to review chat widget access
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const isAdmin = actorData?.role === 'admin'
    const isOwner = actorData?.role === 'owner'

    // If admin or owner, return list of all users with their access status
    if (isAdmin || isOwner) {
      const { data: users, error: fetchError } = await supabase
        .from('authorized_users')
        .select('email, name, role, is_active, chat_widget_enabled')
        .order('email', { ascending: true })

      if (fetchError) {
        // If column doesn't exist, return users without chat_widget_enabled
        if (fetchError.code === '42703' || fetchError.message?.includes('column') || fetchError.message?.includes('chat_widget_enabled')) {
          const { data: usersWithoutColumn } = await supabase
            .from('authorized_users')
            .select('email, name, role, is_active')
            .order('email', { ascending: true })
          
          return NextResponse.json({
            users: usersWithoutColumn?.map((u) => ({
              email: u.email,
              name: u.name || undefined,
              role: u.role === 'admin' || u.role === 'owner' || u.role === 'accounting' ? u.role : 'user',
              isActive: u.is_active !== false,
              chatWidgetEnabled: false, // Default to false if column doesn't exist
            })) || [],
          })
        }
        
        console.error('Error fetching users:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        users: users?.map((u) => ({
          email: u.email,
          name: u.name || undefined,
          role: u.role === 'admin' || u.role === 'owner' || u.role === 'accounting' ? u.role : 'user',
          isActive: u.is_active !== false,
          chatWidgetEnabled: u.chat_widget_enabled === true,
        })) || [],
      })
    }

    // If not admin, check if this user has chat widget access
    const { data, error } = await supabase
      .from('authorized_users')
      .select('chat_widget_enabled, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      // If column doesn't exist, default to allowing access (backward compatibility)
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('chat_widget_enabled')) {
        console.warn('chat_widget_enabled column not found, defaulting to allow access')
        // Check if user is authorized at all
        const { data: userData } = await supabase
          .from('authorized_users')
          .select('is_active')
          .eq('email', normalizedEmail)
          .maybeSingle()
        
        if (!userData) {
          return NextResponse.json({ hasAccess: false })
        }
        
        // If column doesn't exist, allow access by default (backward compatibility)
        return NextResponse.json({ hasAccess: userData.is_active !== false })
      }
      
      console.error('Error checking chat widget access:', error)
      return NextResponse.json({ error: 'Failed to check access' }, { status: 500 })
    }

    // If user not found in authorized_users, deny access
    if (!data) {
      return NextResponse.json({ hasAccess: false })
    }

    // User must be active and have chat_widget_enabled = true
    // If chat_widget_enabled is null (column exists but not set), default to false
    const hasAccess = data.is_active !== false && data.chat_widget_enabled === true

    return NextResponse.json({ hasAccess })
  } catch (error: any) {
    console.error('Error in GET /api/chat-widget-access:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update chat widget access for users
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const actorEmail = authHeader.replace('Bearer ', '')
    const normalizedActorEmail = normalizeEmail(actorEmail)

    // Check if actor is admin
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role')
      .eq('email', normalizedActorEmail)
      .maybeSingle()

    if (!actorData || actorData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, chatWidgetEnabled } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (typeof chatWidgetEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'chatWidgetEnabled must be a boolean' },
        { status: 400 }
      )
    }

    const normalizedEmail = normalizeEmail(email)

    // Update chat widget access
    const { error: updateError } = await supabase
      .from('authorized_users')
      .update({ chat_widget_enabled: chatWidgetEnabled })
      .eq('email', normalizedEmail)

    if (updateError) {
      console.error('Error updating chat widget access:', updateError)
      
      // Check if column doesn't exist
      const errorMessage = updateError.message || String(updateError)
      if (updateError.code === '42703' || errorMessage.includes('column') || errorMessage.includes('chat_widget_enabled')) {
        return NextResponse.json(
          { 
            error: 'Database column not found. Please run the migration: database/add-chat-widget-access.sql in Supabase SQL Editor.',
            details: 'The chat_widget_enabled column does not exist in the authorized_users table.'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to update access',
          details: errorMessage
        },
        { status: 500 }
      )
    }

    // Return updated list of authorized users with chat widget access
    const { data: users, error: fetchError } = await supabase
      .from('authorized_users')
      .select('email, name, role, is_active, chat_widget_enabled')
      .order('email', { ascending: true })

    if (fetchError) {
      // If column doesn't exist, return users without chat_widget_enabled
      const errorMessage = fetchError.message || String(fetchError)
      if (fetchError.code === '42703' || errorMessage.includes('column') || errorMessage.includes('chat_widget_enabled')) {
        const { data: usersWithoutColumn } = await supabase
          .from('authorized_users')
          .select('email, name, role, is_active')
          .order('email', { ascending: true })
        
        return NextResponse.json({
          success: true,
          users: usersWithoutColumn?.map((u) => ({
            email: u.email,
            name: u.name || undefined,
            role: u.role === 'admin' ? 'admin' : 'user',
            isActive: u.is_active !== false,
            chatWidgetEnabled: false, // Default to false if column doesn't exist
          })) || [],
          warning: 'Database column not found. Please run the migration: database/add-chat-widget-access.sql'
        })
      }
      
      console.error('Error fetching users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: errorMessage },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users?.map((u) => ({
        email: u.email,
        name: u.name || undefined,
        role: u.role === 'admin' ? 'admin' : 'user',
        isActive: u.is_active !== false,
        chatWidgetEnabled: u.chat_widget_enabled === true,
      })) || [],
    })
  } catch (error: any) {
    console.error('Error in PATCH /api/chat-widget-access:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
