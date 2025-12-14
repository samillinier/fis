import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - List all form submissions for the user
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

    // First, check if table exists by trying a simple query
    const { data: tableCheck, error: tableError } = await supabase
      .from('performance_forms')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('[performance-forms/list] Table access error:', tableError)
      // Check if it's a "does not exist" error
      if (tableError.message?.includes('does not exist') || tableError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Database table not found. Please run database/setup-performance-forms-complete.sql in Supabase SQL Editor.',
          submissions: [],
          count: 0
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: `Database error: ${tableError.message}`,
        submissions: [],
        count: 0
      }, { status: 500 })
    }

    // Fetch all form submissions for this user
    const { data, error } = await supabase
      .from('performance_forms')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('[performance-forms/list] Error fetching form submissions:', error)
      return NextResponse.json({ 
        error: `Failed to fetch submissions: ${error.message}`,
        submissions: [],
        count: 0
      }, { status: 500 })
    }

    console.log(`[performance-forms/list] Found ${data?.length || 0} submissions for user ${userId}`)

    return NextResponse.json({ 
      submissions: data || [],
      count: data?.length || 0
    })
  } catch (error: any) {
    console.error('[performance-forms/list] Unexpected error:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error?.message || 'Unknown error'}`,
      submissions: [],
      count: 0
    }, { status: 500 })
  }
}

