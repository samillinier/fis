// API Route to get a single conversation by ID and update its status
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const { data: conversation, error } = await supabase
      .from('lowes_chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching conversation:', error)
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error('Error in GET /api/lowes-chat/conversations/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update conversation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const body = await request.json()
    const { status } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (open, in_progress, resolved, closed)' },
        { status: 400 }
      )
    }

    // Update conversation status
    const updateData: any = { status }
    
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    } else if (status === 'closed') {
      updateData.closed_at = new Date().toISOString()
    }

    const { data: conversation, error } = await supabase
      .from('lowes_chat_conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation:', error)
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    // Create audit log entry
    const authHeader = request.headers.get('authorization')
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : 'system'
    
    await supabase
      .from('lowes_chat_audit_logs')
      .insert({
        conversation_id: conversationId,
        action_type: 'status_update',
        action_description: `Status changed to ${status}`,
        user_email: userEmail,
        metadata: { previous_status: body.previousStatus, new_status: status }
      })

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error('Error in PATCH /api/lowes-chat/conversations/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Get conversation details for audit log
    const { data: conversation } = await supabase
      .from('lowes_chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    // Delete conversation (cascade will delete messages and audit logs)
    const { error } = await supabase
      .from('lowes_chat_conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Error deleting conversation:', error)
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    // Create audit log entry before deletion
    const authHeader = request.headers.get('authorization')
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : 'system'
    
    await supabase
      .from('lowes_chat_audit_logs')
      .insert({
        conversation_id: conversationId,
        action_type: 'conversation_deleted',
        action_description: `Conversation deleted: ${conversation?.quote_ims_number || conversationId}`,
        user_email: userEmail,
        metadata: { conversation_data: conversation }
      })

    return NextResponse.json({ success: true, message: 'Conversation deleted successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/lowes-chat/conversations/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
