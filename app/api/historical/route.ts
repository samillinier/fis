import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { DashboardData } from '@/context/DataContext'

// GET - Fetch historical data entries
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly'
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const supabase = createServerClient()
    let query = supabase
      .from('historical_data')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (month) {
      query = query.eq('month', month)
    }

    if (year) {
      query = query.eq('year', year)
    }

    // For weekly view with month/year selected, return only most recent
    if (period === 'weekly' && (month || year)) {
      const { data, error } = await query.limit(1)
      if (error) throw error
      return NextResponse.json(data || [])
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      let errorMessage = error.message || 'Database error'
      if (error.message?.includes('requested path is invalid') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        errorMessage = 'Database tables not found. Please run the database schema SQL in Supabase SQL Editor. See database/schema.sql file.'
      }
      return NextResponse.json({ 
        error: errorMessage,
        hint: 'Run database/schema.sql in Supabase SQL Editor to create the required tables'
      }, { status: 500 })
    }

    // Transform to match HistoricalDataEntry format
    const entries = (data || []).map((row) => ({
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

    const userId = authHeader.replace('Bearer ', '')
    const body = await request.json()

    const { uploadDate, week, month, year, data, timestamp } = body

    if (!uploadDate || !week || !month || !year || !data || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: inserted, error } = await supabase
      .from('historical_data')
      .insert({
        user_id: userId,
        upload_date: uploadDate,
        week,
        month,
        year,
        data: data as any,
        timestamp,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      let errorMessage = error.message || 'Database error'
      if (error.message?.includes('requested path is invalid') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        errorMessage = 'Database tables not found. Please run the database schema SQL in Supabase SQL Editor. See database/schema.sql file.'
      }
      return NextResponse.json({ 
        error: errorMessage,
        hint: 'Run database/schema.sql in Supabase SQL Editor to create the required tables'
      }, { status: 500 })
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

    const userId = authHeader.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const clearAll = searchParams.get('clearAll') === 'true'

    if (clearAll) {
      // Delete all historical data for user
      const supabase = createServerClient()
      const { error } = await supabase.from('historical_data').delete().eq('user_id', userId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('historical_data')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Database error:', error)
      let errorMessage = error.message || 'Database error'
      if (error.message?.includes('requested path is invalid') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        errorMessage = 'Database tables not found. Please run the database schema SQL in Supabase SQL Editor. See database/schema.sql file.'
      }
      return NextResponse.json({ 
        error: errorMessage,
        hint: 'Run database/schema.sql in Supabase SQL Editor to create the required tables'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

