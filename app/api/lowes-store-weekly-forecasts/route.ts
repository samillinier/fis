import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Retrieve store weekly forecasts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const district = searchParams.get('district')
    const store = searchParams.get('store')
    const week = searchParams.get('week')
    const workroom = searchParams.get('workroom')

    let query = supabase
      .from('lowes_store_weekly_forecasts')
      .select('*')
      .order('district', { ascending: true })
      .order('store', { ascending: true })
      .order('week_number', { ascending: true })

    if (district) {
      query = query.eq('district', district)
    }
    if (store) {
      query = query.eq('store', store)
    }
    if (week) {
      query = query.eq('week_number', parseInt(week))
    }
    if (workroom) {
      query = query.eq('workroom', workroom)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching store weekly forecasts:', error)
      return NextResponse.json({ error: 'Failed to fetch forecasts' }, { status: 500 })
    }

    return NextResponse.json({ forecasts: data || [] })
  } catch (error) {
    console.error('Error in GET /api/lowes-store-weekly-forecasts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Upload store weekly forecasts (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    
    // Check if user is admin (you may want to add proper admin check)
    // For now, we'll allow any authenticated user

    const body = await request.json()
    const { forecasts } = body

    if (!forecasts || !Array.isArray(forecasts)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected forecasts array.' },
        { status: 400 }
      )
    }

    if (forecasts.length === 0) {
      return NextResponse.json(
        { error: 'No forecasts provided' },
        { status: 400 }
      )
    }

    // Validate forecast data
    const validForecasts = forecasts.map((forecast: any) => {
      const district = String(forecast.district || '').trim()
      const store = String(forecast.store || '').trim()
      const weekNumber = parseInt(forecast.week_number)
      const districtQ1Jobs = parseInt(forecast.district_q1_jobs || 0)
      const pctOfDistrict = parseFloat(forecast.pct_of_district || 0)
      const storeQ1Forecast = parseInt(forecast.store_q1_job_forecast || 0)
      const jobsNeeded = parseInt(forecast.jobs_needed || 0)
      const workroom = forecast.workroom ? String(forecast.workroom).trim() : null

      if (!district || !store) {
        throw new Error('District and Store are required')
      }

      if (weekNumber < 1 || weekNumber > 13) {
        throw new Error(`Invalid week number: ${weekNumber}. Must be between 1 and 13.`)
      }

      return {
        district,
        store,
        district_q1_jobs: districtQ1Jobs,
        pct_of_district: pctOfDistrict,
        store_q1_job_forecast: storeQ1Forecast,
        week_number: weekNumber,
        jobs_needed: jobsNeeded,
        workroom,
      }
    })

    // Upsert forecasts (update if exists, insert if new)
    const { data: insertedForecasts, error: upsertError } = await supabase
      .from('lowes_store_weekly_forecasts')
      .upsert(validForecasts, {
        onConflict: 'district,store,week_number',
        ignoreDuplicates: false
      })
      .select()

    if (upsertError) {
      console.error('Error upserting store weekly forecasts:', upsertError)
      return NextResponse.json(
        { 
          error: 'Failed to save store weekly forecasts',
          details: upsertError.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: insertedForecasts?.length || 0,
      message: `Successfully saved ${insertedForecasts?.length || 0} store weekly forecast records`
    })
  } catch (error: any) {
    console.error('Error in POST /api/lowes-store-weekly-forecasts:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
