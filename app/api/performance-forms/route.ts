import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

const VALID_METRICS = [
  'vendor_debit',
  'ltr',
  'cycle_time',
  'reschedule_rate',
  'job_cycle_time',
  'details_cycle_time',
  'work_order_cycle_time',
] as const

const METRIC_STORAGE_FALLBACKS: Record<string, string | undefined> = {
  work_order_cycle_time: 'details_cycle_time',
}

function resolveSubmittedMetricType(record: { metric_type?: string; form_data?: any } | null | undefined) {
  return record?.form_data?.reported_metric_type || record?.metric_type || null
}

function buildStoredFormData(metricType: string, formData: any, useFallbackStorage = false) {
  if (!useFallbackStorage) {
    return formData
  }

  return {
    ...formData,
    reported_metric_type: metricType,
    stored_metric_type: METRIC_STORAGE_FALLBACKS[metricType] || metricType,
  }
}

function isMetricConstraintError(error: any) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === '23514' || message.includes('performance_forms_metric_type_check')
}

// GET - Check if form is required for current week
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

    const { searchParams } = new URL(request.url)
    const workroom = searchParams.get('workroom')
    const metricType = searchParams.get('metric_type')

    if (!workroom || !metricType) {
      return NextResponse.json({ error: 'Missing workroom or metric_type' }, { status: 400 })
    }

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current week start (Monday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust when day is Sunday
    const weekStart = new Date(today.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    const weekStartDate = weekStart.toISOString().split('T')[0]

    let data: any = null
    let error: any = null

    if (metricType === 'work_order_cycle_time') {
      const { data: fallbackCandidates, error: fallbackError } = await supabase
        .from('performance_forms')
        .select('id, submitted_at, form_data, metric_type')
        .eq('user_id', userId)
        .eq('workroom', workroom)
        .in('metric_type', ['work_order_cycle_time', 'details_cycle_time'])
        .eq('week_start_date', weekStartDate)
        .order('submitted_at', { ascending: false })

      error = fallbackError
      data =
        fallbackCandidates?.find((submission) => resolveSubmittedMetricType(submission) === metricType) || null
    } else {
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from('performance_forms')
        .select('id, submitted_at, form_data, metric_type')
        .eq('user_id', userId)
        .eq('workroom', workroom)
        .eq('metric_type', metricType)
        .eq('week_start_date', weekStartDate)
        .maybeSingle()

      data = exactMatch
      error = exactMatchError
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking form submission:', error)
      return NextResponse.json({ error: 'Failed to check form' }, { status: 500 })
    }

    return NextResponse.json({
      submitted: !!data,
      submission: data ? { ...data, metric_type: resolveSubmittedMetricType(data) || data.metric_type } : null,
    })
  } catch (error) {
    console.error('Error in GET /api/performance-forms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Submit performance form
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
    const { workroom, metric_type, form_data } = body

    if (!workroom || !metric_type || !form_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VALID_METRICS.includes(metric_type)) {
      return NextResponse.json({ error: 'Invalid metric_type' }, { status: 400 })
    }

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current week start (Monday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const weekStart = new Date(today.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    const weekStartDate = weekStart.toISOString().split('T')[0]

    // First, try to find existing form submission
    let existingForm: any = null
    let checkError: any = null

    if (metric_type === 'work_order_cycle_time') {
      const { data: existingCandidates, error: existingCandidatesError } = await supabase
        .from('performance_forms')
        .select('id, metric_type, form_data')
        .eq('user_id', userId)
        .eq('workroom', workroom)
        .in('metric_type', ['work_order_cycle_time', 'details_cycle_time'])
        .eq('week_start_date', weekStartDate)

      existingForm =
        existingCandidates?.find((submission) => resolveSubmittedMetricType(submission) === metric_type) || null
      checkError = existingCandidatesError
    } else {
      const { data: exactExistingForm, error: exactCheckError } = await supabase
        .from('performance_forms')
        .select('id, metric_type, form_data')
        .eq('user_id', userId)
        .eq('workroom', workroom)
        .eq('metric_type', metric_type)
        .eq('week_start_date', weekStartDate)
        .maybeSingle()

      existingForm = exactExistingForm
      checkError = exactCheckError
    }

    let data, error

    if (checkError) {
      // Real error checking for existing form
      console.error('Error checking for existing form:', checkError)
      return NextResponse.json({ 
        error: 'Failed to check for existing form', 
        details: checkError.message 
      }, { status: 500 })
    }

    const saveSubmission = async (storageMetricType: string, storedFormData: any) => {
      if (existingForm && existingForm.id) {
        return await supabase
          .from('performance_forms')
          .update({
            metric_type: storageMetricType,
            form_data: storedFormData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingForm.id)
          .select()
          .single()
      }

      return await supabase
        .from('performance_forms')
        .insert({
          user_id: userId,
          workroom,
          metric_type: storageMetricType,
          week_start_date: weekStartDate,
          form_data: storedFormData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
    }

    const existingStorageMetricType = existingForm?.metric_type || metric_type
    const usesFallbackStorage =
      resolveSubmittedMetricType(existingForm) === 'work_order_cycle_time' &&
      existingStorageMetricType !== 'work_order_cycle_time'

    ;({ data, error } = await saveSubmission(
      existingStorageMetricType,
      buildStoredFormData(metric_type, form_data, usesFallbackStorage)
    ))

    if (error && metric_type === 'work_order_cycle_time' && isMetricConstraintError(error)) {
      const fallbackMetricType = METRIC_STORAGE_FALLBACKS[metric_type] || metric_type
      console.warn(`Falling back to ${fallbackMetricType} storage for ${metric_type} due to DB constraint`)
      ;({ data, error } = await saveSubmission(
        fallbackMetricType,
        buildStoredFormData(metric_type, form_data, true)
      ))
    }

    if (error) {
      console.error('Error saving form submission:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Form data being saved:', {
        userId,
        workroom,
        metric_type,
        week_start_date: weekStartDate,
        form_data_keys: form_data ? Object.keys(form_data).slice(0, 10) : 'null'
      })
      
      // Check if table exists
      const { data: tableCheck } = await supabase
        .from('performance_forms')
        .select('id')
        .limit(1)
      
      if (!tableCheck) {
        console.error('Table performance_forms might not exist!')
      }
      
      return NextResponse.json({ 
        error: 'Failed to save form', 
        details: error.message || 'Unknown database error',
        code: error.code,
        hint: error.hint || 'Check if performance_forms table exists and RLS is configured correctly'
      }, { status: 500 })
    }

    const responseSubmission = data
      ? {
          ...data,
          metric_type: resolveSubmittedMetricType(data) || data.metric_type,
        }
      : data

    console.log('Form submission saved:', {
      userId,
      workroom,
      requested_metric_type: metric_type,
      stored_metric_type: data?.metric_type,
      weekStartDate,
    })

    return NextResponse.json({ 
      success: true,
      submission: responseSubmission
    })
  } catch (error) {
    console.error('Error in POST /api/performance-forms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a performance form submission
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

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('id')

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    // Ensure user exists
    const userId = await ensureUserExists(userEmail)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if submission exists and belongs to the user (or user is admin)
    const { data: submission, error: fetchError } = await supabase
      .from('performance_forms')
      .select('id, user_id')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user is admin (same logic as list endpoint)
    const SUPER_ADMIN_EMAIL = 'sbiru@fiscorponline.com'
    const normalizedEmail = userEmail.trim().toLowerCase()
    const isSuperAdmin = normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase()
    
    let isAdmin = isSuperAdmin
    if (!isSuperAdmin) {
      const { data: authUser } = await supabase
        .from('authorized_users')
        .select('role, is_active')
        .eq('email', normalizedEmail)
        .single()
      
      isAdmin = authUser?.role === 'admin' && authUser?.is_active !== false
    }

    // Only allow deletion if user owns the submission or is admin
    if (!isAdmin && submission.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this submission' }, { status: 403 })
    }

    // Delete the submission
    const { error: deleteError } = await supabase
      .from('performance_forms')
      .delete()
      .eq('id', submissionId)

    if (deleteError) {
      console.error('Error deleting submission:', deleteError)
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
    }

    console.log(`Submission ${submissionId} deleted by user ${userEmail}`)
    return NextResponse.json({ success: true, message: 'Submission deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/performance-forms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
