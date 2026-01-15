-- Lowe's Pricing Chat System Database Schema
-- Run this SQL in Supabase SQL Editor

-- Chat Conversations Table
-- Stores each conversation thread with intake information
CREATE TABLE IF NOT EXISTS lowes_chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_key TEXT UNIQUE NOT NULL, -- Shareable link key (e.g., "abc123xyz")
  
  -- Intake Information (Required before chat access)
  lowes_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  district_store TEXT NOT NULL, -- District / Store #
  quote_ims_number TEXT NOT NULL, -- Quote or IMS reference number
  flooring_category TEXT NOT NULL, -- carpet, LVP, tile, etc.
  question_types TEXT[] NOT NULL, -- Array: scope, SOW line item, pricing delta, competitor comparison
  
  -- Routing & Status
  category TEXT NOT NULL, -- Same as flooring_category, stored separately for routing
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to TEXT, -- Email of pricing team member
  
  -- Metadata
  created_by TEXT NOT NULL, -- User email from Microsoft auth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional fields
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Chat Messages Table
-- Stores all messages in conversations
CREATE TABLE IF NOT EXISTS lowes_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES lowes_chat_conversations(id) ON DELETE CASCADE,
  
  -- Message Content
  message_text TEXT NOT NULL,
  sender_email TEXT NOT NULL, -- Email of sender
  sender_name TEXT NOT NULL, -- Name of sender
  sender_role TEXT, -- user or pricing_team
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_system_message BOOLEAN DEFAULT FALSE, -- For system notifications
  is_read BOOLEAN DEFAULT FALSE -- Track read status
);

-- Audit Logs Table
-- Full audit trail of all actions
CREATE TABLE IF NOT EXISTS lowes_chat_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES lowes_chat_conversations(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type TEXT NOT NULL, -- created, message_sent, status_changed, assigned, etc.
  action_description TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  
  -- Metadata
  metadata JSONB, -- Additional action data (old_value, new_value, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_conversations_key ON lowes_chat_conversations(conversation_key);
CREATE INDEX IF NOT EXISTS idx_conversations_category ON lowes_chat_conversations(category);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON lowes_chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON lowes_chat_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON lowes_chat_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON lowes_chat_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON lowes_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON lowes_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_email ON lowes_chat_messages(sender_email);

CREATE INDEX IF NOT EXISTS idx_audit_conversation_id ON lowes_chat_audit_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON lowes_chat_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_email ON lowes_chat_audit_logs(user_email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_lowes_chat_conversations_updated_at 
  BEFORE UPDATE ON lowes_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_message_at when message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lowes_chat_conversations
    SET last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update last_message_at
CREATE TRIGGER update_conversation_last_message_at
  AFTER INSERT ON lowes_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();
