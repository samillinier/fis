-- Lowe's Groups Management Schema
-- Run this SQL in Supabase SQL Editor

-- Groups table - stores different groups like "Flooring Validation Chat", "Floor Store", etc.
CREATE TABLE IF NOT EXISTS lowes_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group memberships - links Lowe's team members to groups
CREATE TABLE IF NOT EXISTS lowes_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES lowes_groups(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  member_name TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by TEXT, -- Email of admin who added the member
  UNIQUE(group_id, member_email)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lowes_groups_name ON lowes_groups(name);
CREATE INDEX IF NOT EXISTS idx_lowes_group_members_group_id ON lowes_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_lowes_group_members_email ON lowes_group_members(member_email);

-- Insert default groups if they don't exist
INSERT INTO lowes_groups (name, description) 
VALUES 
  ('Flooring Validation Chat', 'Team members who handle flooring validation chat conversations'),
  ('Floor Store', 'Team members who manage floor store operations')
ON CONFLICT (name) DO NOTHING;
