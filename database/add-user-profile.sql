-- Add user profile fields (workroom and role) to user_metadata table
-- Run this SQL in your Supabase SQL Editor

-- Add workroom and role columns to user_metadata table
ALTER TABLE user_metadata 
ADD COLUMN IF NOT EXISTS workroom TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('GM', 'PC', 'Corporate', 'President', 'Other'));

-- Add index for workroom queries
CREATE INDEX IF NOT EXISTS idx_user_metadata_workroom ON user_metadata(workroom);

-- Add notifications table for storing user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workroom TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'warning' CHECK (type IN ('warning', 'info', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workroom ON notifications(workroom);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;

-- Allow all operations for service_role key (API routes handle security)
CREATE POLICY "Service role full access notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);





