import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

function canonicalizeWorkroomName(name: string): string {
  return String(name || '').replace(/\s+/g, ' ').trim()
}

function isLTRHazardMessage(messageLower: string): boolean {
  return (
    messageLower.includes('⚠️') &&
    messageLower.includes('ltr') &&
    messageLower.includes('performance is below standard')
  )
}

function parseHazardValueFromMessage(message: string): string | null {
  const idx = message.indexOf('⚠️')
  if (idx === -1) return null
  return message.slice(idx + 2).trim() || null
}

async function computeCurrentLTRHazardDisplayForWorkroom(workroom: string): Promise<{
  isHazard: boolean
  displayValue: string // ex "7.0" or "12.3%" or "N/A"
}> {
  // Must match shared-data behavior used by /api/data and the dashboard.
  const sharedAdminEmail = 'sbiru@fiscorponline.com'
  const sharedAdminUserId = await ensureUserExists(sharedAdminEmail)
  const workroomKey = canonicalizeWorkroomName(workroom).toLowerCase()

  // Pull survey + visual rows for this workroom, then compute the same LTR score/value logic.
  const [surveyRes, visualRes] = await Promise.all([
    supabase
      .from('survey_data')
      .select('workroom_name, ltr_score, data_jsonb')
      .eq('user_id', sharedAdminUserId),
    supabase
      .from('visual_data')
      .select('workroom_name, sales, labor_po, data_jsonb')
      .eq('user_id', sharedAdminUserId),
  ])

  const surveyRows = surveyRes.data || []
  const visualRows = visualRes.data || []

  // Survey avg
  let ltrSum = 0
  let ltrCount = 0
  for (const row of surveyRows as any[]) {
    const name = canonicalizeWorkroomName(row?.data_jsonb?.name ?? row?.workroom_name ?? '')
    if (name.toLowerCase() !== workroomKey) continue
    const raw = row?.data_jsonb?.ltrScore ?? row?.ltr_score
    const val = raw == null ? null : Number(raw)
    if (val == null || Number.isNaN(val)) continue
    ltrSum += val
    ltrCount += 1
  }
  const avgLTRFromSurvey = ltrCount > 0 ? ltrSum / ltrCount : null

  // Visual fallback percent: laborPO / sales * 100
  let salesSum = 0
  let laborSum = 0
  for (const row of visualRows as any[]) {
    const name = canonicalizeWorkroomName(row?.data_jsonb?.name ?? row?.workroom_name ?? '')
    if (name.toLowerCase() !== workroomKey) continue
    const sales = row?.data_jsonb?.sales ?? row?.sales
    const laborPO = row?.data_jsonb?.laborPO ?? row?.labor_po
    if (sales != null && !Number.isNaN(Number(sales))) salesSum += Number(sales)
    if (laborPO != null && !Number.isNaN(Number(laborPO))) laborSum += Number(laborPO)
  }
  const ltrPercent = salesSum > 0 ? (laborSum / salesSum) * 100 : 0

  // Score logic (must match VisualBreakdown / WorkroomNotificationContext)
  let ltrScore = 0
  if (avgLTRFromSurvey != null && avgLTRFromSurvey > 0) {
    ltrScore = avgLTRFromSurvey * 10
  } else if (avgLTRFromSurvey === 0) {
    ltrScore = 0
  } else if (ltrPercent > 0) {
    if (ltrPercent <= 20) ltrScore = 100 - (ltrPercent / 20) * 30
    else if (ltrPercent <= 40) ltrScore = 70 - ((ltrPercent - 20) / 20) * 70
    else ltrScore = 0
  } else {
    ltrScore = 50
  }

  const threshold = 70
  const isHazard = ltrScore < threshold
  const displayValue =
    avgLTRFromSurvey != null
      ? `${avgLTRFromSurvey.toFixed(1)}`
      : ltrPercent > 0
        ? `${ltrPercent.toFixed(1)}%`
        : 'N/A'

  return { isHazard, displayValue }
}

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

    // Normalize incoming hazard messages so we never store legacy formats.
    // This guarantees clients only ever see the newest format.
    const normalizeIncomingMessage = (msg: string): string => {
      const raw = (msg || '').toString().trim()
      const lower = raw.toLowerCase()

      // Old: "Reschedule Rate is above target ⚠️ 27.0%"
      // New: "⚠️ Reschedule Rate: 27.0% is above target"
      if (lower.includes('reschedule rate is above target') && raw.includes('⚠️') && !lower.includes('reschedule rate:')) {
        const m = raw.match(/reschedule rate is above target\s*⚠️\s*([0-9]+(?:\.[0-9]+)?%|n\/a)/i)
        const value = m?.[1] ? m[1].toUpperCase() : ''
        if (value) return `⚠️ Reschedule Rate: ${value} is above target`
      }

      // Accept "correct" Reschedule Rate hazard text even if it doesn't include ⚠️ or uses a different order.
      // Examples:
      // - "Reschedule Rate: 27.0% is above target"
      // - "Reschedule Rate is above target 27.0%"
      // - "reschedule rate above target 27%"
      if (lower.includes('reschedule rate') && lower.includes('above target') && !lower.includes('reschedule rate:')) {
        const m = raw.match(/reschedule rate.*above target\s*⚠️?\s*([0-9]+(?:\.[0-9]+)?%|n\/a)/i)
        const value = m?.[1] ? m[1].toUpperCase() : ''
        if (value) return `⚠️ Reschedule Rate: ${value} is above target`
      }

      if (lower.includes('reschedule rate:') && lower.includes('above target') && !raw.includes('⚠️')) {
        const m = raw.match(/reschedule rate:\s*([0-9]+(?:\.[0-9]+)?%|n\/a)/i)
        const value = m?.[1] ? m[1].toUpperCase() : ''
        if (value) return `⚠️ Reschedule Rate: ${value} is above target`
      }

      // Old: "Work Order Cycle Time exceeds target ⚠️ 26.0d"
      // New: "⚠️ Work Order Cycle Time: 26.0d exceeds target"
      if (
        lower.includes('work order cycle time') &&
        lower.includes('exceeds target') &&
        raw.includes('⚠️') &&
        !raw.trim().startsWith('⚠')
      ) {
        const m = raw.match(/work order cycle time.*exceeds target\s*⚠️\s*([0-9]+(?:\.[0-9]+)?d|n\/a)/i)
        const value = m?.[1] ? m[1].toUpperCase() : ''
        if (value) return `⚠️ Work Order Cycle Time: ${value} exceeds target`
      }

      return raw
    }

    const normalizedMessage = normalizeIncomingMessage(message)

    // Check for duplicate notification (same workroom and similar message)
    // Look at ALL notifications (read and unread) to prevent duplicates
    const messageLower = normalizedMessage.toLowerCase().trim()
    const workroomNormalized = workroom.trim()

    // Server-side guard: prevent stale LTR notifications (e.g., "⚠️ 5.0") from old clients.
    // If this is an LTR hazard message, validate it against current Supabase data.
    if (isLTRHazardMessage(messageLower)) {
      try {
        const incomingValue = parseHazardValueFromMessage(normalizedMessage)
        const current = await computeCurrentLTRHazardDisplayForWorkroom(workroomNormalized)

        // If LTR is not currently hazardous, reject creation/update.
        if (!current.isHazard) {
          console.log(
            `[Notifications API] Rejecting stale LTR notification for ${workroomNormalized}: current LTR is not hazardous (value=${current.displayValue})`
          )
          return NextResponse.json(
            { error: 'Stale LTR notification rejected', stale: true },
            { status: 409 }
          )
        }

        // If the value doesn't match current, reject (stops old clients recreating 5.0)
        if (incomingValue && incomingValue !== current.displayValue) {
          console.log(
            `[Notifications API] Rejecting stale LTR notification for ${workroomNormalized}: incoming=${incomingValue}, current=${current.displayValue}`
          )
          return NextResponse.json(
            { error: 'Stale LTR notification rejected (value mismatch)', stale: true },
            { status: 409 }
          )
        }
      } catch (e) {
        console.warn('[Notifications API] LTR guard failed; allowing request to proceed:', e)
      }
    }
    
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
      // If this is a hazard-format notification (⚠️), keep ONLY ONE per workroom+metric.
      // If the metric matches but the value changed (message differs), UPDATE the existing notification
      // instead of rejecting it as a "duplicate". This prevents stale LTR values like 5.0 hanging around
      // when the current workroom LTR is 7.0, etc.
      const extractMetric = (msg: string): string | null => {
        // Use specific patterns to identify metrics accurately
        if (msg.includes('ltr') && msg.includes('performance is below standard')) return 'ltr'
        if (msg.includes('reschedule rate') && msg.includes('above target')) return 'reschedule_rate'
        if (msg.includes('job cycle time') && msg.includes('exceeds target')) return 'job_cycle_time'
        if (msg.includes('work order cycle time') && (msg.includes('exceeds target') || msg.includes('n/a'))) return 'work_order_cycle_time'
        if (msg.includes('details cycle time') && msg.includes('exceeds target')) return 'details_cycle_time'
        if (msg.includes('vendor debits') && (msg.includes('above target') || msg.includes('ratio is above'))) return 'vendor_debits'
        return null
      }

      // Treat both "⚠️" and "⚠" as hazard-format (different emoji variants)
      if (normalizedMessage.includes('⚠')) {
        const newMetric = extractMetric(messageLower)
        if (newMetric) {
          const match = existingNotifications.find((n) => {
            const existingMessageLower = (n.message || '').toLowerCase().trim()
            const existingMetric = extractMetric(existingMessageLower)
            return existingMetric === newMetric
          })

          if (match) {
            const existingMessageLower = (match.message || '').toLowerCase().trim()

            // Exact match => true duplicate (do not churn DB)
            // Return 200 so callers don't treat "already up-to-date" as a failure.
            if (existingMessageLower === messageLower) {
              console.log(`[Notifications API] Duplicate (exact match) detected: ${newMetric} for ${workroomNormalized}`)
              return NextResponse.json({ duplicate: true, upToDate: true })
            }

            // Same metric but message changed => update in-place (unread)
            const now = new Date().toISOString()
            const { data: updated, error: updateError } = await supabase
              .from('notifications')
              .update({ message: normalizedMessage.trim(), is_read: false, updated_at: now })
              .eq('id', match.id)
              .eq('user_id', userId)
              .select()
              .single()

            if (updateError) {
              console.error('[Notifications API] Error updating existing notification:', updateError)
              return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
            }

            console.log(
              `[Notifications API] Updated ${newMetric} notification for ${workroomNormalized} (id=${match.id})`
            )
            return NextResponse.json({ notification: updated, updated: true })
          }
        }
      }

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
        
        // If hazard-format (contains ⚠), check by metric with precise matching
        if (normalizedMessage.includes('⚠')) {
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
        // Return 200 so callers don't treat duplicates as errors.
        return NextResponse.json({ duplicate: true, upToDate: true })
      }
    }

    // Validate data before creating
    if (!workroomNormalized || !normalizedMessage.trim()) {
      return NextResponse.json({ error: 'Invalid workroom or message' }, { status: 400 })
    }

    // REJECT old format notifications - only accept hazard format with ⚠ (either emoji variant)
    // messageLower is already defined above
    const isOldFormat = messageLower.includes('has high') || 
                       messageLower.includes('has low') || 
                       messageLower.includes('score:') ||
                       messageLower.includes('review ') ||
                       (!normalizedMessage.includes('⚠'))
    
    // For Work Order Cycle Time, only accept heatmap format: ⚠️ at the start
    // Reject any Work Order Cycle Time notification that doesn't start with ⚠️
    if (messageLower.includes('work order cycle time')) {
      if (!normalizedMessage.trim().startsWith('⚠')) {
        console.log(`[Notifications] Rejecting wrong format Work Order Cycle Time notification: ${message.substring(0, 50)}...`)
        return NextResponse.json({ 
          error: 'Work Order Cycle Time notifications must use heatmap format (⚠️ at start).',
          rejected: true
        }, { status: 400 })
      }
    }
    
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
        message: normalizedMessage.trim(),
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

    const referer = request.headers.get('referer') || ''
    const userAgent = request.headers.get('user-agent') || ''
    const deleteIntent = (request.headers.get('x-notification-delete-intent') || '').toLowerCase()

    // Safety guard: only allow deletes for explicit user/system intent.
    // This prevents background/auto-cleanup code from deleting notifications unexpectedly.
    if (deleteIntent !== 'user' && deleteIntent !== 'system') {
      console.warn('[DELETE /api/notifications] Blocked delete without explicit intent header', {
        userEmail,
        referer,
        userAgent,
      })
      return NextResponse.json(
        { error: 'Delete blocked: missing x-notification-delete-intent header' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const deleteAll = body?.deleteAll === true
    const notificationIds = Array.isArray(body?.notificationIds) ? body.notificationIds : []

    if (!deleteAll && notificationIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request - notificationIds array required' }, { status: 400 })
    }

    console.log('[DELETE /api/notifications] Request meta:', {
      userEmail,
      referer,
      userAgent,
      deleteIntent,
      deleteAll,
      count: notificationIds.length,
      sampleIds: notificationIds.slice(0, 5),
    })

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Debug: log what is being deleted (helps track down unexpected auto-deletes)
    try {
      let debugQuery = supabase
        .from('notifications')
        .select('id, workroom, type, message, is_read, created_at')
        .eq('user_id', userId)
        .limit(20)

      if (!deleteAll) {
        debugQuery = debugQuery.in('id', notificationIds)
      }

      const { data: toDelete } = await debugQuery

      if (toDelete && toDelete.length > 0) {
        console.log('[DELETE /api/notifications] Rows:', toDelete.map((n: any) => ({
          id: n.id,
          workroom: n.workroom,
          type: n.type,
          is_read: n.is_read,
          message: (n.message || '').toString().slice(0, 120),
        })))

        // Safety: never auto-delete Reschedule Rate hazard notifications.
        // These were being deleted by client-side code before users could open the dropdown.
        const allowDeleteReschedule = (request.headers.get('x-allow-delete-reschedule') || '').toLowerCase() === 'true'
        const hasRescheduleHazard = toDelete.some((n: any) => {
          const m = (n.message || '').toString().toLowerCase()
          return m.includes('reschedule rate') && m.includes('above target')
        })
        if (hasRescheduleHazard && !allowDeleteReschedule) {
          console.warn('[DELETE /api/notifications] Blocked delete of Reschedule Rate hazard notification(s)')
          return NextResponse.json(
            { error: 'Delete blocked for Reschedule Rate hazard notifications' },
            { status: 403 }
          )
        }
      } else {
        console.log('[DELETE /api/notifications] Rows: (none found for provided ids)')
      }
    } catch (e) {
      console.warn('[DELETE /api/notifications] Failed to fetch rows for debug:', e)
    }

    // Delete notifications - only delete notifications belonging to this user
    let deleteQuery = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (!deleteAll) {
      deleteQuery = deleteQuery.in('id', notificationIds)
    }

    const { error, count } = await deleteQuery

    if (error) {
      console.error('Error deleting notifications:', error)
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
    }

    console.log(
      `[DELETE /api/notifications] Deleted ${count || (deleteAll ? 'all' : notificationIds.length)} notification(s) for user ${userId}`
    )
    return NextResponse.json({ success: true, deletedCount: count || (deleteAll ? null : notificationIds.length) })
  } catch (error) {
    console.error('Error in DELETE /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





