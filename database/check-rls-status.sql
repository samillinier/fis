-- Check if RLS is enabled or disabled
-- Run this to see the current RLS status

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('visual_data', 'survey_data', 'dashboard_metadata')
AND schemaname = 'public';

-- If rowsecurity = true → RLS is ENABLED (might be blocking)
-- If rowsecurity = false → RLS is DISABLED (should work)

