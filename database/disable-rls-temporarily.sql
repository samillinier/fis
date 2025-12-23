-- Temporarily disable RLS to test if that's blocking inserts
-- Run this if data is not saving

-- Disable RLS on visual_data
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;

-- Disable RLS on survey_data
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;

-- Disable RLS on dashboard_metadata
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;

-- Note: After testing, you can re-enable RLS with:
-- ALTER TABLE visual_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE survey_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard_metadata ENABLE ROW LEVEL SECURITY;





