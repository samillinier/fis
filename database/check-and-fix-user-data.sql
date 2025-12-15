-- Check and Fix User Data Issue
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check all users
SELECT id, email, created_at 
FROM users 
ORDER BY created_at DESC;

-- 2. Check if visual_data has any records (regardless of user_id)
SELECT COUNT(*) as total_visual_records, 
       COUNT(DISTINCT user_id) as unique_users
FROM visual_data;

-- 3. Check if survey_data has any records (regardless of user_id)
SELECT COUNT(*) as total_survey_records,
       COUNT(DISTINCT user_id) as unique_users
FROM survey_data;

-- 4. See all visual_data records with user emails
SELECT 
  v.id,
  v.user_id,
  v.workroom_name,
  v.store,
  v.sales,
  u.email as user_email,
  v.created_at
FROM visual_data v
LEFT JOIN users u ON v.user_id = u.id
ORDER BY v.created_at DESC
LIMIT 20;

-- 5. See all survey_data records with user emails
SELECT 
  s.id,
  s.user_id,
  s.workroom_name,
  s.store,
  s.ltr_score,
  u.email as user_email,
  s.created_at
FROM survey_data s
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 20;

-- 6. If you see data but with wrong user_id, you can update it:
-- Replace 'YOUR_EMAIL@example.com' with your actual email
-- Replace 'WRONG_USER_ID' with the user_id that has data
/*
UPDATE visual_data 
SET user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL@example.com')
WHERE user_id = 'WRONG_USER_ID';

UPDATE survey_data 
SET user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL@example.com')
WHERE user_id = 'WRONG_USER_ID';
*/



