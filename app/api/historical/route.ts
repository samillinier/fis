// API Route - Supabase for Historical Data
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'
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
    let query = supabase
      .from('historical_data')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (month && year) {
      query = query.eq('month', month).eq('year', year)
    } else if (month) {
      query = query.eq('month', month)
    } else if (year) {
      query = query.eq('year', year)
    }

    // For weekly view, limit to 1 result
    if (period === 'weekly' && (month || year)) {
      query = query.limit(1)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Transform to match HistoricalDataEntry format
    const entries: HistoricalDataEntry[] = (data || []).map((row) => ({
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
    const { data: inserted, error } = await supabase
      .from('historical_data')
      .insert({
        user_id: userId,
        upload_date: uploadDate,
        week,
        month,
        year,
        data,
        timestamp,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!inserted) {
      throw new Error('Failed to insert historical data')
    }

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
      const { error } = await supabase
        .from('historical_data')
        .delete()
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    // Delete specific entry
    const { error } = await supabase
      .from('historical_data')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
