import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function ensureUserExists(email: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (existing) return existing.id

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase() })
    .select('id')
    .single()

  if (error || !newUser) return null
  return newUser.id
}

async function getSharedAdminUserId(): Promise<string> {
  const sharedAdminEmail = 'sbiru@fiscorponline.com'
  return await ensureUserExists(sharedAdminEmail) || ''
}

// GET - Verify workroom data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workroomName = searchParams.get('workroom') || 'Tallahassee'

    const sharedAdminUserId = await getSharedAdminUserId()
    
    // Get all visual data for the workroom
    const { data: visualData, error: visualError } = await supabase
      .from('visual_data')
      .select('*, data_jsonb')
      .eq('user_id', sharedAdminUserId)
      .ilike('workroom_name', `%${workroomName}%`)
      .order('created_at', { ascending: false })

    // Get all survey data for the workroom
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_data')
      .select('*, data_jsonb')
      .eq('user_id', sharedAdminUserId)
      .ilike('workroom_name', `%${workroomName}%`)
      .order('created_at', { ascending: false })

    if (visualError) {
      console.error('Error fetching visual data:', visualError)
    }
    if (surveyError) {
      console.error('Error fetching survey data:', surveyError)
    }

    // Extract key metrics from visual data
    const visualRecords = (visualData || []).map(row => {
      const jsonb = row.data_jsonb || {}
      return {
        id: row.id,
        workroom_name: row.workroom_name,
        store: row.store,
        sales: row.sales,
        labor_po: row.labor_po,
        vendor_debit: row.vendor_debit,
        cycle_time: row.cycle_time,
        // From data_jsonb
        cycleTime: jsonb.cycleTime,
        jobsWorkCycleTime: jsonb.jobsWorkCycleTime,
        totalWorkOrderCycleTime: jsonb.totalWorkOrderCycleTime,
        detailsCycleTime: jsonb.detailsCycleTime,
        rescheduleRate: jsonb.rescheduleRate,
        created_at: row.created_at,
      }
    })

    // Extract key metrics from survey data
    const surveyRecords = (surveyData || []).map(row => {
      const jsonb = row.data_jsonb || {}
      return {
        id: row.id,
        workroom_name: row.workroom_name,
        store: row.store,
        ltr_score: row.ltr_score,
        craft_score: row.craft_score,
        prof_score: row.prof_score,
        // From data_jsonb
        ltrScore: jsonb.ltrScore,
        craftScore: jsonb.craftScore,
        profScore: jsonb.profScore,
        created_at: row.created_at,
      }
    })

    // Aggregate summary
    const summary = {
      workroom: workroomName,
      visual_records_count: visualRecords.length,
      survey_records_count: surveyRecords.length,
      cycle_time_values: visualRecords
        .map(r => r.cycleTime || r.cycle_time)
        .filter(v => v != null && v > 0),
      jobs_work_cycle_time_values: visualRecords
        .map(r => r.jobsWorkCycleTime)
        .filter(v => v != null && v > 0),
      work_order_cycle_time_values: visualRecords
        .map(r => r.totalWorkOrderCycleTime)
        .filter(v => v != null && v > 0),
      details_cycle_time_values: visualRecords
        .map(r => r.detailsCycleTime)
        .filter(v => v != null && v > 0),
      reschedule_rate_values: visualRecords
        .map(r => r.rescheduleRate)
        .filter(v => v != null && !isNaN(Number(v))),
      ltr_scores: surveyRecords
        .map(r => r.ltrScore || r.ltr_score)
        .filter(v => v != null && v > 0),
      stores: Array.from(new Set(visualRecords.map(r => r.store).filter(Boolean))),
    }

    return NextResponse.json({
      summary,
      visual_records: visualRecords.slice(0, 10), // First 10 records
      survey_records: surveyRecords.slice(0, 10), // First 10 records
      total_visual_records: visualRecords.length,
      total_survey_records: surveyRecords.length,
    })
  } catch (error: any) {
    console.error('Error in verify-workroom API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
