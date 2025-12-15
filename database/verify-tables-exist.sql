-- Verify Tables Exist and Are Accessible
-- Run this to check if tables exist and can be queried

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('visual_data', 'survey_data', 'dashboard_metadata', 'users')
ORDER BY table_name;

-- Try to query each table
SELECT 'visual_data' as table_name, COUNT(*) as record_count FROM visual_data
UNION ALL
SELECT 'survey_data' as table_name, COUNT(*) as record_count FROM survey_data
UNION ALL
SELECT 'dashboard_metadata' as table_name, COUNT(*) as record_count FROM dashboard_metadata
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM users;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'visual_data'
ORDER BY ordinal_position;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'survey_data'
ORDER BY ordinal_position;



