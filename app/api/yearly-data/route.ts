// API Route - Supabase (Yearly Breakdown data)
// SHARED DATA MODEL - All users see the same data uploaded by any admin, partitioned by year.
import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSharedAdminUserId } from '@/lib/supabase'
import type { DashboardData, WorkroomData } from '@/context/DataContext'

function parseYear(request: NextRequest): number | null {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('year')
  if (!raw) return null
  const year = Number(raw)
  if (!Number.isFinite(year) || year < 2000 || year > 3000) return null
  return year
}

// GET - Fetch SHARED yearly data for given year
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const year = parseYear(request)
    if (!year) {
      return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const sharedAdminUserId = await getSharedAdminUserId()

    const [visualResult, surveyResult, metadataResult] = await Promise.all([
      supabase
        .from('yearly_visual_data')
        .select('*, data_jsonb')
        .eq('user_id', sharedAdminUserId)
        .eq('year', year)
        .order('created_at', { ascending: false }),
      supabase
        .from('yearly_survey_data')
        .select('*, data_jsonb')
        .eq('user_id', sharedAdminUserId)
        .eq('year', year)
        .order('created_at', { ascending: false }),
      supabase
        .from('yearly_dashboard_metadata')
        .select('*')
        .eq('user_id', sharedAdminUserId)
        .eq('year', year)
        .maybeSingle(),
    ])

    const missingYearlyTables =
      (visualResult.error &&
        (visualResult.error.code === 'PGRST205' ||
          visualResult.error.message?.includes('Could not find the table') ||
          visualResult.error.message?.includes('does not exist'))) ||
      (surveyResult.error &&
        (surveyResult.error.code === 'PGRST205' ||
          surveyResult.error.message?.includes('Could not find the table') ||
          surveyResult.error.message?.includes('does not exist')))

    // Helpful migration hints if tables not present
    if (missingYearlyTables) {
      return NextResponse.json(
        {
          error:
            'Database tables not found. Please run the migration: database/yearly-breakdown-tables.sql',
          workrooms: [],
        } as DashboardData,
        { status: 500 }
      )
    }

    if (visualResult.error) console.error('❌ Error fetching yearly visual data:', visualResult.error)
    if (surveyResult.error) console.error('❌ Error fetching yearly survey data:', surveyResult.error)

    const visualRows = visualResult.data || []
    const surveyRows = surveyResult.data || []
    const metadata = metadataResult.data

    const visualWorkrooms: WorkroomData[] = visualRows.map((row: any) => {
      if (row.data_jsonb && typeof row.data_jsonb === 'object') {
        return { id: row.id, ...row.data_jsonb } as WorkroomData
      }
      return {
        id: row.id,
        name: row.workroom_name || '',
        store: row.store,
        sales: row.sales ? Number(row.sales) : undefined,
        laborPO: row.labor_po ? Number(row.labor_po) : undefined,
        vendorDebit: row.vendor_debit ? Number(row.vendor_debit) : undefined,
        category: row.category,
        cycleTime: row.cycle_time,
      } as WorkroomData
    })

    const surveyWorkrooms: WorkroomData[] = surveyRows.map((row: any) => {
      if (row.data_jsonb && typeof row.data_jsonb === 'object') {
        return { id: row.id, ...row.data_jsonb } as WorkroomData
      }
      return {
        id: row.id,
        name: row.workroom_name || '',
        store: row.store,
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
      } as WorkroomData
    })

    const allWorkrooms = [...visualWorkrooms, ...surveyWorkrooms]

    const dashboardMetadata: Partial<DashboardData> = {}
    if (metadata) {
      if (metadata.raw_column_l_values) dashboardMetadata.rawColumnLValues = metadata.raw_column_l_values as number[]
      if (metadata.raw_craft_values) dashboardMetadata.rawCraftValues = metadata.raw_craft_values as number[]
      if (metadata.raw_prof_values) dashboardMetadata.rawProfValues = metadata.raw_prof_values as number[]
      if (metadata.raw_labor_categories) dashboardMetadata.rawLaborCategories = metadata.raw_labor_categories as string[]
      if (metadata.raw_company_values) dashboardMetadata.rawCompanyValues = metadata.raw_company_values as string[]
      if (metadata.raw_installer_names) dashboardMetadata.rawInstallerNames = metadata.raw_installer_names as string[]
      if (metadata.excel_file_total_rows) dashboardMetadata.excelFileTotalRows = metadata.excel_file_total_rows
    }

    return NextResponse.json({
      workrooms: allWorkrooms,
      ...dashboardMetadata,
    } as DashboardData)
  } catch (error: any) {
    console.error('❌ API GET /api/yearly-data error:', error)
    return NextResponse.json({ workrooms: [] } as DashboardData, { status: 500 })
  }
}

// POST - Save yearly data for given year (admin only). Complete replacement for that year.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const year = parseYear(request)
    if (!year) {
      return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Admin check (same as main route)
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()
    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can upload yearly data' },
        { status: 403 }
      )
    }

    const body: DashboardData = await request.json()
    if (!body.workrooms || !Array.isArray(body.workrooms)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const userId = await getSharedAdminUserId()

    const visualData: WorkroomData[] = []
    const surveyData: WorkroomData[] = []

    body.workrooms.forEach((workroom) => {
      const isVisual = workroom.sales != null || workroom.laborPO != null || workroom.vendorDebit != null
      const isSurvey = workroom.ltrScore != null || workroom.craftScore != null || workroom.profScore != null
      if (isVisual && !isSurvey) visualData.push(workroom)
      else if (isSurvey) surveyData.push(workroom)
      else visualData.push(workroom)
    })

    // Delete existing for this year only
    const [delVisual, delSurvey, delMeta] = await Promise.all([
      supabase.from('yearly_visual_data').delete().eq('user_id', userId).eq('year', year),
      supabase.from('yearly_survey_data').delete().eq('user_id', userId).eq('year', year),
      supabase.from('yearly_dashboard_metadata').delete().eq('user_id', userId).eq('year', year),
    ])

    const missingYearlyTables =
      (delVisual.error &&
        (delVisual.error.code === 'PGRST205' ||
          delVisual.error.message?.includes('Could not find the table') ||
          delVisual.error.message?.includes('does not exist'))) ||
      (delSurvey.error &&
        (delSurvey.error.code === 'PGRST205' ||
          delSurvey.error.message?.includes('Could not find the table') ||
          delSurvey.error.message?.includes('does not exist')))

    if (missingYearlyTables) {
      return NextResponse.json(
        {
          error:
            'Database tables not found. Please run the migration: database/yearly-breakdown-tables.sql',
        },
        { status: 500 }
      )
    }
    if (delVisual.error) {
      return NextResponse.json({ error: delVisual.error.message }, { status: 500 })
    }
    if (delSurvey.error) {
      return NextResponse.json({ error: delSurvey.error.message }, { status: 500 })
    }
    if (delMeta.error) {
      // non-fatal, but log
      console.warn('⚠️ Yearly metadata delete error:', delMeta.error)
    }

    // Insert visual
    if (visualData.length > 0) {
      const visualToInsert = visualData
        .map((workroom) => {
          const { id, ...workroomDataForJson } = workroom
          const cleanData: any = { ...workroomDataForJson }
          if (cleanData.surveyDate instanceof Date) cleanData.surveyDate = cleanData.surveyDate.toISOString()

          return {
            user_id: userId,
            year,
            workroom_name: workroom.name || '',
            store: workroom.store ? String(workroom.store) : null,
            sales: workroom.sales ?? null,
            labor_po: workroom.laborPO ?? null,
            vendor_debit: workroom.vendorDebit ?? null,
            category: workroom.category ?? null,
            cycle_time: workroom.cycleTime != null ? Number(workroom.cycleTime) : null,
            data_jsonb: cleanData,
          }
        })
        .filter((r) => !!r.data_jsonb)

      const { error: visualError } = await supabase.from('yearly_visual_data').insert(visualToInsert)
      if (visualError) return NextResponse.json({ error: visualError.message }, { status: 500 })
    }

    // Insert survey
    if (surveyData.length > 0) {
      const surveyToInsert = surveyData
        .map((workroom) => {
          const { id, ...workroomDataForJson } = workroom
          const cleanData: any = { ...workroomDataForJson }
          if (cleanData.surveyDate instanceof Date) cleanData.surveyDate = cleanData.surveyDate.toISOString()

          let surveyDate: string | null = null
          if (workroom.surveyDate) {
            if (workroom.surveyDate instanceof Date) surveyDate = workroom.surveyDate.toISOString().split('T')[0]
            else if (typeof workroom.surveyDate === 'string') surveyDate = workroom.surveyDate
          }

          return {
            user_id: userId,
            year,
            workroom_name: workroom.name || '',
            store: workroom.store ? String(workroom.store) : null,
            ltr_score: workroom.ltrScore ?? null,
            craft_score: workroom.craftScore ?? null,
            prof_score: workroom.profScore ?? null,
            survey_date: surveyDate,
            survey_comment: workroom.surveyComment ?? null,
            labor_category: workroom.laborCategory ?? null,
            reliable_home_improvement_score: workroom.reliableHomeImprovementScore ?? null,
            time_taken_to_complete: workroom.timeTakenToComplete ?? null,
            project_value_score: workroom.projectValueScore ?? null,
            installer_knowledge_score: workroom.installerKnowledgeScore ?? null,
            data_jsonb: cleanData,
          }
        })
        .filter((r) => !!r.data_jsonb)

      const { error: surveyError } = await supabase.from('yearly_survey_data').insert(surveyToInsert)
      if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 500 })
    }

    // Upsert yearly metadata
    if (
      body.rawColumnLValues ||
      body.rawCraftValues ||
      body.rawProfValues ||
      body.rawLaborCategories ||
      body.rawCompanyValues ||
      body.rawInstallerNames ||
      body.excelFileTotalRows
    ) {
      const { error: metadataError } = await supabase.from('yearly_dashboard_metadata').upsert(
        {
          user_id: userId,
          year,
          raw_column_l_values: body.rawColumnLValues || null,
          raw_craft_values: body.rawCraftValues || null,
          raw_prof_values: body.rawProfValues || null,
          raw_labor_categories: body.rawLaborCategories || null,
          raw_company_values: body.rawCompanyValues || null,
          raw_installer_names: body.rawInstallerNames || null,
          excel_file_total_rows: body.excelFileTotalRows || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,year' }
      )
      if (metadataError) console.warn('⚠️ Error saving yearly metadata:', metadataError)
    }

    return NextResponse.json({
      success: true,
      year,
      visualCount: visualData.length,
      surveyCount: surveyData.length,
      count: body.workrooms.length,
    })
  } catch (error: any) {
    console.error('❌ API POST /api/yearly-data error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Clear yearly data for given year (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const year = parseYear(request)
    if (!year) return NextResponse.json({ error: 'Missing or invalid year' }, { status: 400 })

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) return NextResponse.json({ error: 'Invalid user' }, { status: 401 })

    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()
    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can clear yearly data' },
        { status: 403 }
      )
    }

    const userId = await getSharedAdminUserId()
    const [delVisual, delSurvey, delMeta] = await Promise.all([
      supabase.from('yearly_visual_data').delete().eq('user_id', userId).eq('year', year),
      supabase.from('yearly_survey_data').delete().eq('user_id', userId).eq('year', year),
      supabase.from('yearly_dashboard_metadata').delete().eq('user_id', userId).eq('year', year),
    ])

    const missingYearlyTables =
      (delVisual.error &&
        (delVisual.error.code === 'PGRST205' ||
          delVisual.error.message?.includes('Could not find the table') ||
          delVisual.error.message?.includes('does not exist'))) ||
      (delSurvey.error &&
        (delSurvey.error.code === 'PGRST205' ||
          delSurvey.error.message?.includes('Could not find the table') ||
          delSurvey.error.message?.includes('does not exist')))

    if (missingYearlyTables) {
      return NextResponse.json(
        {
          error:
            'Database tables not found. Please run the migration: database/yearly-breakdown-tables.sql',
        },
        { status: 500 }
      )
    }

    if (delVisual.error) return NextResponse.json({ error: delVisual.error.message }, { status: 500 })
    if (delSurvey.error) return NextResponse.json({ error: delSurvey.error.message }, { status: 500 })
    if (delMeta.error) console.warn('⚠️ Yearly metadata delete error:', delMeta.error)

    return NextResponse.json({ success: true, year })
  } catch (error: any) {
    console.error('❌ API DELETE /api/yearly-data error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

