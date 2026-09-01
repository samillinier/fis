// API Route - Jobs Data — Supabase Storage, admin/owner write, shared read
// Stores the uploaded jobs dataset as a gzip-compressed JSON object in a
// private bucket (no DB table required). Reads are shared; writes are limited
// to admin/owner.
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { gunzipSync, gzipSync } from 'zlib'

export const maxDuration = 60

const BUCKET = 'jobs'
const STORAGE_PATH = 'jobs/data.json'

async function requireAdminOrOwner(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { ok: false as const, status: 401, error: 'Unauthorized' }
  }

  const userEmail = authHeader.replace('Bearer ', '').toLowerCase()
  const { data: actorData } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail)
    .maybeSingle()

  const role = actorData?.role
  const isActive = actorData?.is_active !== false
  const allowed = isActive && (role === 'admin' || role === 'owner')
  if (!allowed) {
    return { ok: false as const, status: 403, error: 'Unauthorized' }
  }

  return { ok: true as const }
}

async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === BUCKET)) return
  await supabase.storage.createBucket(BUCKET, { public: false })
}

function emptyPayload() {
  return { records: [], fileName: null, uploadedAt: null }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureBucket()
    const { data, error } = await supabase.storage.from(BUCKET).download(STORAGE_PATH)

    if (error || !data) {
      return NextResponse.json(emptyPayload())
    }

    const buf = Buffer.from(await data.arrayBuffer())
    let payload: ReturnType<typeof emptyPayload>
    try {
      payload = JSON.parse(gunzipSync(buf).toString('utf8'))
    } catch {
      // Object may be stored uncompressed (older write) — try plain JSON.
      try {
        payload = JSON.parse(buf.toString('utf8'))
      } catch {
        payload = emptyPayload()
      }
    }

    const records = Array.isArray(payload?.records) ? payload.records : []
    return NextResponse.json({
      records,
      fileName: typeof payload?.fileName === 'string' ? payload.fileName : null,
      uploadedAt: typeof payload?.uploadedAt === 'string' ? payload.uploadedAt : null,
    })
  } catch (error: any) {
    console.error('Jobs API GET error:', error)
    return NextResponse.json({ ...emptyPayload(), error: error?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrOwner(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Accept gzip-encoded bodies (client compresses large exports before upload).
    const raw = Buffer.from(await request.arrayBuffer())
    const isGzip = request.headers.get('content-encoding')?.toLowerCase().includes('gzip')
    let text: string
    try {
      text = isGzip ? gunzipSync(raw).toString('utf8') : raw.toString('utf8')
    } catch {
      text = raw.toString('utf8')
    }

    let body: { records?: unknown; fileName?: unknown }
    try {
      body = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const records = Array.isArray(body?.records) ? body.records : []
    const fileName = typeof body?.fileName === 'string' ? body.fileName : null
    const uploadedAt = new Date().toISOString()

    await ensureBucket()
    const payload = JSON.stringify({ records, fileName, uploadedAt })
    const compressed = gzipSync(payload)

    const { error } = await supabase.storage.from(BUCKET).upload(STORAGE_PATH, compressed, {
      upsert: true,
      contentType: 'application/octet-stream',
      cacheControl: '0',
    })

    if (error) throw error

    return NextResponse.json({ success: true, count: records.length })
  } catch (error: any) {
    console.error('Jobs API POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminOrOwner(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    await ensureBucket()
    const { error } = await supabase.storage.from(BUCKET).remove([STORAGE_PATH])
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Jobs API DELETE error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
