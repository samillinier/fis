import { NextRequest, NextResponse } from 'next/server'
import { ensureUserExists, supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SHARED_ADMIN_EMAIL = 'sbiru@fiscorponline.com'
const NOTE_KEY = '__pod_weekly_note_v2__'
const API_VERSION = 'pod-note-off-button-v7'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

type NoteColor = 'yellow' | 'green' | 'red'
type NoteState = {
  enabled: boolean
  text: string
  color: NoteColor
  updatedAt: string | null
}

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase()
}

async function getActorEmail(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const email = normalizeEmail(authHeader?.replace(/^Bearer\s+/i, ''))
  return email || null
}

async function canManageAnnouncement(email: string): Promise<boolean> {
  if (email === SHARED_ADMIN_EMAIL) return true

  const { data } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', email)
    .maybeSingle()

  return Boolean(
    data?.is_active !== false &&
      (data?.role === 'admin' || data?.role === 'owner' || data?.role === 'manager')
  )
}

function normalizeColor(color: unknown): NoteColor {
  return color === 'green' || color === 'red' ? color : 'yellow'
}

function readPayload(payload: unknown): Pick<NoteState, 'enabled' | 'text' | 'color'> {
  const data = payload as { enabled?: unknown; text?: unknown; message?: unknown; color?: unknown } | null
  const text = String(data?.text ?? data?.message ?? '').trim()

  return {
    enabled: typeof data?.enabled === 'boolean' ? data.enabled && Boolean(text) : Boolean(text),
    text,
    color: normalizeColor(data?.color),
  }
}

async function readNoteState(): Promise<NoteState> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase configuration')
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/historical_data?select=data,created_at&week=eq.${encodeURIComponent(NOTE_KEY)}&order=created_at.desc&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`Could not read POD note: ${response.status}`)
  }

  const data = (await response.json()) as Array<{ data: unknown; created_at: string | null }>
  const row = data?.[0]
  const payload = readPayload(row?.data)

  return {
    ...payload,
    updatedAt: row?.created_at || null,
  }
}

async function writeNoteState(state: NoteState) {
  const sharedAdminUserId = await ensureUserExists(SHARED_ADMIN_EMAIL)
  const now = new Date()
  const { error } = await supabase.from('historical_data').insert({
    user_id: sharedAdminUserId,
    upload_date: now.toISOString().slice(0, 10),
    week: NOTE_KEY,
    month: NOTE_KEY,
    year: NOTE_KEY,
    data: {
      enabled: state.enabled,
      text: state.text,
      color: state.color,
    },
    timestamp: now.getTime(),
  })

  if (error) throw error
}

async function saveAndReadNoteState(state: NoteState): Promise<NoteState> {
  await writeNoteState(state)
  return readNoteState()
}

export async function GET(request: NextRequest) {
  try {
    const actorEmail = await getActorEmail(request)
    const canManage = actorEmail ? await canManageAnnouncement(actorEmail) : false
    const state = await readNoteState()
    return NextResponse.json(
      {
        ...state,
        canManage,
        version: API_VERSION,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('GET /api/pod-banner error:', error)
    return NextResponse.json(
      { enabled: false, text: '', color: 'yellow', updatedAt: null, canManage: false, version: API_VERSION },
      { headers: NO_STORE_HEADERS }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actorEmail = await getActorEmail(request)
    if (!actorEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
    }

    const allowed = await canManageAnnouncement(actorEmail)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Only admins can manage POD notes' },
        { status: 403, headers: NO_STORE_HEADERS }
      )
    }

    const body = await request.json()
    const enabled = Boolean(body?.enabled)
    const text = String(body?.text || '').trim()
    const color = normalizeColor(body?.color)
    const state: NoteState = {
      enabled: Boolean(enabled && text),
      text,
      color,
      updatedAt: new Date().toISOString(),
    }

    const savedState = await saveAndReadNoteState(state)

    return NextResponse.json({ ...savedState, version: API_VERSION }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('PUT /api/pod-banner error:', error)
    return NextResponse.json({ error: 'Could not save POD note' }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
