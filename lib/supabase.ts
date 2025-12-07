import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Database features will not work.')
}

// Validate key format (optional - just for better error messages)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ') && !supabaseAnonKey.startsWith('sb_')) {
  console.warn('Warning: Supabase key format looks unusual. Standard keys start with "eyJ..." (JWT tokens).')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Server-side client for API routes
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  if (!url || !key) {
    console.error('Missing Supabase configuration for server client')
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

