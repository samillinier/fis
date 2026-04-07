-- Add photo_url column to authorized_users table
-- Run this SQL in your Supabase SQL Editor

-- Add photo_url column if it doesn't exist
ALTER TABLE authorized_users 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_authorized_users_photo_url ON authorized_users(photo_url) WHERE photo_url IS NOT NULL;
