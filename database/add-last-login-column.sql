-- Add last_login_at column to authorized_users table
-- Run this SQL in Supabase SQL Editor

-- Add column to track when user last logged in
ALTER TABLE authorized_users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_authorized_users_last_login 
ON authorized_users(last_login_at DESC NULLS LAST);
