-- ============================================
-- FIX USER ID MISMATCH - CLEAR INSTRUCTIONS
-- ============================================
-- Run these queries ONE AT A TIME in Supabase SQL Editor
-- Copy the ACTUAL UUIDs from the results, don't use placeholder text!

-- ============================================
-- STEP 1: Find which user_id has your data
-- ============================================
-- Run this query and COPY the user_id value from the result
SELECT 
  user_id, 
  COUNT(*) as record_count
FROM workroom_data
GROUP BY user_id
ORDER BY record_count DESC;

-- ⚠️ IMPORTANT: Copy the user_id value (it looks like: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
-- This is the UUID that currently has your data
-- Example result might show: user_id = 'abc123def-4567-8901-2345-678901234567'


-- ============================================
-- STEP 2: Find YOUR user_id (your current account)
-- ============================================
-- Replace 'your-email@example.com' with YOUR ACTUAL EMAIL ADDRESS
SELECT 
  id as your_user_id,
  email,
  name
FROM users
WHERE email = 'your-email@example.com';  -- ⚠️ CHANGE THIS TO YOUR EMAIL!

-- ⚠️ IMPORTANT: Copy the your_user_id value from the result
-- Example result might show: your_user_id = 'xyz789abc-def0-1234-5678-90abcdef1234'


-- ============================================
-- STEP 3: Update the data (USE ACTUAL UUIDs!)
-- ============================================
-- ⚠️ CRITICAL: Replace the UUIDs below with the ACTUAL values from Steps 1 and 2
-- 
-- Example:
-- If Step 1 showed: user_id = 'abc123def-4567-8901-2345-678901234567'
-- And Step 2 showed: your_user_id = 'xyz789abc-def0-1234-5678-90abcdef1234'
-- Then your UPDATE should look like this:

UPDATE workroom_data 
SET user_id = 'xyz789abc-def0-1234-5678-90abcdef1234'  -- Your user_id from Step 2
WHERE user_id = 'abc123def-4567-8901-2345-678901234567';  -- The user_id with data from Step 1

-- ⚠️ DO NOT use placeholder text like 'abc123...' or 'OLD_USER_ID'
-- ⚠️ You MUST use the full UUIDs copied from Steps 1 and 2
-- ⚠️ UUIDs are long strings like: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'


-- ============================================
-- VERIFY: Check if update worked
-- ============================================
-- After running the UPDATE, verify it worked:
SELECT 
  user_id, 
  COUNT(*) as record_count
FROM workroom_data
GROUP BY user_id
ORDER BY record_count DESC;

-- You should now see your user_id with all the records!
