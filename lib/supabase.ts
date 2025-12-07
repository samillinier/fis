// Supabase Client
// This file provides a centralized Supabase client for database operations

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
}

// Create Supabase client with service_role key for server-side operations
// This bypasses RLS, but we handle security at the API layer by filtering by user_id
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to ensure user exists
export async function ensureUserExists(email: string, name?: string): Promise<string> {
  try {
    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return existingUser.id
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ email, name: name || null })
      .select('id')
      .single()

    if (insertError) {
      throw insertError
    }

    if (!newUser) {
      throw new Error('Failed to create user')
    }

    return newUser.id
  } catch (error: any) {
    // If table doesn't exist, provide helpful error
    if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
      console.error('Database tables not found. Please run database/schema.sql in Supabase SQL Editor.')
      throw new Error('Database tables not found. Please run database/schema.sql in Supabase SQL Editor.')
    }
    console.error('Error ensuring user exists:', error)
    throw error
  }
}

