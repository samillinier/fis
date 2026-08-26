import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSharedAdminUserId } from '@/lib/supabase'
import { normalizeScheduledJobData } from '@/lib/scheduledJobMerge'
import type { ScheduledJobSourceType } from '@/context/ScheduledJobContext'

export const maxDuration = 60

const SOURCES: ScheduledJobSourceType[] = ['install', 'measure', 'workorder']

async function requireAdmin(authHeader: string | null) {
  if (!authHeader) return { ok: false as const, status: 401, error: 'Unauthorized' }

  const userEmail = authHeader.replace('Bearer ', '')
  const { data: actorData } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail.toLowerCase())
    .maybeSingle()

  const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false
  if (!isAdmin) return { ok: false as const, status: 403, error: 'Unauthorized' }

  return { ok: true as const }
}

async function readExistingPayload(userId: string) {
  const { data, error } = await supabase
    .from('scheduled_job_data')
    .select('id, data_jsonb, file_name')
    .eq('user_id', userId)
    .order('id', { ascending: false })
    .limit(1)

  if (error) throw error
  const row = data?.[0]
  return {
    rowId: row?.id as number | undefined,
    payload: normalizeScheduledJobData(row?.data_jsonb),
    fileName: typeof row?.file_name === 'string' ? row.file_name : null,
  }
}

function buildFileNameLabel(payload: ReturnType<typeof normalizeScheduledJobData>): string | null {
  const fileNames = [
    payload.install.fileName ? `Install: ${payload.install.fileName}` : null,
    payload.measure.fileName ? `Measure: ${payload.measure.fileName}` : null,
    payload.workorder.fileName ? `Work Order: ${payload.workorder.fileName}` : null,
  ].filter(Boolean)
  return fileNames.length > 0 ? fileNames.join(' · ') : null
}

async function persistPayload(userId: string, payload: ReturnType<typeof normalizeScheduledJobData>) {
  const now = new Date().toISOString()
  const fileLabel = buildFileNameLabel(payload)
  const { rowId } = await readExistingPayload(userId)

  if (rowId != null) {
    const { error } = await supabase
      .from('scheduled_job_data')
      .update({
        data_jsonb: payload,
        file_name: fileLabel,
        upload_date: now,
        updated_at: now,
      })
      .eq('id', rowId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('scheduled_job_data').insert({
      user_id: userId,
      data_jsonb: payload,
      file_name: fileLabel,
      upload_date: now,
      updated_at: now,
    })
    if (error) throw error
  }

  if (fileLabel) {
    await supabase.from('scheduled_job_metadata').upsert(
      {
        user_id: userId,
        scheduled_job_file_name: fileLabel,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sharedAdminUserId = await getSharedAdminUserId()

    const { data, error } = await supabase
      .from('scheduled_job_data')
      .select('*')
      .eq('user_id', sharedAdminUserId)
      .order('id', { ascending: false })
      .limit(1)

    if (error) throw error

    const row = data?.[0]
    const normalized = normalizeScheduledJobData(row?.data_jsonb)

    return NextResponse.json(normalized)
  } catch (error: any) {
    console.error('Scheduled job API GET error:', error)
    return NextResponse.json({
      install: { jobs: [] },
      measure: { jobs: [] },
      workorder: { jobs: [] },
      error: error?.message,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const auth = await requireAdmin(authHeader)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const payload = normalizeScheduledJobData(body)
    const sharedAdminUserId = await getSharedAdminUserId()

    await persistPayload(sharedAdminUserId, payload)

    const total =
      payload.install.jobs.length + payload.measure.jobs.length + payload.workorder.jobs.length

    return NextResponse.json({ success: true, count: total })
  } catch (error: any) {
    console.error('Scheduled job API POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

/** Update one export file at a time — avoids 4MB body limit when all 3 files are loaded */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const auth = await requireAdmin(authHeader)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const source = body?.source as ScheduledJobSourceType
    const bundle = body?.bundle

    if (!SOURCES.includes(source) || !bundle || !Array.isArray(bundle.jobs)) {
      return NextResponse.json({ error: 'Invalid source or bundle' }, { status: 400 })
    }

    const sharedAdminUserId = await getSharedAdminUserId()
    const { payload } = await readExistingPayload(sharedAdminUserId)

    payload[source] = {
      jobs: bundle.jobs,
      fileName: typeof bundle.fileName === 'string' ? bundle.fileName : undefined,
      uploadDate: typeof bundle.uploadDate === 'string' ? bundle.uploadDate : undefined,
    }

    await persistPayload(sharedAdminUserId, payload)

    return NextResponse.json({
      success: true,
      source,
      count: bundle.jobs.length,
    })
  } catch (error: any) {
    console.error('Scheduled job API PATCH error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
