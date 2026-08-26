// API Route - Cycle Time Data (YTD / LY) — Supabase Storage, admin-only
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type CycleTimeVariant = 'ytd' | 'ly'

const BUCKET = 'cycle-time'
const SUPER_ADMIN_EMAIL = 'sbiru@fiscorponline.com'

function parseVariant(request: NextRequest, bodyVariant?: unknown): CycleTimeVariant | null {
  const fromQuery = request.nextUrl.searchParams.get('variant')
  const raw = (fromQuery || (typeof bodyVariant === 'string' ? bodyVariant : '') || '').toLowerCase()
  if (raw === 'ytd' || raw === 'ly') return raw
  return null
}

function storagePath(variant: CycleTimeVariant): string {
  return `${variant}/data.json`
}

async function requireAdmin(request: NextRequest): Promise<{ ok: true; email: string } | { ok: false; response: NextResponse }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const userEmail = authHeader.replace('Bearer ', '').toLowerCase()
  if (userEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { ok: true, email: userEmail }
  }

  const { data: actorData } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail)
    .maybeSingle()

  const role = actorData?.role
  const isActive = actorData?.is_active !== false
  const allowed = isActive && (role === 'admin' || role === 'owner')
  if (!allowed) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  }

  return { ok: true, email: userEmail }
}

async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === BUCKET)) return
  await supabase.storage.createBucket(BUCKET, { public: false })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth.ok === false) return auth.response

    const variant = parseVariant(request)
    if (!variant) {
      return NextResponse.json({ error: 'Invalid variant. Use ytd or ly.' }, { status: 400 })
    }

    await ensureBucket()
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath(variant))

    if (error || !data) {
      // Missing object is an empty dataset, not a hard failure
      const missing =
        error?.message?.toLowerCase().includes('not found') ||
        error?.message?.toLowerCase().includes('object') ||
        (error as any)?.statusCode === '404'
      if (missing || !data) {
        return NextResponse.json({
          records: [],
          fileName: null,
          uploadedAt: null,
          variant,
        })
      }
      throw error
    }

    const text = await data.text()
    const parsed = text ? JSON.parse(text) : {}
    const records = Array.isArray(parsed?.records) ? parsed.records : []

    return NextResponse.json({
      records,
      fileName: typeof parsed?.fileName === 'string' ? parsed.fileName : null,
      uploadedAt: typeof parsed?.uploadedAt === 'string' ? parsed.uploadedAt : null,
      variant,
    })
  } catch (error: any) {
    console.error('Cycle Time API GET error:', error)
    return NextResponse.json(
      {
        records: [],
        fileName: null,
        uploadedAt: null,
        error: error?.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth.ok === false) return auth.response

    const body = await request.json()
    const variant = parseVariant(request, body?.variant)
    if (!variant) {
      return NextResponse.json({ error: 'Invalid variant. Use ytd or ly.' }, { status: 400 })
    }

    const records = Array.isArray(body?.records) ? body.records : []
    const fileName = typeof body?.fileName === 'string' ? body.fileName : null
    const uploadedAt = new Date().toISOString()

    await ensureBucket()
    const payload = JSON.stringify({ records, fileName, uploadedAt, variant })
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath(variant), payload, {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '0',
    })

    if (error) throw error

    return NextResponse.json({ success: true, count: records.length, variant, uploadedAt })
  } catch (error: any) {
    console.error('Cycle Time API POST error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth.ok === false) return auth.response

    const variant = parseVariant(request)
    if (!variant) {
      return NextResponse.json({ error: 'Invalid variant. Use ytd or ly.' }, { status: 400 })
    }

    await ensureBucket()
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath(variant)])
    if (error) throw error

    return NextResponse.json({ success: true, variant })
  } catch (error: any) {
    console.error('Cycle Time API DELETE error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
