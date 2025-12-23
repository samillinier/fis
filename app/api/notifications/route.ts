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
    // Look at ALL notifications (read and unread) to prevent duplicates
    const messageLower = message.toLowerCase().trim()
    const workroomNormalized = workroom.trim()
    
    const { data: existingNotifications, error: checkError } = await supabase
      .from('notifications')
      .select('id, message, is_read, workroom')
      .eq('user_id', userId)
      .eq('workroom', workroomNormalized)
      .order('created_at', { ascending: false })
      .limit(100)

    if (checkError) {
      console.error('Error checking for duplicates:', checkError)
    } else if (existingNotifications && existingNotifications.length > 0) {
      // Check if any existing notification has a similar message
      const isDuplicate = existingNotifications.some((n) => {
        const existingMessageLower = (n.message || '').toLowerCase().trim()
        const existingWorkroom = (n.workroom || '').trim()
        
        // Must be same workroom
        if (existingWorkroom.toLowerCase() !== workroomNormalized.toLowerCase()) {
          return false
        }
        
        // Check for exact match
        if (existingMessageLower === messageLower) {
          return true
        }
        
        // Extract metric from new format with more precise matching
        const extractMetric = (msg: string): string | null => {
          // Use specific patterns to identify metrics accurately
          if (msg.includes('ltr') && msg.includes('performance is below standard')) return 'ltr'
          if (msg.includes('reschedule rate') && msg.includes('above target')) return 'reschedule_rate'
          if (msg.includes('job cycle time') && msg.includes('exceeds target')) return 'job_cycle_time'
          if (msg.includes('work order cycle time') && (msg.includes('exceeds target') || msg.includes('n/a'))) return 'work_order_cycle_time'
          if (msg.includes('details cycle time') && msg.includes('exceeds target')) return 'details_cycle_time'
          if (msg.includes('vendor debits') && (msg.includes('above target') || msg.includes('ratio is above'))) return 'vendor_debits'
          
          // Fallback to simple pattern matching
          const metrics = ['ltr', 'job cycle time', 'work order cycle time', 'details cycle time', 'reschedule rate', 'vendor debits']
          for (const metric of metrics) {
            if (msg.includes(metric)) {
              return metric
            }
          }
          return null
        }
        
        // If new format (contains ⚠️), check by metric with precise matching
        if (messageLower.includes('⚠️')) {
          const newMetric = extractMetric(messageLower)
          const existingMetric = extractMetric(existingMessageLower)
          
          if (newMetric && existingMetric && newMetric === existingMetric) {
            // Same metric for same workroom = duplicate
            console.log(`[Notifications API] Duplicate detected: ${newMetric} for ${workroomNormalized}`)
            return true
          }
        }
        
        // Also check if old format exists for same metric (treat as duplicate)
        // Use more specific patterns to avoid false positives
        const metricPatterns = [
          { pattern: 'ltr', key: 'ltr' },
          { pattern: 'job cycle time', key: 'job_cycle_time' },
          { pattern: 'work order cycle time', key: 'work_order_cycle_time' },
          { pattern: 'details cycle time', key: 'details_cycle_time' },
          { pattern: 'reschedule rate', key: 'reschedule_rate' },
          { pattern: 'vendor debit', key: 'vendor_debits' }
        ]
        
        // For Work Order Cycle Time, also check for N/A pattern
        if (messageLower.includes('work order cycle time') && existingMessageLower.includes('work order cycle time')) {
          // Both have work order cycle time - check if one has N/A and the other doesn't
          const newHasNA = messageLower.includes('n/a')
          const existingHasNA = existingMessageLower.includes('n/a')
          // If both have N/A or both don't have N/A, they're duplicates
          if (newHasNA === existingHasNA) {
            console.log(`[Notifications API] Duplicate detected by pattern: work_order_cycle_time for ${workroomNormalized}`)
            return true
          }
        }
        
        for (const { pattern, key } of metricPatterns) {
          const hasMetricInNew = messageLower.includes(pattern)
          const hasMetricInExisting = existingMessageLower.includes(pattern)
          
          if (hasMetricInNew && hasMetricInExisting) {
            // Both contain same metric for same workroom = duplicate (regardless of format)
            console.log(`[Notifications API] Duplicate detected by pattern: ${key} for ${workroomNormalized}`)
            return true
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

    // Validate data before creating
    if (!workroomNormalized || !message.trim()) {
      return NextResponse.json({ error: 'Invalid workroom or message' }, { status: 400 })
    }

    // REJECT old format notifications - only accept new hazard format with ⚠️
    // messageLower is already defined above
    const isOldFormat = messageLower.includes('has high') || 
                       messageLower.includes('has low') || 
                       messageLower.includes('score:') ||
                       messageLower.includes('review ') ||
                       (!messageLower.includes('⚠️'))
    
    if (isOldFormat) {
      console.log(`[Notifications] Rejecting old format notification: ${message.substring(0, 50)}...`)
      return NextResponse.json({ 
        error: 'Old notification format not allowed. Only hazard format (⚠️) is accepted.',
        rejected: true
      }, { status: 400 })
    }

    // Create notification if no duplicate found
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        workroom: workroomNormalized,
        message: message.trim(),
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

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
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

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request - notificationIds array required' }, { status: 400 })
    }

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete notifications - only delete notifications belonging to this user
    const { error, count } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .in('id', notificationIds)

    if (error) {
      console.error('Error deleting notifications:', error)
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
    }

    console.log(`[DELETE /api/notifications] Deleted ${count || notificationIds.length} notification(s) for user ${userId}`)
    return NextResponse.json({ success: true, deletedCount: count || notificationIds.length })
  } catch (error) {
    console.error('Error in DELETE /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





