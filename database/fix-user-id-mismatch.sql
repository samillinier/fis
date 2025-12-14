-- Fix User ID Mismatch Issue
-- This script helps identify and fix data that was saved with the wrong user_id

-- Step 1: Check what user_ids exist in your data
-- Run this query to see all user_ids in workroom_data table:
SELECT DISTINCT user_id, COUNT(*) as record_count
FROM workroom_data
GROUP BY user_id
ORDER BY record_count DESC;

-- Step 2: Check what users exist in your users table
-- Run this query to see all users:
SELECT id, email, name, created_at
FROM users
ORDER BY created_at DESC;

-- Step 3: Update data to match current user (REPLACE 'YOUR_EMAIL@example.com' with your actual email)
-- First, find your user_id:
-- SELECT id FROM users WHERE email = 'YOUR_EMAIL@example.com';

-- Then update all workroom_data to use your user_id (REPLACE 'OLD_USER_ID' and 'YOUR_USER_ID'):
-- UPDATE workroom_data 
-- SET user_id = 'YOUR_USER_ID'  -- Your current user ID
-- WHERE user_id = 'OLD_USER_ID';  -- The old user ID that has the data

-- ⚠️ WARNING: Only run the UPDATE if you're sure you want to reassign all data to your user
-- Make a backup first if needed!

-- Alternative: If you want to see data from ALL users (for admin/debugging):
-- Remove the .eq('user_id', userId) filter in /app/api/data/route.ts GET handler
-- (NOT RECOMMENDED for production - security risk)
