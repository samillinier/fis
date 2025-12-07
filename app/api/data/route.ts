// API Route - Supabase
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'
import type { DashboardData, WorkroomData } from '@/context/DataContext'

// GET - Fetch all workroom data for a user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    // Fetch workroom data
    const { data, error } = await supabase
      .from('workroom_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
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
    return NextResponse.json({ 
      error: error?.message || 'Internal server error',
      workrooms: []
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

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const body: DashboardData = await request.json()

    if (!body.workrooms || !Array.isArray(body.workrooms)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    // Delete existing data for this user
    const { error: deleteError } = await supabase
      .from('workroom_data')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      throw deleteError
    }

    // Insert new data
    if (body.workrooms.length > 0) {
      const workroomsToInsert = body.workrooms.map((workroom) => {
        // Convert Date to string if it's a Date object
        let surveyDate: string | null = null
        if (workroom.surveyDate) {
          if (workroom.surveyDate instanceof Date) {
            surveyDate = workroom.surveyDate.toISOString().split('T')[0] // YYYY-MM-DD format
          } else if (typeof workroom.surveyDate === 'string') {
            surveyDate = workroom.surveyDate
          }
        }

        return {
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
          survey_date: surveyDate,
          survey_comment: workroom.surveyComment || null,
          labor_category: workroom.laborCategory || null,
          reliable_home_improvement_score: workroom.reliableHomeImprovementScore || null,
          time_taken_to_complete: workroom.timeTakenToComplete || null,
          project_value_score: workroom.projectValueScore || null,
          installer_knowledge_score: workroom.installerKnowledgeScore || null,
        }
      })

      const { error: insertError } = await supabase
        .from('workroom_data')
        .insert(workroomsToInsert)

      if (insertError) {
        throw insertError
      }
    }

    return NextResponse.json({ success: true, count: body.workrooms.length })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error'
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

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    const { error } = await supabase
      .from('workroom_data')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error'
    }, { status: 500 })
  }
}
