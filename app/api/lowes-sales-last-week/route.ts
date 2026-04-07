import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

function isSafeCsvName(name: string): boolean {
  // Disallow path traversal and only allow .csv files
  if (!name) return false
  if (name.includes('/') || name.includes('\\')) return false
  if (name.includes('..')) return false
  return name.toLowerCase().endsWith('.csv')
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint is meant for local/dev convenience only.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const name = String(searchParams.get('name') || '').trim()

    if (!isSafeCsvName(name)) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
    }

    // Try in repo root (process.cwd()) and its parent (common when file is placed beside `fis/`)
    const candidates = [
      path.resolve(process.cwd(), name),
      path.resolve(process.cwd(), '..', name),
    ]

    let csvText: string | null = null
    let foundAt: string | null = null

    for (const p of candidates) {
      try {
        csvText = await fs.readFile(p, 'utf8')
        foundAt = p
        break
      } catch {
        // keep trying
      }
    }

    if (!csvText) {
      return NextResponse.json(
        { error: 'File not found', tried: candidates.map((p) => path.basename(p)) },
        { status: 404 }
      )
    }

    return NextResponse.json({
      name,
      foundAt,
      csvText,
    })
  } catch (error) {
    console.error('Error in GET /api/lowes-sales-last-week:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

