-- See ALL data in tables (regardless of user_id)
-- Run this to check if data is being saved at all

-- 1. Count all records
SELECT 'visual_data' as table_name, COUNT(*) as total_records FROM visual_data
UNION ALL
SELECT 'survey_data' as table_name, COUNT(*) as total_records FROM survey_data;

-- 2. See all visual_data records (last 20)
SELECT 
  id,
  user_id,
  workroom_name,
  store,
  sales,
  created_at
FROM visual_data
ORDER BY created_at DESC
LIMIT 20;

-- 3. See all survey_data records (last 20)
SELECT 
  id,
  user_id,
  workroom_name,
  store,
  ltr_score,
  created_at
FROM survey_data
ORDER BY created_at DESC
LIMIT 20;

-- 4. See which user_ids have data
SELECT 
  'visual_data' as source,
  user_id,
  COUNT(*) as count,
  MAX(created_at) as latest_record
FROM visual_data
GROUP BY user_id
ORDER BY latest_record DESC;

SELECT 
  'survey_data' as source,
  user_id,
  COUNT(*) as count,
  MAX(created_at) as latest_record
FROM survey_data
GROUP BY user_id
ORDER BY latest_record DESC;

-- 5. See all users and their IDs
SELECT id, email, created_at 
FROM users 
ORDER BY created_at DESC;



