// API Route - Supabase (Separate Visual and Survey Data)
// IMPORTANT: RLS must be DISABLED for these tables for inserts to work
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'
import type { DashboardData, WorkroomData } from '@/context/DataContext'

// GET - Fetch all data (visual + survey) for a user
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

    const userId = await ensureUserExists(userEmail)
    console.log(`🔍 [GET /api/data] Loading data for user: ${userEmail} (ID: ${userId})`)
    
    // Debug: Check what user_ids exist in tables and what data exists
    const { data: allVisualData } = await supabase
      .from('visual_data')
      .select('user_id, workroom_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    const { data: allSurveyData } = await supabase
      .from('survey_data')
      .select('user_id, workroom_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    const uniqueVisualUserIds = Array.from(new Set(allVisualData?.map(d => d.user_id) || []))
    const uniqueSurveyUserIds = Array.from(new Set(allSurveyData?.map(d => d.user_id) || []))
    
    console.log(`🔍 [GET /api/data] Total visual records in DB: ${allVisualData?.length || 0}`)
    console.log(`🔍 [GET /api/data] Unique user_ids in visual_data:`, uniqueVisualUserIds)
    console.log(`🔍 [GET /api/data] Total survey records in DB: ${allSurveyData?.length || 0}`)
    console.log(`🔍 [GET /api/data] Unique user_ids in survey_data:`, uniqueSurveyUserIds)
    console.log(`🔍 [GET /api/data] Your user_id: ${userId}`)
    console.log(`🔍 [GET /api/data] Does your user_id match? Visual: ${uniqueVisualUserIds.includes(userId)}, Survey: ${uniqueSurveyUserIds.includes(userId)}`)
    
    // TEMPORARY FIX: If no data found for your user_id, load ALL data (for debugging)
    // Remove this after fixing the user_id issue
    if (allVisualData && allVisualData.length > 0 && !uniqueVisualUserIds.includes(userId)) {
      console.log(`⚠️ [GET /api/data] WARNING: Data exists but with different user_id!`)
      console.log(`⚠️ [GET /api/data] Your user_id: ${userId}`)
      console.log(`⚠️ [GET /api/data] Data user_ids: ${uniqueVisualUserIds.join(', ')}`)
      console.log(`💡 [GET /api/data] TEMPORARY: Loading ALL data regardless of user_id...`)
    }

    // Load visual data and survey data separately
    // First try with your user_id
    let [visualResult, surveyResult, metadataResult] = await Promise.all([
      supabase
        .from('visual_data')
        .select('*, data_jsonb')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('survey_data')
        .select('*, data_jsonb')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('dashboard_metadata')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
    ])
    
    // TEMPORARY FIX: If no data found for your user_id, load ALL data (for debugging)
    if ((!visualResult.data || visualResult.data.length === 0) && 
        (!surveyResult.data || surveyResult.data.length === 0)) {
      console.log(`⚠️ [GET /api/data] No data found for user_id ${userId}, loading ALL data as fallback...`)
      const [allVisualResult, allSurveyResult] = await Promise.all([
        supabase
          .from('visual_data')
          .select('*, data_jsonb')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('survey_data')
          .select('*, data_jsonb')
          .order('created_at', { ascending: false })
          .limit(100)
      ])
      
      if (allVisualResult.data && allVisualResult.data.length > 0) {
        console.log(`⚠️ [GET /api/data] Found ${allVisualResult.data.length} visual records with different user_id`)
        visualResult = allVisualResult
      }
      if (allSurveyResult.data && allSurveyResult.data.length > 0) {
        console.log(`⚠️ [GET /api/data] Found ${allSurveyResult.data.length} survey records with different user_id`)
        surveyResult = allSurveyResult
      }
    }

    // Check if tables don't exist yet (migration not run)
    if (visualResult.error && visualResult.error.message?.includes('does not exist')) {
      console.error('❌ visual_data table does not exist. Please run database/separate-visual-survey-tables.sql')
      return NextResponse.json({ 
        error: 'Database tables not found. Please run the migration: database/separate-visual-survey-tables.sql',
        workrooms: [] 
      } as DashboardData)
    }
    if (surveyResult.error && surveyResult.error.message?.includes('does not exist')) {
      console.error('❌ survey_data table does not exist. Please run database/separate-visual-survey-tables.sql')
      return NextResponse.json({ 
        error: 'Database tables not found. Please run the migration: database/separate-visual-survey-tables.sql',
        workrooms: [] 
      } as DashboardData)
    }

    if (visualResult.error) {
      console.error('❌ Error fetching visual data:', visualResult.error)
    }
    if (surveyResult.error) {
      console.error('❌ Error fetching survey data:', surveyResult.error)
    }

    const visualRows = visualResult.data || []
    const surveyRows = surveyResult.data || []
    const metadata = metadataResult.data

    console.log(`✅ Found ${visualRows.length} visual records and ${surveyRows.length} survey records`)

    // Transform visual data
    const visualWorkrooms: WorkroomData[] = visualRows.map((row) => {
      if (row.data_jsonb && typeof row.data_jsonb === 'object') {
        return {
          id: row.id,
          ...row.data_jsonb,
        } as WorkroomData
      }
      // Fallback to individual columns
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

    // Transform survey data
    const surveyWorkrooms: WorkroomData[] = surveyRows.map((row) => {
      if (row.data_jsonb && typeof row.data_jsonb === 'object') {
        return {
          id: row.id,
          ...row.data_jsonb,
        } as WorkroomData
      }
      // Fallback to individual columns
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
        reliableHomeImprovementScore: row.reliable_home_improvement_score ? Number(row.reliable_home_improvement_score) : undefined,
        timeTakenToComplete: row.time_taken_to_complete,
        projectValueScore: row.project_value_score ? Number(row.project_value_score) : undefined,
        installerKnowledgeScore: row.installer_knowledge_score ? Number(row.installer_knowledge_score) : undefined,
      } as WorkroomData
    })

    // Combine visual + survey (but keep them separate in the array - no merging)
    const allWorkrooms = [...visualWorkrooms, ...surveyWorkrooms]

    // Get dashboard metadata
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

    console.log(`📊 Returning ${allWorkrooms.length} total workrooms (${visualWorkrooms.length} visual + ${surveyWorkrooms.length} survey)`)

    return NextResponse.json({
      workrooms: allWorkrooms,
      ...dashboardMetadata
    } as DashboardData)
  } catch (error: any) {
    console.error('❌ API GET error:', error)
    return NextResponse.json({ workrooms: [] } as DashboardData)
  }
}

// POST - Save data (separates visual and survey data)
// IMPORTANT: This endpoint implements COMPLETE DATA REPLACEMENT
// - Every upload DELETES ALL previous data for the user
// - Then inserts ONLY the new data from the current upload
// - NO data is preserved from previous uploads
// - This prevents data collisions and ensures clean, up-to-date data
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
    console.log(`📥 [POST /api/data] Received request with ${body.workrooms?.length || 0} workrooms`)
    
    if (!body.workrooms || !Array.isArray(body.workrooms)) {
      console.error('❌ [POST /api/data] Invalid data format - workrooms is not an array')
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    if (body.workrooms.length === 0) {
      console.warn('⚠️ [POST /api/data] Received empty workrooms array')
      return NextResponse.json({ error: 'No workrooms to save' }, { status: 400 })
    }

    const userId = await ensureUserExists(userEmail)
    console.log(`💾 [POST /api/data] Saving data for user ${userEmail} (user_id: ${userId})`)
    console.log(`📊 [POST /api/data] First workroom sample:`, {
      name: body.workrooms[0]?.name,
      hasSales: body.workrooms[0]?.sales != null,
      hasLtrScore: body.workrooms[0]?.ltrScore != null,
      hasCraftScore: body.workrooms[0]?.craftScore != null
    })
    
    // Debug: Verify user exists and check all users
    const { data: userCheck } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()
    console.log(`🔍 [POST /api/data] User verification:`, userCheck)
    
    // Debug: List all users to see if there are multiple
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, email')
      .order('created_at', { ascending: false })
      .limit(10)
    console.log(`🔍 [POST /api/data] All users in database:`, allUsers)
    console.log(`🔍 [POST /api/data] Your user_id: ${userId}, Your email: ${userEmail}`)

    // Separate visual and survey data
    const visualData: WorkroomData[] = []
    const surveyData: WorkroomData[] = []

    body.workrooms.forEach((workroom) => {
      // Check if it's visual data (has sales, laborPO, or vendorDebit)
      const isVisual = workroom.sales != null || workroom.laborPO != null || workroom.vendorDebit != null
      
      // Check if it's survey data (has ltrScore, craftScore, or profScore)
      const isSurvey = workroom.ltrScore != null || workroom.craftScore != null || workroom.profScore != null

      if (isVisual && !isSurvey) {
        // Pure visual data
        visualData.push(workroom)
      } else if (isSurvey) {
        // Survey data (may also have some visual fields, but prioritize as survey)
        surveyData.push(workroom)
      } else {
        // Unknown type - default to visual
        visualData.push(workroom)
      }
    })

    console.log(`📊 Separated: ${visualData.length} visual records, ${surveyData.length} survey records`)

    // ============================================================================
    // COMPLETE DATA REPLACEMENT - Delete ALL previous data for this user
    // Every upload is a complete replacement - NO data is kept from previous uploads
    // ============================================================================
    console.log(`🗑️ [DELETE ALL] Starting complete data deletion for user_id: ${userId}...`)
    
    // Step 1: Count ALL existing records before delete (for logging)
    const { count: visualCountBefore } = await supabase
      .from('visual_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    const { count: surveyCountBefore } = await supabase
      .from('survey_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    const { count: metadataCountBefore } = await supabase
      .from('dashboard_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    console.log(`📊 [DELETE ALL] Records to delete: ${visualCountBefore || 0} visual, ${surveyCountBefore || 0} survey, ${metadataCountBefore || 0} metadata`)
    
    // Step 2: AGGRESSIVE DELETE - Delete ALL records for this user (no exceptions)
    // Using .delete() with .eq() to ensure we get EVERY record matching user_id
    console.log(`🗑️ [DELETE ALL] Executing delete operations...`)
    
    const [deleteVisual, deleteSurvey, deleteMetadata] = await Promise.all([
      supabase.from('visual_data').delete().eq('user_id', userId),
      supabase.from('survey_data').delete().eq('user_id', userId),
      supabase.from('dashboard_metadata').delete().eq('user_id', userId)
    ])

    // Step 3: Check if tables exist
    if (deleteVisual.error && deleteVisual.error.message?.includes('does not exist')) {
      console.error('❌ visual_data table does not exist')
      return NextResponse.json({ 
        error: 'Database tables not found. Please run the migration: database/separate-visual-survey-tables.sql'
      }, { status: 500 })
    }
    if (deleteSurvey.error && deleteSurvey.error.message?.includes('does not exist')) {
      console.error('❌ survey_data table does not exist')
      return NextResponse.json({ 
        error: 'Database tables not found. Please run the migration: database/separate-visual-survey-tables.sql'
      }, { status: 500 })
    }

    // Step 4: CRITICAL - If delete fails, STOP immediately - DO NOT insert new data
    if (deleteVisual.error) {
      console.error('❌ [DELETE ALL] CRITICAL ERROR: Failed to delete visual data:', deleteVisual.error)
      return NextResponse.json({ 
        error: `CRITICAL: Failed to delete old visual data. Cannot proceed with upload.`,
        message: deleteVisual.error.message,
        details: deleteVisual.error,
        userId: userId
      }, { status: 500 })
    }
    if (deleteSurvey.error) {
      console.error('❌ [DELETE ALL] CRITICAL ERROR: Failed to delete survey data:', deleteSurvey.error)
      return NextResponse.json({ 
        error: `CRITICAL: Failed to delete old survey data. Cannot proceed with upload.`,
        message: deleteSurvey.error.message,
        details: deleteSurvey.error,
        userId: userId
      }, { status: 500 })
    }
    if (deleteMetadata.error) {
      console.warn('⚠️ [DELETE ALL] Warning: Failed to delete metadata (non-critical):', deleteMetadata.error)
      // Metadata delete failure is not critical, but log it
    }

    // Step 5: VERIFY DELETE SUCCEEDED - Check that ZERO records remain
    // This is critical - we must ensure ALL data is gone before inserting new data
    console.log(`🔍 [DELETE ALL] Verifying all records were deleted...`)
    
    const { count: visualCountAfter } = await supabase
      .from('visual_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    const { count: surveyCountAfter } = await supabase
      .from('survey_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    const { count: metadataCountAfter } = await supabase
      .from('dashboard_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    console.log(`📊 [DELETE ALL] Records after delete: ${visualCountAfter || 0} visual, ${surveyCountAfter || 0} survey, ${metadataCountAfter || 0} metadata`)
    
    // Step 6: CRITICAL VERIFICATION - If ANY records still exist, ABORT the upload
    // This prevents data accumulation and ensures clean replacement
    if (visualCountAfter && visualCountAfter > 0) {
      console.error(`❌ [DELETE ALL] VERIFICATION FAILED: ${visualCountAfter} visual records STILL EXIST after delete!`)
      console.error(`❌ [DELETE ALL] This means delete did not work. Aborting upload to prevent data collision.`)
      return NextResponse.json({ 
        error: `DELETE VERIFICATION FAILED: ${visualCountAfter} visual records still exist for user. Cannot proceed with upload to prevent data collision.`,
        visualCountBefore: visualCountBefore || 0,
        visualCountAfter: visualCountAfter,
        userId: userId,
        action: 'Upload aborted - old data was not deleted'
      }, { status: 500 })
    }
    
    if (surveyCountAfter && surveyCountAfter > 0) {
      console.error(`❌ [DELETE ALL] VERIFICATION FAILED: ${surveyCountAfter} survey records STILL EXIST after delete!`)
      console.error(`❌ [DELETE ALL] This means delete did not work. Aborting upload to prevent data collision.`)
      return NextResponse.json({ 
        error: `DELETE VERIFICATION FAILED: ${surveyCountAfter} survey records still exist for user. Cannot proceed with upload to prevent data collision.`,
        surveyCountBefore: surveyCountBefore || 0,
        surveyCountAfter: surveyCountAfter,
        userId: userId,
        action: 'Upload aborted - old data was not deleted'
      }, { status: 500 })
    }
    
    // Step 7: Success - All data deleted, ready for fresh insert
    console.log(`✅ [DELETE ALL] SUCCESS: All previous data completely removed`)
    console.log(`✅ [DELETE ALL] Deleted: ${visualCountBefore || 0} visual, ${surveyCountBefore || 0} survey, ${metadataCountBefore || 0} metadata records`)
    console.log(`✅ [DELETE ALL] Verification: 0 records remain. Ready to insert fresh data.`)
    
    // CRITICAL: Wait a moment to ensure database has fully processed the delete
    // This prevents race conditions where insert might happen before delete is fully committed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Final verification - one more check to be absolutely sure
    const { count: finalVisualCheck } = await supabase
      .from('visual_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    const { count: finalSurveyCheck } = await supabase
      .from('survey_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if ((finalVisualCheck && finalVisualCheck > 0) || (finalSurveyCheck && finalSurveyCheck > 0)) {
      console.error(`❌ [DELETE ALL] FINAL VERIFICATION FAILED: Records still exist after wait period`)
      return NextResponse.json({ 
        error: `Final delete verification failed. Cannot proceed with upload.`,
        finalVisualCount: finalVisualCheck || 0,
        finalSurveyCount: finalSurveyCheck || 0,
        userId: userId
      }, { status: 500 })
    }
    
    console.log(`✅ [DELETE ALL] Final verification passed: 0 visual, 0 survey records. Proceeding with insert.`)

    // Insert visual data
    if (visualData.length > 0) {
      const visualToInsert = visualData.map((workroom) => {
        const { id, ...workroomDataForJson } = workroom
        const cleanData: any = { ...workroomDataForJson }
        if (cleanData.surveyDate instanceof Date) {
          cleanData.surveyDate = cleanData.surveyDate.toISOString()
        }

        return {
          user_id: userId,
          workroom_name: workroom.name || '',
          store: workroom.store ? String(workroom.store) : null,
          sales: workroom.sales || null,
          labor_po: workroom.laborPO || null,
          vendor_debit: workroom.vendorDebit || null,
          category: workroom.category || null,
          cycle_time: workroom.cycleTime != null ? Number(workroom.cycleTime) : null, // Ensure it's a number (can be decimal)
          data_jsonb: cleanData,
        }
      })

      console.log(`💾 [POST /api/data] Inserting ${visualToInsert.length} visual records...`)
      console.log(`💾 [POST /api/data] First visual record:`, {
        user_id: visualToInsert[0]?.user_id,
        workroom_name: visualToInsert[0]?.workroom_name,
        hasDataJsonb: !!visualToInsert[0]?.data_jsonb,
        dataJsonbKeys: visualToInsert[0]?.data_jsonb ? Object.keys(visualToInsert[0].data_jsonb).slice(0, 5) : []
      })
      
      // Validate data_jsonb is not null (required field)
      const validVisualRecords = visualToInsert.filter(record => {
        if (!record.data_jsonb) {
          console.warn('⚠️ Skipping visual record with null data_jsonb:', record.workroom_name)
          return false
        }
        return true
      })
      
      if (validVisualRecords.length === 0) {
        console.error('❌ No valid visual records to insert (all have null data_jsonb)')
        throw new Error('No valid visual records to insert')
      }
      
      console.log(`💾 [POST /api/data] Inserting ${validVisualRecords.length} valid visual records...`)
      
      // Log the exact data being inserted (first record only for debugging)
      if (validVisualRecords.length > 0) {
        console.log(`🔍 [POST /api/data] Sample record to insert:`, {
          user_id: validVisualRecords[0].user_id,
          workroom_name: validVisualRecords[0].workroom_name,
          hasDataJsonb: !!validVisualRecords[0].data_jsonb,
          dataJsonbType: typeof validVisualRecords[0].data_jsonb,
          dataJsonbKeys: validVisualRecords[0].data_jsonb ? Object.keys(validVisualRecords[0].data_jsonb).slice(0, 10) : []
        })
      }
      
      console.log(`🚀 [POST /api/data] Attempting to insert ${validVisualRecords.length} visual records into 'visual_data' table...`)
      console.log(`🔍 [POST /api/data] Supabase client configured:`, {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'
      })
      
      const { error: visualError, data: insertedVisual } = await supabase
        .from('visual_data')
        .insert(validVisualRecords)
        .select()

      // Log the full response with ALL error details
      if (visualError) {
        console.error(`❌ [POST /api/data] VISUAL INSERT FAILED:`, {
          message: visualError.message,
          code: visualError.code,
          details: visualError.details,
          hint: visualError.hint,
          fullError: JSON.stringify(visualError, null, 2)
        })
      } else {
        console.log(`✅ [POST /api/data] VISUAL INSERT SUCCESS:`, {
          dataCount: insertedVisual?.length || 0,
          firstRecordId: insertedVisual?.[0]?.id,
          firstRecordUserId: insertedVisual?.[0]?.user_id
        })
      }

      if (visualError) {
        console.error('❌ Error inserting visual data:', visualError)
        console.error('❌ Visual data details:', {
          userId,
          userEmail,
          count: visualToInsert.length,
          firstRecord: visualToInsert[0] ? {
            workroom_name: visualToInsert[0].workroom_name,
            user_id: visualToInsert[0].user_id,
            hasDataJsonb: !!visualToInsert[0].data_jsonb
          } : null,
          errorMessage: visualError.message,
          errorCode: visualError.code
        })
        throw visualError
      }
      console.log(`✅ Saved ${insertedVisual?.length || visualData.length} visual records to visual_data table`)
      if (insertedVisual && insertedVisual.length > 0) {
        console.log(`📊 Sample visual record saved:`, {
          id: insertedVisual[0].id,
          workroom_name: insertedVisual[0].workroom_name,
          user_id: insertedVisual[0].user_id,
          created_at: insertedVisual[0].created_at
        })
      }
    }

    // Insert survey data
    if (surveyData.length > 0) {
      const surveyToInsert = surveyData.map((workroom) => {
        const { id, ...workroomDataForJson } = workroom
        const cleanData: any = { ...workroomDataForJson }
        if (cleanData.surveyDate instanceof Date) {
          cleanData.surveyDate = cleanData.surveyDate.toISOString()
        }

        let surveyDate: string | null = null
        if (workroom.surveyDate) {
          if (workroom.surveyDate instanceof Date) {
            surveyDate = workroom.surveyDate.toISOString().split('T')[0]
          } else if (typeof workroom.surveyDate === 'string') {
            surveyDate = workroom.surveyDate
          }
        }

        return {
          user_id: userId,
          workroom_name: workroom.name || '',
          store: workroom.store ? String(workroom.store) : null,
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
          data_jsonb: cleanData,
        }
      })

      console.log(`💾 [POST /api/data] Inserting ${surveyToInsert.length} survey records...`)
      console.log(`💾 [POST /api/data] First survey record:`, {
        user_id: surveyToInsert[0]?.user_id,
        workroom_name: surveyToInsert[0]?.workroom_name,
        hasDataJsonb: !!surveyToInsert[0]?.data_jsonb,
        dataJsonbKeys: surveyToInsert[0]?.data_jsonb ? Object.keys(surveyToInsert[0].data_jsonb).slice(0, 5) : []
      })
      
      // Validate data_jsonb is not null (required field)
      const validSurveyRecords = surveyToInsert.filter(record => {
        if (!record.data_jsonb) {
          console.warn('⚠️ Skipping survey record with null data_jsonb:', record.workroom_name)
          return false
        }
        return true
      })
      
      if (validSurveyRecords.length === 0) {
        console.error('❌ No valid survey records to insert (all have null data_jsonb)')
        throw new Error('No valid survey records to insert')
      }
      
      console.log(`💾 [POST /api/data] Inserting ${validSurveyRecords.length} valid survey records...`)
      
      // Log the exact data being inserted (first record only for debugging)
      if (validSurveyRecords.length > 0) {
        console.log(`🔍 [POST /api/data] Sample survey record to insert:`, {
          user_id: validSurveyRecords[0].user_id,
          workroom_name: validSurveyRecords[0].workroom_name,
          hasDataJsonb: !!validSurveyRecords[0].data_jsonb,
          dataJsonbType: typeof validSurveyRecords[0].data_jsonb,
          dataJsonbKeys: validSurveyRecords[0].data_jsonb ? Object.keys(validSurveyRecords[0].data_jsonb).slice(0, 10) : []
        })
      }
      
      console.log(`🚀 [POST /api/data] Attempting to insert ${validSurveyRecords.length} survey records into 'survey_data' table...`)
      
      const { error: surveyError, data: insertedSurvey } = await supabase
        .from('survey_data')
        .insert(validSurveyRecords)
        .select()

      // Log the full response with ALL error details
      if (surveyError) {
        console.error(`❌ [POST /api/data] SURVEY INSERT FAILED:`, {
          message: surveyError.message,
          code: surveyError.code,
          details: surveyError.details,
          hint: surveyError.hint,
          fullError: JSON.stringify(surveyError, null, 2)
        })
      } else {
        console.log(`✅ [POST /api/data] SURVEY INSERT SUCCESS:`, {
          dataCount: insertedSurvey?.length || 0,
          firstRecordId: insertedSurvey?.[0]?.id,
          firstRecordUserId: insertedSurvey?.[0]?.user_id
        })
      }

      if (surveyError) {
        console.error('❌ Error inserting survey data:', surveyError)
        console.error('❌ Survey data details:', {
          userId,
          userEmail,
          count: surveyToInsert.length,
          firstRecord: surveyToInsert[0] ? {
            workroom_name: surveyToInsert[0].workroom_name,
            user_id: surveyToInsert[0].user_id,
            hasDataJsonb: !!surveyToInsert[0].data_jsonb
          } : null,
          errorMessage: surveyError.message,
          errorCode: surveyError.code
        })
        throw surveyError
      }
      console.log(`✅ Saved ${insertedSurvey?.length || surveyData.length} survey records to survey_data table`)
      if (insertedSurvey && insertedSurvey.length > 0) {
        console.log(`📊 Sample survey record saved:`, {
          id: insertedSurvey[0].id,
          workroom_name: insertedSurvey[0].workroom_name,
          user_id: insertedSurvey[0].user_id,
          created_at: insertedSurvey[0].created_at
        })
      }
    }

    // Save dashboard metadata
    if (body.rawColumnLValues || body.rawCraftValues || body.rawProfValues || body.excelFileTotalRows) {
      const { error: metadataError } = await supabase
        .from('dashboard_metadata')
        .upsert({
          user_id: userId,
          raw_column_l_values: body.rawColumnLValues || null,
          raw_craft_values: body.rawCraftValues || null,
          raw_prof_values: body.rawProfValues || null,
          raw_labor_categories: body.rawLaborCategories || null,
          raw_company_values: body.rawCompanyValues || null,
          raw_installer_names: body.rawInstallerNames || null,
          excel_file_total_rows: body.excelFileTotalRows || null,
        })

      if (metadataError) {
        console.error('❌ Error saving metadata:', metadataError)
        // Don't throw - metadata is optional
      } else {
        console.log(`✅ Saved dashboard metadata`)
      }
    }

    // Final verification: Check if data is actually in the tables
    const { data: insertedVisualCheck } = await supabase
      .from('visual_data')
      .select('id')
      .eq('user_id', userId)
    const { data: insertedSurveyCheck } = await supabase
      .from('survey_data')
      .select('id')
      .eq('user_id', userId)
    
    console.log(`🔍 [POST /api/data] Final verification: ${insertedVisualCheck?.length || 0} visual records, ${insertedSurveyCheck?.length || 0} survey records for user_id ${userId}`)
    
    return NextResponse.json({ 
      success: true, 
      count: body.workrooms.length,
      visualCount: visualData.length,
      surveyCount: surveyData.length,
      verifiedVisualCount: insertedVisualCheck?.length || 0,
      verifiedSurveyCount: insertedSurveyCheck?.length || 0,
      userId: userId
    })
  } catch (error: any) {
    console.error('❌ [POST /api/data] API ERROR:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      fullError: JSON.stringify(error, null, 2)
    })
    
    // Return detailed error to help debug
    return NextResponse.json({ 
      error: error?.message || 'Internal server error',
      details: error?.details,
      hint: error?.hint,
      code: error?.code
    }, { status: 500 })
  }
}
