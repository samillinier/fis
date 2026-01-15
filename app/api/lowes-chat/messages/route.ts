// API Route for Lowe's Chat Messages
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = authHeader.replace('Bearer ', '')
    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('lowes_chat_conversations')
      .select('created_by')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Allow access for:
    // 1. User who created the conversation
    // 2. Lowe's pricing team (any authenticated user - access control at application level)
    // Always allow access if userEmail is provided (authentication handled at app level)
    const hasAccess = true // All authenticated requests can view messages

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('lowes_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-chat/messages:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

  // POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const body = await request.json()

    const { conversationId, messageText, senderName, senderRole, senderEmail } = body

    // Allow both authenticated users (via header) and Lowe's team (via senderEmail in body)
    const userEmail = senderEmail || (authHeader ? authHeader.replace('Bearer ', '') : null)
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!conversationId || !messageText) {
      return NextResponse.json(
        { error: 'conversationId and messageText are required' },
        { status: 400 }
      )
    }

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('lowes_chat_conversations')
      .select('id, created_by, category')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Allow access: either creator or pricing team member
    const isCreator = conversation.created_by === userEmail
    const isPricingTeam = senderRole === 'pricing_team'
    
    if (!isCreator && !isPricingTeam && !userEmail) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create message
    const { data: message, error } = await supabase
      .from('lowes_chat_messages')
      .insert({
        conversation_id: conversationId,
        message_text: messageText.trim(),
        sender_email: userEmail,
        sender_name: senderName || userEmail,
        sender_role: senderRole || 'user'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Create audit log entry
    await supabase
      .from('lowes_chat_audit_logs')
      .insert({
        conversation_id: conversationId,
        action_type: 'message_sent',
        action_description: `Message sent: ${messageText.substring(0, 100)}`,
        user_email: userEmail,
        user_name: senderName || userEmail,
        metadata: {
          message_id: message.id,
          category: conversation.category
        }
      })

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Error in POST /api/lowes-chat/messages:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
