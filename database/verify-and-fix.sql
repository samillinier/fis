-- Verify Tables and Fix Issues
-- Run this to check everything

-- 1. Check if tables exist
SELECT 
  'visual_data' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visual_data') as exists
UNION ALL
SELECT 
  'survey_data' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'survey_data') as exists
UNION ALL
SELECT 
  'dashboard_metadata' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dashboard_metadata') as exists;

-- 2. Check RLS status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('visual_data', 'survey_data', 'dashboard_metadata')
AND schemaname = 'public';

-- 3. Disable RLS (if enabled)
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;

-- 4. Test insert (using your user_id)
INSERT INTO visual_data (
  user_id,
  workroom_name,
  store,
  sales,
  data_jsonb
) VALUES (
  '3c0db76c-1db4-4232-b259-883fbd7ad177',
  'VERIFY_TEST',
  '888',
  9999.00,
  '{"name": "VERIFY_TEST", "store": "888", "sales": 9999}'::jsonb
)
RETURNING id, user_id, workroom_name;

-- 5. Verify it was inserted
SELECT COUNT(*) as test_count FROM visual_data WHERE workroom_name = 'VERIFY_TEST';

-- 6. Clean up
DELETE FROM visual_data WHERE workroom_name = 'VERIFY_TEST';





