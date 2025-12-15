-- Disable RLS Completely (Temporary Fix)
-- Run this to allow all inserts regardless of user

ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('visual_data', 'survey_data', 'dashboard_metadata')
AND schemaname = 'public';

-- Should show rowsecurity = false for all three tables



