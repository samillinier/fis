// API Route for Lowe's Chat Conversations
import { NextRequest, NextResponse } from 'next/server'
import { supabase, ensureUserExists } from '@/lib/supabase'
import { randomBytes } from 'crypto'

// GET - Fetch conversations for a user or by conversation key
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const conversationKey = searchParams.get('key')

    // If key provided, get that specific conversation
    if (conversationKey) {
      const { data: conversation, error } = await supabase
        .from('lowes_chat_conversations')
        .select('*')
        .eq('conversation_key', conversationKey)
        .single()

      if (error) {
        console.error('Error fetching conversation:', error)
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      return NextResponse.json({ conversation })
    }

    // Otherwise, get all conversations for this user
    const { data: conversations, error } = await supabase
      .from('lowes_chat_conversations')
      .select('*')
      .eq('created_by', userEmail)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-chat/conversations:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new conversation with intake data
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    const body = await request.json()

    // Validate required intake fields
    const requiredFields = [
      'lowesEmail',
      'name',
      'role',
      'district',
      'storeNumber',
      'quoteImsNumber',
      'flooringCategory',
      'questionTypes'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Generate unique conversation key (shareable link)
    // Use crypto to generate a URL-safe random string
    const conversationKey = randomBytes(9).toString('base64url') // e.g., "abc123xyz456"

    // Create conversation with intake data
    const { data: conversation, error } = await supabase
      .from('lowes_chat_conversations')
      .insert({
        conversation_key: conversationKey,
        lowes_email: body.lowesEmail.trim(),
        user_name: body.name.trim(),
        user_role: body.role.trim(),
        district_store: `${body.district.trim()} / Store ${body.storeNumber.trim()}`,
        quote_ims_number: body.quoteImsNumber.trim(),
        flooring_category: body.flooringCategory.trim(),
        question_types: Array.isArray(body.questionTypes) ? body.questionTypes : [body.questionTypes],
        category: body.flooringCategory.trim(), // For routing
        created_by: userEmail,
        status: 'open'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    // Create audit log entry
    await supabase
      .from('lowes_chat_audit_logs')
      .insert({
        conversation_id: conversation.id,
        action_type: 'created',
        action_description: `Conversation created: ${body.flooringCategory} quote`,
        user_email: userEmail,
        user_name: body.name.trim(),
        metadata: {
          flooring_category: body.flooringCategory,
          quote_number: body.quoteImsNumber
        }
      })

    // Create initial system message
    await supabase
      .from('lowes_chat_messages')
      .insert({
        conversation_id: conversation.id,
        message_text: `Conversation started. Quote/IMS: ${body.quoteImsNumber}. Category: ${body.flooringCategory}.`,
        sender_email: 'system',
        sender_name: 'System',
        sender_role: 'system',
        is_system_message: true
      })

    return NextResponse.json({
      conversation,
      conversationKey
    })
  } catch (error: any) {
    console.error('Error in POST /api/lowes-chat/conversations:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
