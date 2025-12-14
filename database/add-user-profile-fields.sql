-- Add workroom and role fields to user_metadata table
-- Run this SQL in your Supabase SQL Editor

-- Add workroom and role columns to user_metadata table
ALTER TABLE user_metadata 
  ADD COLUMN IF NOT EXISTS workroom TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_metadata.workroom IS 'User workroom location (e.g., Tampa, Sarasota, etc.)';
COMMENT ON COLUMN user_metadata.role IS 'User role (e.g., GM, PC, etc.)';
