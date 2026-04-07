import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists, getSharedAdminUserId } from '@/lib/supabase'

// GET - Fetch bills
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Use shared admin user ID (shared data model)
    const userId = await getSharedAdminUserId()

    // Fetch bills
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('txn_date', { ascending: false })

    if (error) {
      console.error('Error fetching bills:', error)
      return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
    }

    // Get the most recent file name
    const { data: latestBill } = await supabase
      .from('bills')
      .select('file_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      bills: bills || [],
      fileName: latestBill?.file_name || null,
    })
  } catch (error: any) {
    console.error('Error in GET /api/finance/bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Upload bills (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Check if user is admin
    const { data: actorData } = await supabase
      .from('authorized_users')
      .select('role, is_active')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()

    const isAdmin = actorData?.role === 'admin' && actorData?.is_active !== false

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin users can upload bills' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bills, fileName } = body

    if (!bills || !Array.isArray(bills)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    if (bills.length === 0) {
      return NextResponse.json({ error: 'No bills to save' }, { status: 400 })
    }

    // Use shared admin user ID (shared data model)
    const userId = await getSharedAdminUserId()

    console.log(`📥 [POST /api/finance/bills] Admin ${userEmail} uploading ${bills.length} bills`)

    // Delete all existing bills for this user
    const { error: deleteError } = await supabase
      .from('bills')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing bills:', deleteError)
      // Continue anyway - might be first upload
    }

    // Prepare bills for insertion
    const billsToInsert = bills.map((bill: any) => ({
      user_id: userId,
      ...bill,
      updated_at: new Date().toISOString(),
    }))

    // Insert new bills
    const { error: insertError } = await supabase
      .from('bills')
      .insert(billsToInsert)

    if (insertError) {
      console.error('Error inserting bills:', insertError)
      throw insertError
    }

    console.log(`✅ [POST /api/finance/bills] Successfully saved ${bills.length} bills`)

    return NextResponse.json({
      success: true,
      count: bills.length,
      fileName,
    })
  } catch (error: any) {
    console.error('Error in POST /api/finance/bills:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
