import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// GET - Fetch notifications for user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch all notifications (read and unread) - show more notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications: data || [] })
  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Mark notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', notificationIds)

    if (error) {
      console.error('Error marking notifications as read:', error)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Create notification (for system use)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    const body = await request.json()
    const { workroom, message, type = 'warning' } = body

    if (!workroom || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for duplicate notification (same workroom and similar message)
    // Look for unread notifications with the same workroom and similar message
    const messageLower = message.toLowerCase()
    const { data: existingNotifications, error: checkError } = await supabase
      .from('notifications')
      .select('id, message, is_read')
      .eq('user_id', userId)
      .eq('workroom', workroom)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (checkError) {
      console.error('Error checking for duplicates:', checkError)
    } else if (existingNotifications && existingNotifications.length > 0) {
      // Check if any existing notification has a similar message
      const isDuplicate = existingNotifications.some((n) => {
        const existingMessageLower = n.message.toLowerCase()
        
        // Check for exact match or very similar messages
        if (existingMessageLower === messageLower) {
          return true
        }
        
        // Check for key metric matches to prevent duplicates
        const metrics = ['ltr', 'reschedule rate', 'vendor debit', 'cycle time', 'job cycle time', 'details cycle time']
        for (const metric of metrics) {
          if (messageLower.includes(metric) && existingMessageLower.includes(metric)) {
            // If both messages contain the same metric, it's likely a duplicate
            // Extract the metric-specific part to compare
            const messageMetricPart = messageLower.split(metric)[0] + metric
            const existingMetricPart = existingMessageLower.split(metric)[0] + metric
            if (messageMetricPart === existingMetricPart) {
              return true
            }
          }
        }
        
        return false
      })

      if (isDuplicate) {
        console.log(`[Notifications] Duplicate notification prevented: ${message.substring(0, 50)}...`)
        return NextResponse.json({ 
          error: 'Duplicate notification', 
          duplicate: true 
        }, { status: 409 }) // 409 Conflict
      }
    }

    // Create notification if no duplicate found
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        workroom,
        message,
        type,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error('Error in PUT /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

