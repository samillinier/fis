import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { DashboardData, WorkroomData } from '@/context/DataContext'

// GET - Fetch all workroom data for a user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('workroom_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      // Return empty data instead of error - let localStorage fallback handle it
      return NextResponse.json({ workrooms: [] }, { status: 200 })
    }

    // Transform database rows to WorkroomData format
    const workrooms: WorkroomData[] = (data || []).map((row) => ({
      id: row.id,
      name: row.workroom_name,
      store: row.store,
      sales: row.sales ? Number(row.sales) : undefined,
      laborPO: row.labor_po ? Number(row.labor_po) : undefined,
      vendorDebit: row.vendor_debit ? Number(row.vendor_debit) : undefined,
      category: row.category,
      cycleTime: row.cycle_time,
      ltrScore: row.ltr_score ? Number(row.ltr_score) : undefined,
      craftScore: row.craft_score ? Number(row.craft_score) : undefined,
      profScore: row.prof_score ? Number(row.prof_score) : undefined,
      surveyDate: row.survey_date,
      surveyComment: row.survey_comment,
      laborCategory: row.labor_category,
      reliableHomeImprovementScore: row.reliable_home_improvement_score
        ? Number(row.reliable_home_improvement_score)
        : undefined,
      timeTakenToComplete: row.time_taken_to_complete,
      projectValueScore: row.project_value_score ? Number(row.project_value_score) : undefined,
      installerKnowledgeScore: row.installer_knowledge_score
        ? Number(row.installer_knowledge_score)
        : undefined,
    }))

    return NextResponse.json({ workrooms } as DashboardData)
  } catch (error: any) {
    console.error('API error:', error)
    // Return error as JSON to prevent page crashes
    return NextResponse.json({ 
      error: error?.message || 'Internal server error',
      workrooms: [] // Return empty array so app doesn't crash
    }, { status: 500 })
  }
}

// POST - Save workroom data
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    const body: DashboardData = await request.json()

    if (!body.workrooms || !Array.isArray(body.workrooms)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete existing data for this user
    await supabase.from('workroom_data').delete().eq('user_id', userId)

    // Insert new data
    const rowsToInsert = body.workrooms.map((workroom) => ({
      user_id: userId,
      workroom_name: workroom.name || '',
      store: workroom.store ? String(workroom.store) : null,
      sales: workroom.sales || null,
      labor_po: workroom.laborPO || null,
      vendor_debit: workroom.vendorDebit || null,
      category: workroom.category || null,
      cycle_time: workroom.cycleTime || null,
      ltr_score: workroom.ltrScore || null,
      craft_score: workroom.craftScore || null,
      prof_score: workroom.profScore || null,
      survey_date: workroom.surveyDate || null,
      survey_comment: workroom.surveyComment || null,
      labor_category: workroom.laborCategory || null,
      reliable_home_improvement_score: workroom.reliableHomeImprovementScore || null,
      time_taken_to_complete: workroom.timeTakenToComplete || null,
      project_value_score: workroom.projectValueScore || null,
      installer_knowledge_score: workroom.installerKnowledgeScore || null,
    }))

    const { error } = await supabase.from('workroom_data').insert(rowsToInsert)

    if (error) {
      console.error('Database error:', error)
      // Provide more helpful error messages
      let errorMessage = error.message || 'Database error'
      if (error.message?.includes('requested path is invalid') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        errorMessage = 'Database tables not found. Please run the database schema SQL in Supabase SQL Editor. See database/schema.sql file.'
      }
      return NextResponse.json({ 
        error: errorMessage,
        hint: 'Run database/schema.sql in Supabase SQL Editor to create the required tables'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: rowsToInsert.length })
  } catch (error: any) {
    console.error('API error:', error)
    // Return error as JSON to prevent page crashes
    return NextResponse.json({ 
      error: error?.message || 'Internal server error',
      workrooms: [] // Return empty array so app doesn't crash
    }, { status: 500 })
  }
}

// DELETE - Clear all data for a user
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    const supabase = createServerClient()

    const { error } = await supabase.from('workroom_data').delete().eq('user_id', userId)

    if (error) {
      console.error('Database error:', error)
      // Provide more helpful error messages
      let errorMessage = error.message || 'Database error'
      if (error.message?.includes('requested path is invalid') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        errorMessage = 'Database tables not found. Please run the database schema SQL in Supabase SQL Editor. See database/schema.sql file.'
      }
      return NextResponse.json({ 
        error: errorMessage,
        hint: 'Run database/schema.sql in Supabase SQL Editor to create the required tables'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    // Return error as JSON to prevent page crashes
    return NextResponse.json({ 
      error: error?.message || 'Internal server error',
      workrooms: [] // Return empty array so app doesn't crash
    }, { status: 500 })
  }
}

