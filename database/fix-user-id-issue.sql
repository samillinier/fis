-- Fix User ID Issue - Make data visible to all users (temporary fix)
-- Run this in Supabase SQL Editor

-- Option 1: Update all visual_data to use your user_id
-- Replace 'YOUR_EMAIL@example.com' with your actual email
UPDATE visual_data 
SET user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL@example.com')
WHERE user_id IS NOT NULL;

-- Option 2: Update all survey_data to use your user_id
UPDATE survey_data 
SET user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL@example.com')
WHERE user_id IS NOT NULL;

-- Option 3: See what user_ids have data (run this first to see the issue)
SELECT 
  'visual_data' as table_name,
  v.user_id,
  u.email as user_email,
  COUNT(*) as record_count
FROM visual_data v
LEFT JOIN users u ON v.user_id = u.id
GROUP BY v.user_id, u.email
ORDER BY record_count DESC;

SELECT 
  'survey_data' as table_name,
  s.user_id,
  u.email as user_email,
  COUNT(*) as record_count
FROM survey_data s
LEFT JOIN users u ON s.user_id = u.id
GROUP BY s.user_id, u.email
ORDER BY record_count DESC;

-- Option 4: See ALL data regardless of user_id (to verify data exists)
SELECT 'visual_data' as source, COUNT(*) as total_records FROM visual_data
UNION ALL
SELECT 'survey_data' as source, COUNT(*) as total_records FROM survey_data;





