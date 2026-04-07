-- Lowe's Team Members Authentication Migration
-- Run this SQL in Supabase SQL Editor
-- This creates a proper table for Lowe's team members with hashed passwords

-- Create Lowe's Team Members table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS lowes_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  district TEXT NOT NULL,
  store_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  group_id UUID REFERENCES lowes_groups(id) ON DELETE SET NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lowes_team_members_email ON lowes_team_members(email);
CREATE INDEX IF NOT EXISTS idx_lowes_team_members_group_id ON lowes_team_members(group_id);
CREATE INDEX IF NOT EXISTS idx_lowes_team_members_district_store ON lowes_team_members(district, store_number);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lowes_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
-- Drop trigger if it exists (to allow re-running this migration)
DROP TRIGGER IF EXISTS update_lowes_team_members_updated_at ON lowes_team_members;
CREATE TRIGGER update_lowes_team_members_updated_at 
  BEFORE UPDATE ON lowes_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_lowes_team_members_updated_at();

-- Note: After running this, you'll need to:
-- 1. Hash existing passwords from localStorage using bcrypt (Node.js script)
-- 2. Insert migrated users into this table
-- 3. Update the frontend to use API endpoints instead of localStorage
