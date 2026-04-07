# Lowe's Pro Connect - Narration Script

## Introduction

Welcome to Lowe's Pro Connect—a secure chat platform designed to connect Lowe's team members with FIS POD pricing experts for flooring quote validation. In today's fast-paced flooring industry, getting accurate pricing validation and expert guidance shouldn't be complicated. That's why we built Lowe's Pro Connect.

The system supports unlimited groups, allowing administrators to create custom teams and assign members to groups. Groups are assigned to users, not conversations—when a Lowe's team member creates a conversation, their assigned group name is displayed, helping FIS POD experts understand which team the request is coming from.

Imagine you're a Lowe's team member working on a flooring project. You have a quote that needs validation, or you're comparing pricing with competitors. Instead of sending emails back and forth, waiting for responses, and losing track of conversations, Lowe's Pro Connect gives you a streamlined, organized way to get the answers you need—fast.

---

## The Problem We Solved

Before Lowe's Pro Connect, validating flooring quotes was a fragmented process. Lowe's team members would send emails, make phone calls, and struggle to keep track of which conversations were about which quotes. Information got lost, responses were delayed, and there was no clear way to see the status of a request.

We needed a solution that would:
- Keep all conversations organized and searchable
- Provide instant visibility into quote validation requests
- Ensure secure, district and store-scoped communication
- Create a complete audit trail for accountability
- Make it easy for Lowe's team members and FIS POD experts to collaborate

---

## What is Lowe's Pro Connect?

Lowe's Pro Connect is a secure, gated chat system specifically designed for flooring quote validation. Think of it as your command center for pricing questions, quote reviews, and expert guidance.

The system works with two types of users:
- **Lowe's Team Members**: Create conversations, ask questions, and receive responses. They authenticate with email and password, and their conversations are scoped to their district and store number.
- **FIS POD Experts**: Respond to conversations through a chat widget. They authenticate with Microsoft, and their access is controlled by administrators who can enable or disable chat widget access per user.

Groups are assigned to users, not conversations. Administrators can create unlimited groups—like "Flooring Validation Chat," "Floor Store," or any custom team name—and assign Lowe's team members to these groups. When a conversation is created, it displays the group name of the creator, helping FIS POD experts understand which team is making the request.

---

## How It Works: The Lowe's Team Member Journey

Let's walk through what happens when a Lowe's team member needs help with a quote.

### Step 1: Getting Started

First, you need an account. If you're new, you'll sign up at the login page with:
- Your Lowe's email address
- Your full name
- Your role (like Project Coordinator, General Manager, or President)
- Your district (e.g., "District 123")
- Your store number (e.g., "Store 456")
- A password (minimum 6 characters)

Once you sign up, you're automatically logged in and redirected to the dashboard. Your account information is stored securely in the database, and administrators can assign you to a group later if needed.

### Step 2: Accessing the Dashboard

After logging in, you land on the dashboard—a clean, intuitive interface that shows all your conversations. The dashboard automatically refreshes every 30 seconds to show new messages and updates.

**Important**: You only see conversations from your exact district and store number. If your district is "District 123" and your store number is "Store 456," you'll only see conversations created by users with those exact values. This ensures privacy and keeps conversations organized.

### Step 3: Creating a Conversation

When you have a quote that needs validation, you click the "New Conversation" button in the top-right corner. A modal form appears, pre-filled with your account information. You need to fill in:

**Required Fields:**
- **Quote or IMS Reference Number**: The reference number for the quote you're validating
- **Flooring Category**: Select from dropdown:
  - Carpet
  - LVP (Luxury Vinyl Plank)
  - Tile
  - Hardwood
  - Laminate
  - Vinyl Sheet
  - Other

**What You're Questioning** (must select at least one):
- ☐ Scope
- ☐ SOW Line Item
- ☐ Pricing Delta
- ☐ Competitor Comparison

You can check multiple boxes if you have several types of questions. The form validates that all required fields are filled before you can submit.

### Step 4: Starting the Chat

After you click "Create Conversation," the system:
1. Generates a unique conversation key (a shareable link identifier)
2. Creates the conversation record in the database
3. Creates an audit log entry
4. Adds a system message to the conversation
5. Redirects you to the chat page

You're immediately taken to the chat interface where you can start typing your question.

### Step 5: Sending Messages

Now you're in the chat. Just type your question like you would in any messaging app. For example: "Can you validate this quote for a 2,000 square foot LVP installation? The customer is comparing it to Home Depot's pricing."

Click Send, and your message goes out. The chat automatically checks for new messages, so when someone responds, you'll see it right away—no need to refresh or keep checking.

### Step 6: Managing Your Conversations

When you go back to your dashboard, you'll see all your conversations laid out like cards. Each one shows everything you need to know at a glance: who you're talking with, the quote number, what category it's about, and whether it's still open or has been resolved.

Need to find something specific? Use the filters at the top to narrow things down. Want to see only your Carpet conversations? Filter by category. Looking for conversations that are still open? Filter by status. It's that simple.

If you need to remove a conversation, just hover over it and click the delete icon.

---

## How It Works: The FIS POD Expert Journey

Now let's see what happens on the other side—when FIS POD experts receive questions from Lowe's team members.

### Authentication and Access

FIS POD experts authenticate using Microsoft authentication (the same system used for the main FIS dashboard). However, not all FIS users can access the chat widget—administrators must enable chat widget access for each user individually.

When an FIS user logs into the main dashboard, the system checks if they have `chat_widget_enabled` set to `true` in their user record. If they do, they'll see a green chat button in the bottom-right corner of every page.

### The Chat Widget

The chat widget appears as a green floating button in the bottom-right corner. When clicked, it opens a chat window showing all active conversations.

**Conversation Filtering for FIS Users:**
- **Admins**: See all conversations across all districts and stores
- **Non-Admin Staff**: Only see conversations mapped to their assigned workroom. The system maps store numbers to workrooms, so if a conversation is from Store 456 and Store 456 maps to "Ocala" workroom, only FIS users assigned to "Ocala" workroom will see it.
- **Users without workroom assignment**: See no conversations (they must set their workroom in their profile first)

### Using the Chat Widget

When you open the chat widget, you see a list of conversations. The widget:
- Highlights conversations with unread messages
- Shows unread counts as badges
- Sorts conversations by most recent activity
- Displays conversation details like quote number, category, and question types

When you click on a conversation, you see:
- The full conversation history with message bubbles
- Conversation details (quote number, category, question types, user info)
- A status dropdown to update the conversation status
- An input field to type and send responses

### Responding to Questions

When you click on a conversation, you can:
1. Click "Show Details" to see the full intake form information
2. View the conversation history—your messages appear in green bubbles on the right, Lowe's messages appear in white bubbles on the left
3. Type your response in the input field at the bottom
4. Click Send (or press Enter) to send your message
5. Update the conversation status using the dropdown (Open, In Progress, Resolved, Closed)

The chat widget automatically refreshes to show new messages, so you don't need to manually refresh.

### Online Status Indicator

The system shows a green dot indicator next to the conversation title when a Lowe's team member is online. This helps you know if someone is actively waiting for a response.

---

## Group Management

Groups are a key feature of Lowe's Pro Connect, but they work differently than you might expect.

### How Groups Work

- **Groups are assigned to users, not conversations**: When an administrator creates a group and assigns Lowe's team members to it, those members belong to that group. When they create a conversation, the conversation displays their group name.

- **Unlimited groups**: Administrators can create as many groups as needed—"Flooring Validation Chat," "Floor Store," "Regional Team A," or any custom name.

- **Group assignment**: Administrators assign Lowe's team members to groups through the profile management interface. A user can belong to one group at a time.

- **Group display**: When a conversation is created, the system looks up the creator's group assignment and displays the group name on the conversation card and in the chat interface.

### Creating and Managing Groups

Administrators can:
- Create new groups with custom names and descriptions
- View all groups and their members
- Assign Lowe's team members to groups
- Remove members from groups
- Delete groups (which removes all member assignments)

---

## The Technology Behind It

Lowe's Pro Connect is built on modern, reliable technology:

- **Frontend**: Next.js 14 with React, providing a fast, responsive user experience
- **Backend**: Next.js API routes handling all server-side logic securely
- **Database**: Supabase (PostgreSQL) storing all conversations, messages, users, groups, and audit logs
- **Authentication**: 
  - Lowe's users: Email/password stored in `lowes_team_members` table with password hashing
  - FIS users: Microsoft authentication via `authorized_users` table
- **Real-time Updates**: Polling-based system (dashboard refreshes every 30 seconds, chat polls every 5 seconds)

### Data Storage

All data is stored securely in Supabase:
- **Conversations**: Stored in `lowes_chat_conversations` table with district, store number, quote number, category, question types, and status
- **Messages**: Stored in `lowes_chat_messages` table with conversation ID, message text, sender information, and timestamps
- **Audit Logs**: Every action is logged in `lowes_chat_audit_logs` table for complete accountability
- **Groups**: Stored in `lowes_groups` table
- **Group Memberships**: Stored in `lowes_group_members` table linking users to groups

---

## Key Features That Make It Special

### Security and Scoping

- **District and Store Scoping**: Lowe's users only see conversations from their exact district and store number combination. This ensures privacy and keeps conversations organized.

- **Workroom Filtering**: FIS users see conversations filtered by their assigned workroom (mapped from store numbers). Admins see everything.

- **Access Control**: FIS users must have chat widget access enabled by an administrator to see the chat widget.

- **Password Security**: Lowe's user passwords are hashed using bcrypt before storage.

### Category-Based Organization

When you select a flooring category, the system automatically tags the conversation. This allows you to filter conversations by category on the dashboard and helps FIS POD experts understand what type of quote they're reviewing.

### Flexible Group System

Administrators can create unlimited groups and assign Lowe's team members to them. Groups help organize teams and provide context about which team is making a request. The group name is displayed on conversations but doesn't affect who can see the conversation—that's controlled by district/store scoping for Lowe's users and workroom filtering for FIS users.

### Full Audit Trail

Every action is logged:
- Conversation creation
- Message sent/received
- Status changes
- Group assignments

All logs include timestamps, user information, and action details, creating complete accountability.

### Shareable Conversation Links

Each conversation has a unique `conversation_key` that can be used to create shareable links. The format is `/lowes/chat/[conversationId]` or using the key parameter. This allows conversations to be referenced and shared easily.

### Auto-Refresh System

- **Dashboard**: Refreshes every 30 seconds to show new conversations and updates
- **Chat Page**: Polls for new messages every 5 seconds
- **Chat Widget**: Automatically refreshes to show new messages

This keeps conversations feeling responsive without requiring manual refreshes.

---

## Real-World Impact

Let's talk about what this means in practice.

**For Lowe's Team Members:**
- No more lost emails or forgotten conversations
- Clear visibility into which quotes are being validated
- Fast responses from FIS POD experts
- Organized history of all your quote validations
- District and store scoping keeps conversations private and relevant

**For FIS POD Experts:**
- All conversations in one place (filtered by workroom for non-admins)
- Easy to see which conversations need attention
- Complete context for every question (quote number, category, question types)
- Efficient workflow with status tracking
- Chat widget accessible from any page

**For Administrators:**
- Create unlimited groups to organize teams
- Assign users to groups for better organization
- Control chat widget access per user
- Monitor all conversations (admins see everything)
- Complete audit trail for accountability

**For the Business:**
- Faster quote validations mean faster sales
- Better organization means fewer mistakes
- Complete audit trail ensures accountability
- Scalable system that grows with the business
- Secure, scoped conversations protect sensitive information

---

## Best Practices

To get the most out of Lowe's Pro Connect, here are some best practices:

**For Lowe's Team Members:**
- Be specific in your questions—include quote numbers and details
- Fill out all required fields in the intake form accurately
- Use the correct district and store number (this affects who can see your conversations)
- Update conversation status as things progress (if you have permission)
- Use filters to find conversations quickly
- Check regularly for responses (dashboard refreshes every 30 seconds)
- Always sign out when you're done

**For FIS POD Experts:**
- Respond promptly to new conversations
- Be clear and helpful in your responses
- Reference quote numbers in your messages
- Update status to keep conversations organized
- Review conversation details before responding
- Set your workroom in your profile if you're not seeing conversations

**For Administrators:**
- Create groups that match your organizational structure
- Assign Lowe's team members to appropriate groups
- Enable chat widget access for FIS users who need it
- Set workroom assignments for FIS users so they see the right conversations
- Monitor group activity and conversations
- Use the audit logs to track system usage

---

## Technical Details

### API Endpoints

- `GET /api/lowes-chat/conversations/all` - Fetch conversations (filtered by district/store for Lowe's users, workroom for FIS users)
- `POST /api/lowes-chat/conversations` - Create new conversation
- `GET /api/lowes-chat/conversations/[id]` - Get specific conversation
- `DELETE /api/lowes-chat/conversations/[id]` - Delete conversation
- `GET /api/lowes-chat/messages?conversationId=xxx` - Fetch messages for a conversation
- `POST /api/lowes-chat/messages` - Send a new message
- `GET /api/lowes-groups` - Get all groups (admin only)
- `POST /api/lowes-groups` - Create new group (admin only)
- `GET /api/chat-widget-access` - Check if user has chat widget access

### Conversation Statuses

- **Open**: New conversation, awaiting response
- **In Progress**: Currently being worked on
- **Resolved**: Issue has been resolved
- **Closed**: Conversation complete

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
- SOW Line Item
- Pricing Delta
- Competitor Comparison

---

## Conclusion

Lowe's Pro Connect isn't just a chat system—it's a complete solution for flooring quote validation. It brings together Lowe's team members and FIS POD experts in a secure, organized, and efficient way.

The system's flexible group management allows organizations to structure teams however they need, while district/store scoping and workroom filtering ensure conversations are seen by the right people. With unlimited groups, administrators can scale the system to fit any organizational structure.

Whether you're asking your first question, responding to your hundredth conversation, or managing groups as an administrator, Lowe's Pro Connect makes the process smooth, transparent, and effective.

So the next time you have a quote that needs validation, don't send an email. Don't make a phone call. Open Lowe's Pro Connect, create a conversation, and get the expert guidance you need—fast.

Thank you for using Lowe's Pro Connect. We're here to make your work easier, your responses faster, and your collaborations more effective.

---

*This narration is based on the actual implementation of Lowe's Pro Connect as built in the codebase.*
