-- Complete setup script for user profile metadata and notifications
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create user_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visual_file_name TEXT,
  survey_file_name TEXT,
  workroom TEXT,
  user_role TEXT CHECK (user_role IN ('GM', 'PC', 'Corporate', 'President', 'Other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add workroom and role columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metadata' AND column_name = 'workroom'
  ) THEN
    ALTER TABLE user_metadata ADD COLUMN workroom TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metadata' AND column_name = 'user_role'
  ) THEN
    ALTER TABLE user_metadata ADD COLUMN user_role TEXT CHECK (user_role IN ('GM', 'PC', 'Corporate', 'President', 'Other'));
  END IF;
END $$;

-- Step 3: Create indexes for user_metadata
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id ON user_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_workroom ON user_metadata(workroom);

-- Step 4: Enable RLS on user_metadata
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Step 5: Create or replace RLS policy for user_metadata
DROP POLICY IF EXISTS "Service role full access user_metadata" ON user_metadata;
CREATE POLICY "Service role full access user_metadata" ON user_metadata
  FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Create notifications table
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

-- Step 7: Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workroom ON notifications(workroom);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Step 8: Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 9: Create or replace RLS policy for notifications
DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
CREATE POLICY "Service role full access notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);


