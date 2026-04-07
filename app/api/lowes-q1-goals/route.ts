import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch Q1 goals for all districts or a specific district
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const district = searchParams.get('district')
    const week = searchParams.get('week')

    let query = supabase
      .from('lowes_q1_goals')
      .select('*')
      .order('district', { ascending: true })
      .order('week_number', { ascending: true })
      .order('category', { ascending: true })

    if (district) {
      query = query.eq('district', district)
    }

    if (week) {
      query = query.eq('week_number', parseInt(week))
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching Q1 goals:', error)
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    return NextResponse.json({ goals: data || [] })
  } catch (error) {
    console.error('Error in GET /api/lowes-q1-goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Upload Q1 goals from Excel file (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Check if user is admin
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can upload goals' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { goals } = body

    if (!goals || !Array.isArray(goals)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    console.log(`📥 [POST /api/lowes-q1-goals] Received ${goals.length} goals from ${userEmail}`)

    // Check if table exists first by trying a simple query
    const { error: tableError } = await supabase
      .from('lowes_q1_goals')
      .select('id')
      .limit(1)

    if (tableError) {
      // Check if it's a "table doesn't exist" error
      const isTableMissing = tableError.code === '42P01' || 
                             tableError.code === 'PGRST116' ||
                             tableError.message?.includes('does not exist') ||
                             tableError.message?.includes('relation') ||
                             tableError.message?.toLowerCase().includes('no such table')
      
      if (isTableMissing) {
        console.error('Table does not exist:', tableError)
        return NextResponse.json({
          error: 'Database table not found',
          details: 'The lowes_q1_goals table does not exist. Please run database/lowes-q1-goals-schema.sql in Supabase SQL Editor.',
          hint: 'Run the SQL migration file to create the required tables.',
          code: tableError.code
        }, { status: 500 })
      }
      // If it's a different error (like RLS or permissions), log it but continue
      console.warn('Table check warning (continuing anyway):', tableError)
    }

    // Validate goals data
    const validatedGoals = goals.map((goal: any) => {
      // Normalize district: remove "District" prefix if present
      let district = String(goal.district || '').trim()
      district = district.replace(/^district\s*/i, '').trim()
      
      return {
        district: district,
        provider: goal.provider ? String(goal.provider).trim() : null,
        week_number: parseInt(String(goal.week_number)) || 0,
        category: String(goal.category || '').toUpperCase().trim(),
        planned_count: parseInt(String(goal.planned_count)) || 0,
        comparable_count: parseInt(String(goal.comparable_count || 0)) || 0
      }
    }).filter((goal: any) => {
      // Filter out invalid records
      return goal.district && 
             goal.week_number >= 1 && goal.week_number <= 13 &&
             ['CARPET', 'HSF', 'TILE', 'TOTAL'].includes(goal.category) &&
             goal.planned_count > 0
    })

    console.log(`✅ [POST /api/lowes-q1-goals] Validated ${validatedGoals.length} goals (filtered from ${goals.length} total)`)

    if (validatedGoals.length === 0) {
      console.error('❌ [POST /api/lowes-q1-goals] No valid goals after validation')
      return NextResponse.json({
        error: 'No valid goals to save',
        details: 'All goals were filtered out. Please check that the Excel file has valid district numbers, week numbers (1-13), and categories (CARPET, HSF, TILE, TOTAL).'
      }, { status: 400 })
    }

    // Delete existing goals first (to allow re-upload)
    // Delete all rows by using a condition that always matches
    const { error: deleteError } = await supabase
      .from('lowes_q1_goals')
      .delete()
      .gte('week_number', 1) // Delete all (week_number is always >= 1)

    if (deleteError) {
      console.error('Error deleting existing goals:', deleteError)
      // Continue anyway - might be first upload or table might be empty
    }

    // Insert new goals in batches to avoid potential size limits
    const batchSize = 1000
    const insertedGoals: any[] = []
    let lastError: any = null

    for (let i = 0; i < validatedGoals.length; i += batchSize) {
      const batch = validatedGoals.slice(i, i + batchSize)
      const { data: batchData, error: insertError } = await supabase
        .from('lowes_q1_goals')
        .insert(batch)
        .select()

      if (insertError) {
        console.error('Error inserting goals batch:', insertError)
        lastError = insertError
        // Continue with other batches
      } else if (batchData) {
        insertedGoals.push(...batchData)
      }
    }

    if (lastError && insertedGoals.length === 0) {
      // All batches failed
      console.error('❌ [POST /api/lowes-q1-goals] All batches failed:', lastError)
      return NextResponse.json({
        error: 'Failed to save goals',
        details: lastError.message || 'Database error occurred',
        code: lastError.code,
        hint: lastError.hint || 'Check that all required fields are valid and the table schema is correct.'
      }, { status: 500 })
    }

    if (lastError) {
      console.warn('⚠️ [POST /api/lowes-q1-goals] Some batches failed, but some succeeded:', lastError)
    }

    console.log(`✅ [POST /api/lowes-q1-goals] Successfully saved ${insertedGoals.length} goal records`)

    return NextResponse.json({
      success: true,
      count: insertedGoals?.length || 0,
      message: `Successfully uploaded ${insertedGoals?.length || 0} goal records`
    })
  } catch (error) {
    console.error('Error in POST /api/lowes-q1-goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
