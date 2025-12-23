// Test endpoint to verify database connection and save functionality
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    const userId = await ensureUserExists(userEmail)

    console.log(`🧪 [TEST] Testing save for user: ${userEmail} (ID: ${userId})`)

    // Test 1: Check if tables exist
    const { error: tableCheckError } = await supabase
      .from('visual_data')
      .select('id')
      .limit(1)

    if (tableCheckError && tableCheckError.message?.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'visual_data table does not exist',
        message: 'Please run database/separate-visual-survey-tables.sql'
      }, { status: 500 })
    }

    // Test 2: Try inserting a test record
    const testRecord = {
      user_id: userId,
      workroom_name: 'TEST_WORKROOM',
      store: 'TEST_STORE',
      sales: 1000.00,
      labor_po: 500.00,
      vendor_debit: 200.00,
      category: 'TEST',
      cycle_time: 5,
      data_jsonb: {
        name: 'TEST_WORKROOM',
        store: 'TEST_STORE',
        sales: 1000,
        laborPO: 500,
        vendorDebit: 200
      }
    }

    const { error: insertError, data: insertedData } = await supabase
      .from('visual_data')
      .insert(testRecord)
      .select()

    if (insertError) {
      console.error('❌ [TEST] Insert error:', insertError)
      return NextResponse.json({
        error: 'Failed to insert test record',
        details: insertError.message,
        code: insertError.code,
        userId,
        userEmail
      }, { status: 500 })
    }

    // Test 3: Verify we can read it back
    const { data: readBack, error: readError } = await supabase
      .from('visual_data')
      .select('*')
      .eq('user_id', userId)
      .eq('workroom_name', 'TEST_WORKROOM')

    if (readError) {
      return NextResponse.json({
        error: 'Failed to read back test record',
        details: readError.message
      }, { status: 500 })
    }

    // Clean up test record
    await supabase
      .from('visual_data')
      .delete()
      .eq('id', insertedData[0].id)

    return NextResponse.json({
      success: true,
      message: 'Database connection and save functionality working!',
      userId,
      userEmail,
      testRecordInserted: insertedData[0],
      testRecordReadBack: readBack[0]
    })
  } catch (error: any) {
    console.error('❌ [TEST] Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}





