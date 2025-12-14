-- ============================================================================
-- VERIFY PERFORMANCE FORMS TABLE SETUP
-- Run this to check if the table is set up correctly
-- ============================================================================

-- Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'performance_forms'
    ) 
    THEN '✅ Table exists'
    ELSE '❌ Table does NOT exist'
  END as table_status;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'performance_forms'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'performance_forms'
AND schemaname = 'public';

-- Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE tablename = 'performance_forms'
AND schemaname = 'public';

-- Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'performance_forms'
AND schemaname = 'public';

-- Count existing form submissions (if any)
SELECT 
  metric_type,
  COUNT(*) as submission_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT workroom) as unique_workrooms,
  MIN(submitted_at) as first_submission,
  MAX(submitted_at) as latest_submission
FROM performance_forms
GROUP BY metric_type
ORDER BY metric_type;

