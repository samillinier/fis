// Quick test to verify database connection
// Run with: node scripts/test-connection.js

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Prefer process.env (e.g., when supplied inline); fall back to .env.local
function loadEnv() {
  const env = { ...process.env }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const envPath = path.join(__dirname, '..', '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim()
          if (!env[key]) {
            env[key] = value
          }
        }
      })
    }
  }
  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n📊 Testing database connection...\n')
    
    // Test 1: Check if workroom_data table exists
    console.log('1. Checking workroom_data table...')
    const { data: workroomData, error: workroomError } = await supabase
      .from('workroom_data')
      .select('count')
      .limit(1)
    
    if (workroomError) {
      if (workroomError.message.includes('relation') || workroomError.message.includes('does not exist')) {
        console.log('   ❌ Table "workroom_data" does not exist')
        console.log('   💡 Run the database schema SQL in Supabase SQL Editor')
        return false
      }
      console.log('   ⚠️  Error:', workroomError.message)
      return false
    }
    console.log('   ✅ Table "workroom_data" exists')
    
    // Test 2: Check historical_data table
    console.log('\n2. Checking historical_data table...')
    const { data: historicalData, error: historicalError } = await supabase
      .from('historical_data')
      .select('count')
      .limit(1)
    
    if (historicalError) {
      if (historicalError.message.includes('relation') || historicalError.message.includes('does not exist')) {
        console.log('   ❌ Table "historical_data" does not exist')
        return false
      }
      console.log('   ⚠️  Error:', historicalError.message)
      return false
    }
    console.log('   ✅ Table "historical_data" exists')
    
    // Test 3: Check users table
    console.log('\n3. Checking users table...')
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (usersError) {
      if (usersError.message.includes('relation') || usersError.message.includes('does not exist')) {
        console.log('   ❌ Table "users" does not exist')
        return false
      }
      console.log('   ⚠️  Error:', usersError.message)
      return false
    }
    console.log('   ✅ Table "users" exists')
    
    console.log('\n✅ All tables exist! Database is ready!')
    return true
  } catch (error) {
    console.error('\n❌ Connection error:', error.message)
    return false
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('\n🎉 Database connection successful!')
    console.log('✅ Your database is ready to use!')
    console.log('\nNext: Restart your server and test uploading data.')
  } else {
    console.log('\n⚠️  Please check your database configuration.')
  }
  process.exit(success ? 0 : 1)
})

