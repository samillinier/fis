// Vercel Postgres Client
// This file provides a centralized database client for Vercel Postgres

import { sql } from '@vercel/postgres'

export { sql }

// Helper function to get user ID from email
export function getUserIdFromEmail(email: string): string {
  // Use email as user_id (since we use Microsoft Auth)
  // You can hash it or use it directly
  return email
}

// Helper function to ensure user exists
export async function ensureUserExists(email: string, name?: string): Promise<string> {
  try {
    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `
    
    if (existingUser.rows.length > 0) {
      return existingUser.rows[0].id
    }
    
    // Create new user
    const newUser = await sql`
      INSERT INTO users (email, name)
      VALUES (${email}, ${name || null})
      RETURNING id
    `
    
    return newUser.rows[0].id
  } catch (error: any) {
    // If table doesn't exist, create it
    if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
      console.error('Database tables not found. Please run database/vercel-postgres-schema.sql in Vercel Postgres SQL Editor.')
      throw new Error('Database tables not found. Please run database/vercel-postgres-schema.sql')
    }
    console.error('Error ensuring user exists:', error)
    throw error
  }
}

