import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

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

    // Notify all admins and presidents about the new access request
    try {
      console.log(`[Access Request] Starting notification process for: ${normalizedEmail}`)
      
      // Get all admins from authorized_users table
      const { data: admins, error: adminError } = await supabase
        .from('authorized_users')
        .select('email')
        .eq('role', 'admin')
        .eq('is_active', true)

      if (adminError) {
        console.error('[Access Request] Error fetching admins for notification:', adminError)
      } else {
        console.log(`[Access Request] Found ${(admins || []).length} admin(s)`)
      }

      // Get all users with President role from user_metadata table
      const { data: presidentUsers, error: presidentError } = await supabase
        .from('user_metadata')
        .select('user_id, user_role')
        .eq('user_role', 'President')

      if (presidentError) {
        console.error('[Access Request] Error fetching presidents for notification:', presidentError)
      } else {
        console.log(`[Access Request] Found ${(presidentUsers || []).length} president(s)`)
      }

      // Get user emails for presidents
      const presidentEmails: string[] = []
      if (presidentUsers && presidentUsers.length > 0) {
        const presidentUserIds = presidentUsers.map(p => p.user_id).filter(Boolean)
        console.log(`[Access Request] President user IDs:`, presidentUserIds)
        if (presidentUserIds.length > 0) {
          const { data: presidentUserData, error: userDataError } = await supabase
            .from('users')
            .select('email')
            .in('id', presidentUserIds)

          if (userDataError) {
            console.error('[Access Request] Error fetching president user emails:', userDataError)
          } else if (presidentUserData) {
            presidentEmails.push(...presidentUserData.map(u => u.email).filter(Boolean))
            console.log(`[Access Request] President emails:`, presidentEmails)
          }
        }
      }

      // Combine admin and president emails
      const adminEmails = (admins || []).map(a => a.email).filter(Boolean)
      const allRecipients = Array.from(new Set([...adminEmails, ...presidentEmails]))
      console.log(`[Access Request] Total recipients (admins + presidents): ${allRecipients.length}`, allRecipients)
      
      if (allRecipients.length === 0) {
        console.warn('[Access Request] ⚠️ No admins or presidents found to notify!')
      }

      // Create notifications for each admin and president
      const requesterName = name || normalizedEmail
      const notificationMessage = `🔔 New access request from ${requesterName} (${normalizedEmail})`

      let notificationCount = 0
      for (const recipientEmail of allRecipients) {
        try {
          const recipientUserId = await ensureUserExists(recipientEmail)
          if (recipientUserId) {
            console.log(`[Access Request] Creating notification for ${recipientEmail} (user_id: ${recipientUserId})`)
            
            // Check for duplicate notification (within last 24 hours)
            const { data: existing, error: checkError } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', recipientUserId)
              .eq('workroom', 'System')
              .ilike('message', `%${normalizedEmail}%`)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (checkError) {
              console.error(`[Access Request] Error checking duplicates for ${recipientEmail}:`, checkError)
            }

            if (!existing) {
              // Create notification
              const { data: newNotification, error: insertError } = await supabase
                .from('notifications')
                .insert({
                  user_id: recipientUserId,
                  workroom: 'System',
                  message: notificationMessage,
                  type: 'info',
                  is_read: false,
                })
                .select()
                .single()

              if (insertError) {
                console.error(`[Access Request] Error creating notification for ${recipientEmail}:`, insertError)
              } else {
                console.log(`[Access Request] ✅ Created notification for ${recipientEmail}:`, newNotification)
                notificationCount++
              }
            } else {
              console.log(`[Access Request] ⏭️ Skipping duplicate notification for ${recipientEmail}`)
            }
          } else {
            console.warn(`[Access Request] Could not get user ID for ${recipientEmail}`)
          }
        } catch (error) {
          console.error(`[Access Request] Error processing notification for ${recipientEmail}:`, error)
        }
      }

      console.log(`[Access Request] ✅ Created ${notificationCount} notification(s) for ${allRecipients.length} recipient(s)`)
    } catch (notificationError) {
      // Don't fail the access request if notification fails
      console.error('[Access Request] Error in notification process:', notificationError)
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




