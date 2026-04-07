// Shared Sales Last Week CSV for Q1 tracker (Supabase).
// GET: public (same pattern as lowes_q1_goals) so the pivot can load for everyone.
// POST / DELETE: admin only — save or remove the cloud snapshot.
import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSharedAdminUserId } from '@/lib/supabase'

const MAX_CSV_CHARS = 12_000_000 // ~12 MB text; adjust if needed

function getAdminActor(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const userEmail = authHeader.replace('Bearer ', '').trim()
  if (!userEmail) return { error: NextResponse.json({ error: 'Invalid user' }, { status: 401 }) }
  return { userEmail }
}

async function assertAdmin(userEmail: string): Promise<boolean> {
  const { data: actorData } = await supabase
    .from('authorized_users')
    .select('role, is_active')
    .eq('email', userEmail.toLowerCase())
    .maybeSingle()
  return actorData?.role === 'admin' && actorData?.is_active !== false
}

export async function GET() {
  try {
    const userId = await getSharedAdminUserId()
    const { data, error } = await supabase
      .from('lowes_sales_last_week_snapshot')
      .select('file_name, csv_text, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table') ||
        error.message?.includes('does not exist')
      ) {
        return NextResponse.json(
          {
            error:
              'Table not found. Run database/lowes-sales-last-week-cloud.sql in Supabase.',
            snapshot: null,
          },
          { status: 500 }
        )
      }
      console.error('GET lowes-sales-last-week-cloud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data?.csv_text) {
      return NextResponse.json({ snapshot: null })
    }

    return NextResponse.json({
      snapshot: {
        fileName: data.file_name,
        csvText: data.csv_text,
        updatedAt: data.updated_at,
      },
    })
  } catch (e: any) {
    console.error('GET /api/lowes-sales-last-week-cloud:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = getAdminActor(request)
    if ('error' in actor) return actor.error

    if (!(await assertAdmin(actor.userEmail))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can save this file' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const fileName = String(body?.fileName || '').trim()
    const csvText = typeof body?.csvText === 'string' ? body.csvText : ''

    if (!fileName || !csvText) {
      return NextResponse.json({ error: 'fileName and csvText are required' }, { status: 400 })
    }

    if (csvText.length > MAX_CSV_CHARS) {
      return NextResponse.json(
        { error: `CSV is too large (max ${MAX_CSV_CHARS} characters)` },
        { status: 400 }
      )
    }

    const userId = await getSharedAdminUserId()
    const { error } = await supabase.from('lowes_sales_last_week_snapshot').upsert(
      {
        user_id: userId,
        file_name: fileName,
        csv_text: csvText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      if (
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table') ||
        error.message?.includes('does not exist')
      ) {
        return NextResponse.json(
          {
            error:
              'Table not found. Run database/lowes-sales-last-week-cloud.sql in Supabase.',
          },
          { status: 500 }
        )
      }
      console.error('POST lowes-sales-last-week-cloud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, fileName })
  } catch (e: any) {
    console.error('POST /api/lowes-sales-last-week-cloud:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = getAdminActor(request)
    if ('error' in actor) return actor.error

    if (!(await assertAdmin(actor.userEmail))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can clear this file' },
        { status: 403 }
      )
    }

    const userId = await getSharedAdminUserId()
    const { error } = await supabase.from('lowes_sales_last_week_snapshot').delete().eq('user_id', userId)

    if (error) {
      if (
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table') ||
        error.message?.includes('does not exist')
      ) {
        return NextResponse.json(
          {
            error:
              'Table not found. Run database/lowes-sales-last-week-cloud.sql in Supabase.',
          },
          { status: 500 }
        )
      }
      console.error('DELETE lowes-sales-last-week-cloud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/lowes-sales-last-week-cloud:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
