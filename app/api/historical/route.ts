// API Route - Disabled (using localStorage only)
// This route is no longer used since we're using localStorage only
// Keeping it for compatibility but it returns empty responses

import { NextRequest, NextResponse } from 'next/server'

// GET - Return empty array (localStorage is used instead)
export async function GET(request: NextRequest) {
  // Return empty array - localStorage is used on client-side
  return NextResponse.json([])
}

// POST - No-op (localStorage is used instead)
export async function POST(request: NextRequest) {
  // Data is saved to localStorage on client-side, not via API
  return NextResponse.json({ success: true, message: 'Using localStorage only' })
}

// DELETE - No-op (localStorage is used instead)
export async function DELETE(request: NextRequest) {
  // Data is deleted from localStorage on client-side, not via API
  return NextResponse.json({ success: true, message: 'Using localStorage only' })
}
