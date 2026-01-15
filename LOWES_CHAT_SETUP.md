# Lowe's Pricing Chat System - Setup Guide

## Overview

A gated, logged, category-routed chat system for Lowe's pricing team to validate flooring quotes. Built with Next.js, Supabase, and Microsoft authentication.

## Features

✅ **Gated Access** - Requires Microsoft authentication  
✅ **Intake-First Flow** - Users must complete intake form before accessing chat  
✅ **Category Routing** - Conversations automatically tagged by flooring category  
✅ **Async Chat** - Message-based, not real-time  
✅ **Shareable Links** - Single link per conversation  
✅ **Full Audit Trail** - Every action is logged  
✅ **Clean UI** - Modern, professional chat interface  

## Setup Instructions

### Step 1: Run Database Schema

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Open the file: `database/lowes-chat-schema.sql`
3. Copy all SQL and paste into SQL Editor
4. Click **Run** to create tables:
   - `lowes_chat_conversations` - Stores conversation threads
   - `lowes_chat_messages` - Stores all messages
   - `lowes_chat_audit_logs` - Full audit trail

### Step 2: Verify API Routes

The following API routes are created:
- `GET /api/lowes-chat/conversations` - Fetch conversations
- `POST /api/lowes-chat/conversations` - Create new conversation
- `GET /api/lowes-chat/messages?conversationId=xxx` - Fetch messages
- `POST /api/lowes-chat/messages` - Send message

### Step 3: Access the Chat

1. Navigate to: `/lowes-chat`
2. User must be logged in with Microsoft
3. Complete intake form:
   - Lowe's Email
   - Name + Role
   - District / Store #
   - Quote or IMS reference number
   - Flooring category (carpet, LVP, tile, etc.)
   - What they're questioning (Scope, SOW line item, Pricing delta, Competitor comparison)

### Step 4: Share Conversations

Each conversation has a unique shareable link:
- Format: `/lowes-chat?key=abc123xyz456`
- Link is displayed in the chat interface
- Anyone with the link can access the conversation (when authenticated)

## Database Schema

### `lowes_chat_conversations`
- Stores conversation metadata and intake information
- Key fields: `conversation_key`, `flooring_category`, `category`, `status`

### `lowes_chat_messages`
- Stores all chat messages
- Key fields: `conversation_id`, `message_text`, `sender_email`, `created_at`

### `lowes_chat_audit_logs`
- Full audit trail of all actions
- Tracks: conversation creation, message sends, status changes, assignments

## Category Routing

Conversations are automatically categorized by `flooring_category`:
- Carpet
- LVP (Luxury Vinyl Plank)
- Tile
- Hardwood
- Laminate
- Vinyl Sheet
- Other

This allows the pricing team to filter and route conversations by category.

## Access Control

- **Authentication**: Microsoft SSO (existing auth system)
- **Authorization**: Uses existing user email from Microsoft
- **Shareable Links**: Accessible by anyone with the link (when authenticated)

## Usage Flow

1. User clicks shareable link OR navigates to `/lowes-chat`
2. If not logged in → Redirected to sign-in
3. If logged in → Shows intake form (if no conversation key in URL)
4. User fills intake form → Conversation created
5. Chat interface opens → User can send/receive messages
6. Messages poll every 10 seconds (async chat)
7. Full conversation history visible

## Audit Trail

Every action is logged:
- Conversation creation
- Message sent/received
- Status changes
- Assignments

View audit logs in `lowes_chat_audit_logs` table.

## Next Steps

- Add pricing team dashboard to view all conversations
- Add category filtering and search
- Add email notifications for new messages
- Add conversation status management (open, in_progress, resolved, closed)
