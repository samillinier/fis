// API Route - Vercel Postgres
import { NextRequest, NextResponse } from 'next/server'
import { sql, ensureUserExists } from '@/lib/vercel-postgres'
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
    const result = await sql`
      SELECT * FROM workroom_data 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    // Transform database rows to WorkroomData format
    const workrooms: WorkroomData[] = result.rows.map((row) => ({
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
    await sql`
      DELETE FROM workroom_data WHERE user_id = ${userId}
    `

    // Insert new data (insert one by one due to SQL template limitations)
    if (body.workrooms.length > 0) {
      for (const workroom of body.workrooms) {
        // Convert Date to string if it's a Date object
        let surveyDate: string | null = null
        if (workroom.surveyDate) {
          if (workroom.surveyDate instanceof Date) {
            surveyDate = workroom.surveyDate.toISOString().split('T')[0] // YYYY-MM-DD format
          } else if (typeof workroom.surveyDate === 'string') {
            surveyDate = workroom.surveyDate
          }
        }

        await sql`
          INSERT INTO workroom_data (
            user_id, workroom_name, store, sales, labor_po, vendor_debit, category, cycle_time,
            ltr_score, craft_score, prof_score, survey_date, survey_comment, labor_category,
            reliable_home_improvement_score, time_taken_to_complete, project_value_score,
            installer_knowledge_score
          ) VALUES (
            ${userId}, ${workroom.name || ''}, ${workroom.store ? String(workroom.store) : null},
            ${workroom.sales || null}, ${workroom.laborPO || null}, ${workroom.vendorDebit || null},
            ${workroom.category || null}, ${workroom.cycleTime || null},
            ${workroom.ltrScore || null}, ${workroom.craftScore || null}, ${workroom.profScore || null},
            ${surveyDate}, ${workroom.surveyComment || null},
            ${workroom.laborCategory || null}, ${workroom.reliableHomeImprovementScore || null},
            ${workroom.timeTakenToComplete || null}, ${workroom.projectValueScore || null},
            ${workroom.installerKnowledgeScore || null}
          )
        `
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

    await sql`
      DELETE FROM workroom_data WHERE user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error'
    }, { status: 500 })
  }
}
