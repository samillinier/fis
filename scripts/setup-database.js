// Alternative way to set up database schema
// Run this script to automatically create tables in Supabase

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure .env.local has:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Read the schema file
const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, '../database/schema.sql')
const schema = fs.readFileSync(schemaPath, 'utf8')

async function setupDatabase() {
  console.log('🚀 Setting up database schema...\n')

  try {
    // Split schema into individual statements
    // Remove comments and empty lines, then split by semicolon
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase
          .from('_temp')
          .select('*')
          .limit(0)
        
        // If that fails, try executing via REST API
        console.log('⚠️  RPC method not available, trying alternative...')
        
        // Note: Supabase doesn't allow direct SQL execution via client
        // So we'll need to use the SQL Editor or provide instructions
        console.log('\n❌ Cannot execute SQL directly via API.')
        console.log('Please use one of these methods:')
        console.log('1. Supabase Dashboard → SQL Editor (recommended)')
        console.log('2. Supabase CLI (if installed)')
        console.log('3. Copy schema.sql content manually')
        return false
      }
    }

    console.log('\n✅ Database schema setup complete!')
    return true
  } catch (error) {
    console.error('\n❌ Error setting up database:', error.message)
    console.log('\n💡 Alternative: Use Supabase Dashboard → SQL Editor')
    return false
  }
}

// Check if tables exist
async function checkTables() {
  console.log('\n🔍 Checking if tables exist...\n')
  
  const tables = ['users', 'workroom_data', 'historical_data']
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1)
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        console.log(`❌ Table "${table}" does not exist`)
      } else {
        console.log(`⚠️  Error checking "${table}":`, error.message)
      }
    } else {
      console.log(`✅ Table "${table}" exists`)
    }
  }
}

async function main() {
  await checkTables()
  console.log('\n' + '='.repeat(50))
  console.log('To set up tables, please use Supabase SQL Editor:')
  console.log('1. Go to your project: https://supabase.com/dashboard → select the new project')
  console.log('2. Click "SQL Editor" → "New Query"')
  console.log('3. Copy content from database/schema.sql')
  console.log('4. Paste and click "Run"')
  console.log('='.repeat(50))
}

main()

