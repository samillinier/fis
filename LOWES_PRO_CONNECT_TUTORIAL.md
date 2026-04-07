# Lowe's Pro Connect - Complete Tutorial

## Overview

**Lowe's Pro Connect** is a secure, gated chat system designed to facilitate communication between Lowe's Pro Connect team members and the FIS POD (Pricing Operations & Data) team. The system enables Lowe's team members to validate flooring quotes, ask pricing questions, and get expert assistance on flooring projects.

---

## What is Lowe's Pro Connect?

Lowe's Pro Connect is a **flooring validation chat platform** that allows:

- **Lowe's Team Members** to submit pricing questions and quote validations
- **FIS POD Team** to respond with expert guidance and pricing support
- **Secure, organized conversations** with full audit trails
- **Category-based routing** for efficient handling of different flooring types

---

## Key Features

### 🔐 **Secure Authentication**
- Email/password-based login system
- District and Store Number scoping
- Group-based access control

### 💬 **Async Chat System**
- Message-based conversations (not real-time)
- Auto-refresh every 10 seconds
- Full conversation history
- Shareable conversation links

### 📋 **Intake Form**
- Pre-filled with user information
- Quote/IMS number tracking
- Flooring category selection
- Question type tagging (Scope, SOW, Pricing, Competitor comparison)

### 📊 **Dashboard**
- View all conversations for your District/Store
- Filter by category and status
- Search functionality
- Status management (Open, In Progress, Resolved, Closed)

### 👥 **Team Management**
- Group assignments
- Profile settings
- Password management
- Role-based access

---

## How It Works

### Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Lowe's User    │────────▶│  Dashboard/Chat  │────────▶│   Supabase   │
│  (Browser)      │         │  (Next.js App)   │         │   Database   │
└─────────────────┘         └──────────────────┘         └──────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  FIS POD Widget  │
                            │  (Chat Widget)   │
                            └──────────────────┘
```

### Data Flow

1. **Lowe's User** creates a conversation via intake form
2. **Conversation** is stored in Supabase with metadata
3. **FIS POD Team** sees conversation in chat widget
4. **Messages** are exchanged asynchronously
5. **Status** is tracked and updated throughout the lifecycle

---

## For Lowe's Team Members

### Getting Started

#### Step 1: Create an Account

1. Navigate to the login page (`/lowes/login`)
2. Click **"Sign up"** link
3. Fill out the registration form:
   - **Full Name**: Your complete name
   - **Email**: Your Lowe's email address
   - **Role**: Your job title (e.g., "Project Coordinator", "General Manager")
   - **District**: Your district identifier (e.g., "District 123")
   - **Store Number**: Your store identifier (e.g., "Store 456")
   - **Password**: Minimum 6 characters
4. Click **"Sign Up"**
5. You'll be automatically logged in

#### Step 2: Access the Dashboard

After logging in, you'll see the **Dashboard** (`/lowes/dashboard`) with:
- List of all conversations for your District/Store
- Filter options (Category, Status)
- "New Conversation" button

### Creating a New Conversation

#### Step 1: Click "New Conversation"
- Located in the top-right corner of the dashboard

#### Step 2: Fill Out the Intake Form

The form is pre-filled with your profile information. You need to provide:

**Required Fields:**
- **Quote/IMS Number**: The reference number for the quote you're validating
- **Flooring Category**: Select from dropdown:
  - Carpet
  - LVP (Luxury Vinyl Plank)
  - Tile
  - Hardwood
  - Laminate
  - Vinyl Sheet
  - Other

**What You're Questioning** (check all that apply):
- ☐ **Scope** - Questions about project scope
- ☐ **SOW line item** - Statement of Work line item questions
- ☐ **Pricing delta** - Pricing differences or discrepancies
- ☐ **Competitor comparison** - Comparing with competitor pricing

#### Step 3: Submit and Start Chatting

1. Review your information
2. Click **"Start Conversation"**
3. You'll be redirected to the chat page
4. Type your question and click **Send**
5. The FIS POD team will respond

### Managing Conversations

#### Viewing Conversations

**On Dashboard:**
- See all conversations for your District/Store
- Click any conversation card to open it
- Use **Category filter** to narrow by flooring type
- Use **Status filter** to see Open, In Progress, Resolved, or Closed conversations

**In Chat View:**
- Full conversation history
- Message timestamps
- Status indicator
- Conversation details

#### Updating Conversation Status

In the chat page, use the status dropdown (top right):
- **Open** - New conversation, awaiting response
- **In Progress** - Currently being worked on
- **Resolved** - Issue has been resolved
- **Closed** - Conversation complete

### Profile Management

#### Access Profile Settings

1. Click your **name** in the top-right corner
2. Click **"Profile Settings"** from dropdown

#### Update Information

- Change Name, Role, District, or Store Number
- Click **"Save Changes"** to update

#### Change Password

1. Click **"Change Password"** button
2. Enter:
   - Current password
   - New password (min 6 characters)
   - Confirm new password
3. Click **"Save Changes"**

---

## For FIS POD Team

### Accessing the Chat Widget

The chat widget appears as a **green floating button** in the bottom-right corner of all pages in the FIS dashboard.

#### Opening the Widget

1. Look for the green chat button (bottom-right)
2. Click to open the chat window
3. The widget will show a list of active conversations

#### Using the Chat Widget

**Step 1: Select a Conversation**
- Click on any conversation from the list
- Conversations are sorted by most recent activity
- Unread conversations are highlighted

**Step 2: View Conversation Details**
- Click **"Show details"** to see:
  - Quote/IMS number
  - Flooring category
  - What they're questioning
  - User information (name, role, district/store)

**Step 3: Send Messages**
1. Type your response in the input field at the bottom
2. Click **Send** (or press Enter)
3. Your message appears on the right (green bubble)
4. Messages from Lowe's team appear on the left (white bubble)

### Chat Widget Features

#### Online Status Indicator
- **Green dot** next to chat title shows when a user is online
- Pulsing green dot = user is currently active
- Helps you know if someone is available

#### Message Display
- **Your messages**: Green bubbles on the right
- **Lowe's messages**: White bubbles on the left
- **Timestamps**: Shows when each message was sent
- **Profile photos**: Shows user photos when available

#### Auto-Refresh
- New messages appear automatically
- Chat updates every 10 seconds
- No manual refresh needed

#### Conversation List
- Shows all active conversations
- Sorted by most recent activity
- Click any conversation to switch
- Unread count badge shows new messages

---

## Technical Details

### Technology Stack

- **Frontend**: Next.js 14 (React)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom email/password system
- **Real-time**: Polling-based (10-second intervals)

### Database Schema

#### `lowes_chat_conversations`
Stores conversation metadata:
- `id` - Unique conversation ID
- `conversation_key` - Shareable link key
- `lowes_email` - User's email
- `user_name`, `user_role` - User information
- `district_store` - District and store identifier
- `quote_ims_number` - Reference number
- `flooring_category` - Category tag
- `question_types` - Array of question types
- `status` - Conversation status
- `created_at`, `last_message_at` - Timestamps

#### `lowes_chat_messages`
Stores all chat messages:
- `id` - Unique message ID
- `conversation_id` - Foreign key to conversation
- `message_text` - Message content
- `sender_email` - Who sent the message
- `sender_name`, `sender_role` - Sender information
- `created_at` - Timestamp
- `is_system_message` - Boolean flag

#### `lowes_chat_audit_logs`
Full audit trail:
- `id` - Log entry ID
- `conversation_id` - Related conversation
- `action_type` - Type of action (create, message, status_change, etc.)
- `user_email` - Who performed the action
- `details` - JSON details
- `created_at` - Timestamp

### API Endpoints

#### Conversations
- `GET /api/lowes-chat/conversations` - Fetch conversations (filtered by district/store)
- `GET /api/lowes-chat/conversations/all` - Fetch all conversations (for FIS team)
- `POST /api/lowes-chat/conversations` - Create new conversation
- `GET /api/lowes-chat/conversations/[id]` - Get specific conversation
- `DELETE /api/lowes-chat/conversations/[id]` - Delete conversation

#### Messages
- `GET /api/lowes-chat/messages?conversationId=xxx` - Fetch messages for a conversation
- `POST /api/lowes-chat/messages` - Send a new message

#### Authentication
- `POST /api/lowes-auth/login` - Login
- `POST /api/lowes-auth/signup` - Sign up
- `PATCH /api/lowes-team-members` - Update profile

### Security Features

1. **District/Store Scoping**: Lowe's users only see conversations from their district/store
2. **Group-Based Access**: FIS team members can be assigned to groups
3. **Audit Trail**: All actions are logged
4. **Password Hashing**: Passwords are hashed using bcrypt
5. **Authorization Headers**: API requests require authentication

---

## Best Practices

### For Lowe's Team Members

✅ **Be Specific**: Include quote numbers and detailed questions  
✅ **Update Status**: Keep conversations organized by updating status  
✅ **Use Filters**: Find conversations quickly using category/status filters  
✅ **Check Regularly**: Respond promptly to FIS team messages  
✅ **Sign Out**: Always sign out when done for security

### For FIS POD Team

✅ **Respond Promptly**: Check for new conversations regularly  
✅ **Be Clear**: Write clear, helpful responses  
✅ **Include Details**: Reference quote numbers when needed  
✅ **Update Status**: Mark conversations as resolved when complete  
✅ **Use Details**: Review conversation details before responding

---

## Troubleshooting

### Common Issues

#### "I can't log in"
- **Check**: Email and password are correct
- **Try**: Clearing browser cache
- **Contact**: System administrator if issue persists

#### "I can't see conversations"
- **Check**: Your District/Store number in Profile Settings
- **Verify**: You're logged in with the correct account
- **Note**: You only see conversations from your District/Store

#### "Messages not sending"
- **Check**: Internet connection
- **Try**: Refreshing the page
- **Check**: Browser console for errors (F12)

#### "Chat widget not appearing"
- **Check**: You're logged in as FIS team member
- **Verify**: You have chat access permissions
- **Check**: Browser console for errors (F12)

---

## Quick Reference

### Conversation Statuses
- **Open** - New conversation, awaiting response
- **In Progress** - Currently being worked on
- **Resolved** - Issue has been resolved
- **Closed** - Conversation complete

### Flooring Categories
- Carpet
- LVP (Luxury Vinyl Plank)
- Tile
- Hardwood
- Laminate
- Vinyl Sheet
- Other

### Question Types
- Scope
- SOW line item
- Pricing delta
- Competitor comparison

---

## Support

**Need Help?**
- Contact your system administrator
- Check the troubleshooting section above
- Review the audit logs for conversation history

---

## Summary

Lowe's Pro Connect is a powerful tool for facilitating communication between Lowe's team members and the FIS POD team. With its secure authentication, organized conversations, and intuitive interface, it streamlines the flooring quote validation process and ensures efficient collaboration.

**Key Takeaways:**
- Secure, district/store-scoped conversations
- Category-based routing for efficient handling
- Full audit trail for accountability
- Easy-to-use dashboard and chat interface
- Status management for organization

---

*Last Updated: 2024*
