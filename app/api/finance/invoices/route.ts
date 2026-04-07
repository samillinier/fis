import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists, getSharedAdminUserId } from '@/lib/supabase'

// GET - Fetch invoices
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

    // Fetch invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('txn_date', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Get the most recent file name
    const { data: latestInvoice } = await supabase
      .from('invoices')
      .select('file_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      invoices: invoices || [],
      fileName: latestInvoice?.file_name || null,
    })
  } catch (error: any) {
    console.error('Error in GET /api/finance/invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Upload invoices (admin only)
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
        { error: 'Unauthorized: Only admin users can upload invoices' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { invoices, fileName } = body

    if (!invoices || !Array.isArray(invoices)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'No invoices to save' }, { status: 400 })
    }

    // Use shared admin user ID (shared data model)
    const userId = await getSharedAdminUserId()

    console.log(`📥 [POST /api/finance/invoices] Admin ${userEmail} uploading ${invoices.length} invoices`)

    // Delete all existing invoices for this user
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing invoices:', deleteError)
      // Continue anyway - might be first upload
    }

    // Prepare invoices for insertion
    const invoicesToInsert = invoices.map((invoice: any) => ({
      user_id: userId,
      ...invoice,
      updated_at: new Date().toISOString(),
    }))

    // Insert new invoices
    const { error: insertError } = await supabase
      .from('invoices')
      .insert(invoicesToInsert)

    if (insertError) {
      console.error('Error inserting invoices:', insertError)
      throw insertError
    }

    console.log(`✅ [POST /api/finance/invoices] Successfully saved ${invoices.length} invoices`)

    return NextResponse.json({
      success: true,
      count: invoices.length,
      fileName,
    })
  } catch (error: any) {
    console.error('Error in POST /api/finance/invoices:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
