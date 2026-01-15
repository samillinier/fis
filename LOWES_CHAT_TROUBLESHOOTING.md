# Lowe's Chat - Troubleshooting Guide

## How to Access the Chat

1. **Via Sidebar**: Click "Lowe's Chat" in the left sidebar
2. **Via URL**: Navigate to `/lowes-chat` in your browser
3. **Direct Link**: `http://localhost:3000/lowes-chat` (or your domain)

## What You Should See

### Step 1: Intake Form (First Time)
When you first visit `/lowes-chat`, you'll see:
- ✅ A form with required fields:
  - Lowe's Email
  - Name + Role
  - District / Store #
  - Quote or IMS reference number
  - Flooring category (dropdown)
  - What you're questioning (checkboxes)

### Step 2: After Submitting Intake
- ✅ "Starting your conversation..." loading message
- ✅ Then the chat box appears with:
  - Header showing "Lowe's Pricing Chat"
  - Message area (starts empty or with system message)
  - Input box at bottom to type messages

### Step 3: Chat Box Features
- ✅ Message bubbles (your messages on right, others on left)
- ✅ Timestamps on each message
- ✅ Input field to type new messages
- ✅ "Send" button
- ✅ Shareable link section below chat

## Common Issues & Fixes

### Issue 1: "I don't see anything / Blank page"

**Check:**
1. Are you logged in? (Must be authenticated)
2. Check browser console (F12) for errors
3. Check if database tables exist (see below)

**Fix:**
- Make sure you're logged in with Microsoft
- Run the database schema (see Setup below)

### Issue 2: "I only see the intake form, no chat box"

**This is normal!** The chat box only appears AFTER you:
1. Fill out the intake form completely
2. Click "Start Chat"
3. Wait for it to create the conversation

**If form submission fails:**
- Check browser console (F12) for errors
- Verify database tables are created (see Setup)

### Issue 3: "Error: Failed to create conversation"

**Most likely cause:** Database tables don't exist

**Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste contents of `database/lowes-chat-schema.sql`
3. Click Run
4. Refresh the page and try again

### Issue 4: "Error loading conversation"

**Causes:**
- Database tables not created
- Conversation not found (invalid key in URL)
- Network/API error

**Fix:**
- Verify database schema is run
- Try creating a new conversation (fill intake form again)

## Setup Checklist

Before using the chat, make sure:

- [ ] Database schema is run (`database/lowes-chat-schema.sql` in Supabase)
- [ ] You're logged in with Microsoft authentication
- [ ] Supabase environment variables are set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Testing the Chat

1. Navigate to `/lowes-chat`
2. Fill out intake form:
   - Email: your.email@lowes.com
   - Name: Test User
   - Role: Test Role
   - District/Store: Test 123
   - Quote/IMS: TEST-12345
   - Category: Carpet
   - Question types: Check at least one
3. Click "Start Chat"
4. Chat box should appear
5. Type a message and click "Send"
6. Message should appear in the chat

## Need Help?

If still having issues:
1. Check browser console (F12 → Console tab)
2. Check Network tab for failed API calls
3. Verify database tables exist in Supabase
4. Check server logs for errors
