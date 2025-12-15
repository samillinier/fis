-- Add user_metadata table for storing file names
-- Run this SQL in your Supabase SQL Editor

-- User metadata table (for file names and other user-specific metadata)
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visual_file_name TEXT,
  survey_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id ON user_metadata(user_id);

-- Enable RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role full access user_metadata" ON user_metadata;

-- Allow all operations for service_role key (API routes handle security)
CREATE POLICY "Service role full access user_metadata" ON user_metadata
  FOR ALL USING (true) WITH CHECK (true);



