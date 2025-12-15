import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

// Force dynamic rendering - no caching at edge/CDN level
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const SUPER_ADMIN_EMAIL = 'sbiru@fiscorponline.com'

function normalizeEmail(email?: string): string | null {
  if (!email) return null
  return email.trim().toLowerCase()
}

// GET - List all form submissions (all for admins, own for regular users)
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

    console.log(`[performance-forms/list] Fetching submissions for user: ${userEmail}`)

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      console.error(`[performance-forms/list] User not found: ${userEmail}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`[performance-forms/list] User ID: ${userId}`)

    // Check if user is admin
    const normalizedEmail = normalizeEmail(userEmail)
    const isSuperAdmin = normalizedEmail === normalizeEmail(SUPER_ADMIN_EMAIL)
    
    let isAdmin = isSuperAdmin
    if (!isSuperAdmin) {
      // Check authorized_users table for admin role
      const { data: authUser } = await supabase
        .from('authorized_users')
        .select('role, is_active')
        .eq('email', normalizedEmail)
        .single()
      
      isAdmin = authUser?.role === 'admin' && authUser?.is_active !== false
    }

    console.log(`[performance-forms/list] Is admin: ${isAdmin}`)

    // First, check if table exists and get diagnostic info
    const { data: allSubmissions, error: tableError } = await supabase
      .from('performance_forms')
      .select('id, user_id, workroom, metric_type, submitted_at')
      .order('submitted_at', { ascending: false })
      .limit(100)

    if (tableError) {
      console.error('[performance-forms/list] Table access error:', tableError)
      // Check if it's a "does not exist" error
      if (tableError.message?.includes('does not exist') || tableError.code === '42P01') {
      const errorResponse = NextResponse.json({ 
        error: 'Database table not found. Please run database/setup-performance-forms-complete.sql in Supabase SQL Editor.',
        submissions: [],
        count: 0
      }, { status: 500 })
      errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      return errorResponse
      }
      const errorResponse = NextResponse.json({ 
        error: `Database error: ${tableError.message}`,
        submissions: [],
        count: 0
      }, { status: 500 })
      errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      return errorResponse
    }

    // Diagnostic: Check what user_ids exist in the table
    const uniqueUserIds = Array.from(new Set(allSubmissions?.map(s => s.user_id) || []))
    const totalCount = allSubmissions?.length || 0
    const uniqueWorkrooms = Array.from(new Set(allSubmissions?.map(s => s.workroom) || []))
    console.log(`[performance-forms/list] Total submissions in table: ${totalCount}`)
    console.log(`[performance-forms/list] Unique user_ids in table:`, uniqueUserIds)
    console.log(`[performance-forms/list] Unique workrooms in table:`, uniqueWorkrooms)
    console.log(`[performance-forms/list] Current user_id: ${userId}`)
    console.log(`[performance-forms/list] User_id match: ${uniqueUserIds.includes(userId)}`)
    console.log(`[performance-forms/list] All submissions in table:`, allSubmissions?.map(s => ({ id: s.id, workroom: s.workroom, user_id: s.user_id })))

    // Fetch form submissions - all for admins, only own for regular users
    let query = supabase
      .from('performance_forms')
      .select('*')
    
    if (!isAdmin) {
      // Non-admins only see their own submissions
      query = query.eq('user_id', userId)
    }
    // Admins see all submissions (no filter)
    
    const { data, error } = await query.order('submitted_at', { ascending: false })

    if (error) {
      console.error('[performance-forms/list] Error fetching form submissions:', error)
      const errorResponse = NextResponse.json({ 
        error: `Failed to fetch submissions: ${error.message}`,
        submissions: [],
        count: 0
      }, { status: 500 })
      errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      return errorResponse
    }

    // Remove duplicates by ID (in case of any data issues)
    const uniqueSubmissions = (data || []).filter((submission, index, self) => 
      index === self.findIndex(s => s.id === submission.id)
    )

    console.log(`[performance-forms/list] Found ${data?.length || 0} raw submissions, ${uniqueSubmissions.length} unique (admin: ${isAdmin})`)
    if (data && data.length !== uniqueSubmissions.length) {
      console.warn(`[performance-forms/list] ⚠️ Duplicate submissions detected! Raw: ${data.length}, Unique: ${uniqueSubmissions.length}`)
      console.log(`[performance-forms/list] Duplicate IDs:`, data.map(s => s.id))
    }
    
    // Debug: Log all submission IDs to help identify duplicates
    if (data && data.length > 0) {
      console.log(`[performance-forms/list] Submission IDs from database:`, data.map(s => ({ id: s.id, workroom: s.workroom, metric_type: s.metric_type, user_id: s.user_id, submitted_at: s.submitted_at })))
      console.log(`[performance-forms/list] Workrooms in response:`, Array.from(new Set(data.map(s => s.workroom))))
      console.log(`[performance-forms/list] User IDs in response:`, Array.from(new Set(data.map(s => s.user_id))))
    } else {
      console.log(`[performance-forms/list] No submissions found in database for ${isAdmin ? 'admin' : 'user'}`)
    }

    // If no submissions found but there are submissions in the table, provide helpful message (only for non-admins)
    if (!isAdmin && (data?.length || 0) === 0 && totalCount > 0) {
      console.warn(`[performance-forms/list] No submissions found for user ${userId}, but ${totalCount} total submissions exist with different user_ids`)
      const diagnosticResponse = NextResponse.json({ 
        submissions: [],
        count: 0,
        diagnostic: {
          message: `No submissions found for your account. Found ${totalCount} total submission(s) in database with different user account(s).`,
          totalSubmissionsInTable: totalCount,
          yourUserId: userId,
          otherUserIds: uniqueUserIds.filter(id => id !== userId)
        }
      })
      diagnosticResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      return diagnosticResponse
    }

    const response = NextResponse.json({ 
      submissions: uniqueSubmissions,
      count: uniqueSubmissions.length,
      timestamp: new Date().toISOString(), // Add timestamp to help debug caching
      workrooms: Array.from(new Set(uniqueSubmissions.map(s => s.workroom))) // Include workrooms in response for debugging
    })
    
    // Aggressive cache prevention for production/CDN
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Accel-Expires', '0') // Nginx cache control
    response.headers.set('CDN-Cache-Control', 'no-store') // CDN cache control
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store') // Vercel-specific
    
    return response
  } catch (error: any) {
    console.error('[performance-forms/list] Unexpected error:', error)
    const errorResponse = NextResponse.json({ 
      error: `Internal server error: ${error?.message || 'Unknown error'}`,
      submissions: [],
      count: 0
    }, { status: 500 })
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return errorResponse
  }
}

