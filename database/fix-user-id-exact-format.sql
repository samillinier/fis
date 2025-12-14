-- ============================================
-- EXACT FORMAT - Copy this template
-- ============================================

-- STEP 1: Find the user_id that has your data
SELECT 
  user_id, 
  COUNT(*) as record_count
FROM workroom_data
GROUP BY user_id
ORDER BY record_count DESC;

-- STEP 2: Find YOUR user_id (replace email!)
SELECT 
  id as your_user_id,
  email
FROM users
WHERE email = 'your-email@example.com';  -- ⚠️ CHANGE THIS!

-- STEP 3: UPDATE statement - MUST have single quotes around UUIDs!
-- ⚠️ Replace the UUIDs below with YOUR actual UUIDs from Steps 1 and 2
-- ⚠️ UUIDs MUST be in single quotes: 'uuid-here'

UPDATE workroom_data 
SET user_id = 'PASTE_YOUR_USER_ID_HERE'  -- ⚠️ Paste your user_id from Step 2 (with quotes!)
WHERE user_id = 'PASTE_DATA_USER_ID_HERE';  -- ⚠️ Paste the user_id from Step 1 (with quotes!)

-- ============================================
-- EXAMPLE (DO NOT USE - This is just format example):
-- ============================================
-- If Step 1 result shows: user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- And Step 2 result shows: your_user_id = 'x9y8z7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4'
-- 
-- Then your UPDATE should be EXACTLY:
--
-- UPDATE workroom_data 
-- SET user_id = 'x9y8z7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4'
-- WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
--
-- ⚠️ Notice: Single quotes around BOTH UUIDs!
-- ⚠️ Notice: Semicolon at the end!
-- ⚠️ Notice: No extra spaces or characters!
