// API Route - Check Database Connection (Supabase)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        connected: false,
        error: 'Supabase environment variables not found',
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.',
        steps: [
          '1. Go to Supabase Dashboard → Settings → API',
          '2. Copy your Project URL and API keys',
          '3. Add them to .env.local (for local dev) or Vercel Environment Variables (for production)',
          '4. Restart your dev server or redeploy'
        ]
      }, { status: 200 })
    }

    // Try to query the database
    try {
      // Test connection by checking if we can query
      const { error: testError } = await supabase.from('users').select('count').limit(1)
      
      if (testError && (testError.message.includes('relation') || testError.message.includes('does not exist'))) {
        return NextResponse.json({
          connected: true,
          supabaseUrl: supabaseUrl.substring(0, 30) + '...',
          tables: {
            users: false,
            workroom_data: false,
            historical_data: false
          },
          missingTables: ['users', 'workroom_data', 'historical_data'],
          message: 'Database connected but tables not found. Please run database/schema.sql in Supabase SQL Editor.'
        })
      }

      if (testError) {
        throw testError
      }
      
      // Check if tables exist
      const tables = ['users', 'workroom_data', 'historical_data']
      const tableChecks = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase.from(table).select('count').limit(1)
          return { table, exists: !error || !error.message.includes('does not exist') }
        })
      )

      const existingTables = tableChecks.filter(t => t.exists).map(t => t.table)
      const missingTables = tables.filter(table => !existingTables.includes(table))

      return NextResponse.json({
        connected: true,
        supabaseUrl: supabaseUrl.substring(0, 30) + '...',
        tables: {
          users: existingTables.includes('users'),
          workroom_data: existingTables.includes('workroom_data'),
          historical_data: existingTables.includes('historical_data')
        },
        missingTables: missingTables.length > 0 ? missingTables : null,
        message: missingTables.length > 0 
          ? `Database connected but missing tables: ${missingTables.join(', ')}. Please run database/schema.sql in Supabase SQL Editor.`
          : '✅ Database connected and all tables exist!'
      })
    } catch (dbError: any) {
      return NextResponse.json({
        connected: false,
        error: 'Database connection failed',
        message: dbError?.message || 'Could not connect to database',
        details: dbError?.message?.includes('relation') || dbError?.message?.includes('does not exist')
          ? 'Database tables not found. Please run database/schema.sql in Supabase SQL Editor.'
          : 'Check your Supabase connection string and API keys.'
      }, { status: 200 })
    }
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error?.message || 'Unknown error',
      message: 'Could not check database connection'
    }, { status: 200 })
  }
}
