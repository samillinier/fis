-- Add chat widget access control to authorized_users table
-- Run this SQL in Supabase SQL Editor

-- Add column to track if user can see chat widget
ALTER TABLE authorized_users
ADD COLUMN IF NOT EXISTS chat_widget_enabled BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_authorized_users_chat_widget_enabled 
ON authorized_users(chat_widget_enabled) 
WHERE chat_widget_enabled = TRUE;

-- By default, set all existing users to have chat widget enabled (optional)
-- Uncomment the line below if you want all existing users to have access by default
-- UPDATE authorized_users SET chat_widget_enabled = TRUE WHERE chat_widget_enabled IS NULL;
