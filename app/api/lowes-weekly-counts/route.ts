import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch weekly job counts for all districts or a specific district
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const district = searchParams.get('district')
    const week = searchParams.get('week')
    const category = searchParams.get('category')

    let query = supabase
      .from('lowes_weekly_job_counts')
      .select('*')
      .order('district', { ascending: true })
      .order('week_number', { ascending: true })
      .order('category', { ascending: true })

    if (district) {
      query = query.eq('district', district)
    }

    if (week) {
      query = query.eq('week_number', parseInt(week))
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching weekly counts:', error)
      return NextResponse.json({ error: 'Failed to fetch weekly counts' }, { status: 500 })
    }

    return NextResponse.json({ counts: data || [] })
  } catch (error) {
    console.error('Error in GET /api/lowes-weekly-counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save weekly job counts (from Vendor Gateway or manual entry)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const body = await request.json()

    // Allow both authenticated users and Vendor Gateway (with API key)
    const apiKey = request.headers.get('x-api-key')
    const isVendorGateway = apiKey === process.env.VENDOR_GATEWAY_API_KEY

    let userEmail: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      userEmail = authHeader.replace('Bearer ', '')
    }

    // Require either authentication or valid API key
    if (!userEmail && !isVendorGateway) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { counts } = body

    if (!counts || !Array.isArray(counts)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Validate and prepare data
    const validCounts = counts.map((count: any) => {
      // Normalize district: remove "District" prefix if present
      let district = String(count.district || '').trim()
      district = district.replace(/^district\s*/i, '').trim()
      
      return {
        district: district,
        week_number: parseInt(count.week_number),
        category: String(count.category).toUpperCase(),
        actual_count: parseInt(count.actual_count) || 0,
        week_start_date: count.week_start_date || null,
        week_end_date: count.week_end_date || null,
        data_source: count.data_source || (isVendorGateway ? 'vendor_gateway' : 'manual')
      }
    })

    // Validate week numbers
    for (const count of validCounts) {
      if (count.week_number < 1 || count.week_number > 13) {
        return NextResponse.json(
          { error: `Invalid week number: ${count.week_number}. Must be between 1 and 13.` },
          { status: 400 }
        )
      }
      if (!['CARPET', 'HSF', 'TILE', 'TOTAL'].includes(count.category)) {
        return NextResponse.json(
          { error: `Invalid category: ${count.category}. Must be CARPET, HSF, TILE, or TOTAL.` },
          { status: 400 }
        )
      }
    }

    // Upsert counts (update if exists, insert if new)
    const { data: insertedCounts, error: upsertError } = await supabase
      .from('lowes_weekly_job_counts')
      .upsert(validCounts, {
        onConflict: 'district,week_number,category,data_source',
        ignoreDuplicates: false
      })
      .select()

    if (upsertError) {
      console.error('Error upserting weekly counts:', upsertError)
      return NextResponse.json({ error: 'Failed to save weekly counts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: insertedCounts?.length || 0,
      message: `Successfully saved ${insertedCounts?.length || 0} weekly count records`,
      source: isVendorGateway ? 'vendor_gateway' : 'manual'
    })
  } catch (error) {
    console.error('Error in POST /api/lowes-weekly-counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
