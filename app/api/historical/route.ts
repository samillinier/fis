// API Route - Vercel Postgres for Historical Data
import { NextRequest, NextResponse } from 'next/server'
import { sql, ensureUserExists } from '@/lib/vercel-postgres'
import type { DashboardData } from '@/context/DataContext'
import type { HistoricalDataEntry } from '@/data/historicalDataStorage'

// GET - Fetch historical data entries
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly'
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    // Build query with conditions
    let result
    if (month && year) {
      if (period === 'weekly') {
        // Return only most recent for weekly view
        result = await sql`
          SELECT * FROM historical_data 
          WHERE user_id = ${userId} AND month = ${month} AND year = ${year}
          ORDER BY timestamp DESC
          LIMIT 1
        `
      } else {
        result = await sql`
          SELECT * FROM historical_data 
          WHERE user_id = ${userId} AND month = ${month} AND year = ${year}
          ORDER BY timestamp DESC
        `
      }
    } else if (month) {
      if (period === 'weekly') {
        result = await sql`
          SELECT * FROM historical_data 
          WHERE user_id = ${userId} AND month = ${month}
          ORDER BY timestamp DESC
          LIMIT 1
        `
      } else {
        result = await sql`
          SELECT * FROM historical_data 
          WHERE user_id = ${userId} AND month = ${month}
          ORDER BY timestamp DESC
        `
      }
    } else if (year) {
      if (period === 'weekly') {
        result = await sql`
          SELECT * FROM historical_data 
          WHERE user_id = ${userId} AND year = ${year}
          ORDER BY timestamp DESC
          LIMIT 1
        `
      } else {
        result = await sql`
          SELECT * FROM historical_data 
          WHERE user_id = ${userId} AND year = ${year}
          ORDER BY timestamp DESC
        `
      }
    } else {
      result = await sql`
        SELECT * FROM historical_data 
        WHERE user_id = ${userId}
        ORDER BY timestamp DESC
      `
    }

    // Transform to match HistoricalDataEntry format
    const entries: HistoricalDataEntry[] = result.rows.map((row) => ({
      id: row.id,
      uploadDate: row.upload_date,
      week: row.week,
      month: row.month,
      year: row.year,
      data: row.data as DashboardData,
      timestamp: row.timestamp,
    }))

    return NextResponse.json(entries)
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Save historical data entry
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

    const body = await request.json()

    const { uploadDate, week, month, year, data, timestamp } = body

    if (!uploadDate || !week || !month || !year || !data || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    // Insert historical data
    const result = await sql`
      INSERT INTO historical_data (user_id, upload_date, week, month, year, data, timestamp)
      VALUES (${userId}, ${uploadDate}, ${week}, ${month}, ${year}, ${JSON.stringify(data)}::jsonb, ${timestamp})
      RETURNING *
    `

    const inserted = result.rows[0]

    return NextResponse.json({
      id: inserted.id,
      uploadDate: inserted.upload_date,
      week: inserted.week,
      month: inserted.month,
      year: inserted.year,
      data: inserted.data,
      timestamp: inserted.timestamp,
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete historical data entry
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const clearAll = searchParams.get('clearAll') === 'true'

    // Ensure user exists and get user ID
    const userId = await ensureUserExists(userEmail)

    if (clearAll) {
      // Delete all historical data for user
      await sql`
        DELETE FROM historical_data WHERE user_id = ${userId}
      `
      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    // Delete specific entry
    await sql`
      DELETE FROM historical_data 
      WHERE id = ${id} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
