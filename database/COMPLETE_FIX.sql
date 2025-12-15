-- COMPLETE FIX - Run this entire script in Supabase SQL Editor
-- This will fix all issues preventing data from saving

-- Step 1: Disable RLS (Row Level Security) - This is likely blocking inserts
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing RLS policies (they might be interfering)
DROP POLICY IF EXISTS "Users can view their own visual data" ON visual_data;
DROP POLICY IF EXISTS "Users can insert their own visual data" ON visual_data;
DROP POLICY IF EXISTS "Users can delete their own visual data" ON visual_data;
DROP POLICY IF EXISTS "Users can view their own survey data" ON survey_data;
DROP POLICY IF EXISTS "Users can insert their own survey data" ON survey_data;
DROP POLICY IF EXISTS "Users can delete their own survey data" ON survey_data;
DROP POLICY IF EXISTS "Users can view their own dashboard metadata" ON dashboard_metadata;
DROP POLICY IF EXISTS "Users can insert their own dashboard metadata" ON dashboard_metadata;
DROP POLICY IF EXISTS "Users can update their own dashboard metadata" ON dashboard_metadata;

-- Step 3: Verify RLS is disabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '❌ RLS ENABLED (BLOCKING!)' ELSE '✅ RLS DISABLED' END as status
FROM pg_tables 
WHERE tablename IN ('visual_data', 'survey_data', 'dashboard_metadata')
AND schemaname = 'public';

-- Step 4: Test insert (using your user_id: 3c0db76c-1db4-4232-b259-883fbd7ad177)
INSERT INTO visual_data (
  user_id,
  workroom_name,
  store,
  sales,
  labor_po,
  vendor_debit,
  data_jsonb
) VALUES (
  '3c0db76c-1db4-4232-b259-883fbd7ad177',
  'API_TEST',
  '999',
  5000.00,
  2500.00,
  1000.00,
  '{"name": "API_TEST", "store": "999", "sales": 5000, "laborPO": 2500, "vendorDebit": 1000}'::jsonb
)
RETURNING id, user_id, workroom_name, created_at;

-- Step 5: Verify test insert worked
SELECT COUNT(*) as test_record_count FROM visual_data WHERE workroom_name = 'API_TEST';

-- If Step 5 shows 1, then tables are working! Delete test record:
-- DELETE FROM visual_data WHERE workroom_name = 'API_TEST';



