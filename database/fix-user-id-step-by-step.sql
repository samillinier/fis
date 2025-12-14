-- Step-by-Step Guide to Fix User ID Mismatch
-- Run each query one at a time in Supabase SQL Editor

-- STEP 1: See what user_ids have data in workroom_data table
-- This shows you which user_id(s) currently have your data
SELECT 
  user_id, 
  COUNT(*) as record_count,
  MIN(created_at) as first_record,
  MAX(created_at) as last_record
FROM workroom_data
GROUP BY user_id
ORDER BY record_count DESC;

-- STEP 2: See all users in your database
-- This shows you all user accounts and their IDs
SELECT 
  id as user_id,
  email,
  name,
  created_at
FROM users
ORDER BY created_at DESC;

-- STEP 3: Find YOUR user_id (replace 'your-email@example.com' with your actual email)
-- This will show your current user ID
SELECT 
  id as your_user_id,
  email,
  name
FROM users
WHERE email = 'your-email@example.com';  -- ⚠️ REPLACE THIS WITH YOUR EMAIL

-- STEP 4: Update the data to your user_id
-- ⚠️ IMPORTANT: Replace the UUIDs below with actual values from Steps 1 and 3
-- 
-- Example:
-- If Step 1 shows data has user_id: '123e4567-e89b-12d3-a456-426614174000'
-- And Step 3 shows your user_id is: '987fcdeb-51a2-43d7-8f9e-123456789abc'
-- Then run:
--
-- UPDATE workroom_data 
-- SET user_id = '987fcdeb-51a2-43d7-8f9e-123456789abc'  -- Your user_id from Step 3
-- WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';  -- The user_id with data from Step 1

-- ⚠️ WARNING: Make sure you have the correct UUIDs before running UPDATE!
-- You can verify by checking the count first:
-- SELECT COUNT(*) FROM workroom_data WHERE user_id = 'the-old-user-id';
