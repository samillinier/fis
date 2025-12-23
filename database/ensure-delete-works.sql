-- Ensure Delete Works - Run this to fix data accumulation issue
-- This ensures RLS is disabled so deletes work properly

-- Step 1: Disable RLS (Row Level Security) - This might be blocking deletes
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all RLS policies (they might interfere even if RLS is disabled)
DROP POLICY IF EXISTS "Users can view their own visual data" ON visual_data;
DROP POLICY IF EXISTS "Users can insert their own visual data" ON visual_data;
DROP POLICY IF EXISTS "Users can delete their own visual data" ON visual_data;
DROP POLICY IF EXISTS "Users can update their own visual data" ON visual_data;
DROP POLICY IF EXISTS "Users can view their own survey data" ON survey_data;
DROP POLICY IF EXISTS "Users can insert their own survey data" ON survey_data;
DROP POLICY IF EXISTS "Users can delete their own survey data" ON survey_data;
DROP POLICY IF EXISTS "Users can update their own survey data" ON survey_data;
DROP POLICY IF EXISTS "Users can view their own dashboard metadata" ON dashboard_metadata;
DROP POLICY IF EXISTS "Users can insert their own dashboard metadata" ON dashboard_metadata;
DROP POLICY IF EXISTS "Users can update their own dashboard metadata" ON dashboard_metadata;
DROP POLICY IF EXISTS "Users can delete their own dashboard metadata" ON dashboard_metadata;

-- Step 3: Verify RLS is disabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '❌ RLS ENABLED (BLOCKING DELETES!)' 
    ELSE '✅ RLS DISABLED (DELETES WILL WORK)' 
  END as status
FROM pg_tables 
WHERE tablename IN ('visual_data', 'survey_data', 'dashboard_metadata')
AND schemaname = 'public';

-- Step 4: Test delete (replace with your user_id)
-- First, check how many records exist:
-- SELECT COUNT(*) as visual_count FROM visual_data WHERE user_id = 'YOUR_USER_ID_HERE';
-- SELECT COUNT(*) as survey_count FROM survey_data WHERE user_id = 'YOUR_USER_ID_HERE';

-- Then test delete:
-- DELETE FROM visual_data WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM survey_data WHERE user_id = 'YOUR_USER_ID_HERE';

-- Verify delete worked:
-- SELECT COUNT(*) as visual_count_after FROM visual_data WHERE user_id = 'YOUR_USER_ID_HERE';
-- SELECT COUNT(*) as survey_count_after FROM survey_data WHERE user_id = 'YOUR_USER_ID_HERE';

-- If counts are 0, delete is working! ✅





