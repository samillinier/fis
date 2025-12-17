-- Update user_role constraint to include 'Corporate'
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Drop the existing check constraint
ALTER TABLE user_metadata
  DROP CONSTRAINT IF EXISTS user_metadata_user_role_check;

-- Step 2: Recreate the constraint with 'Corporate' and 'President' included
ALTER TABLE user_metadata
  ADD CONSTRAINT user_metadata_user_role_check
  CHECK (user_role IN ('GM', 'PC', 'Corporate', 'President', 'Other'));

-- Step 3: Verify the constraint was updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_metadata'::regclass
  AND conname = 'user_metadata_user_role_check';

