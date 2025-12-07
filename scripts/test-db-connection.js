// Test database connection
// Run with: node scripts/test-db-connection.js

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\nTesting connection...')
    
    // Try to query a table (this will fail if tables don't exist, but will confirm connection)
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Connection works, but tables might not exist yet.')
        console.log('   Please run the database schema (Step 3) in Supabase SQL Editor.')
        return false
      }
      console.error('❌ Connection error:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful!')
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('\n✅ Database is ready!')
  } else {
    console.log('\n⚠️  Please check your configuration and database schema.')
  }
  process.exit(success ? 0 : 1)
})

