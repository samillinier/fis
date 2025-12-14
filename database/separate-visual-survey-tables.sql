-- Separate Visual and Survey Data Tables
-- This creates separate tables to avoid data conflicts
-- Run this SQL in your Supabase SQL Editor

-- 0. Ensure users table exists first (required for foreign keys)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Create visual_data table (for visual/operational data)
CREATE TABLE IF NOT EXISTS visual_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workroom_name TEXT NOT NULL,
  store TEXT,
  sales NUMERIC(15, 2),
  labor_po NUMERIC(15, 2),
  vendor_debit NUMERIC(15, 2),
  category TEXT,
  cycle_time NUMERIC(10, 2), -- Changed from INTEGER to NUMERIC to support decimals like 28.5
  data_jsonb JSONB NOT NULL, -- Complete visual data object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create survey_data table (for survey/LTR data)
CREATE TABLE IF NOT EXISTS survey_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workroom_name TEXT NOT NULL,
  store TEXT,
  ltr_score NUMERIC(5, 2),
  craft_score NUMERIC(5, 2),
  prof_score NUMERIC(5, 2),
  survey_date DATE,
  survey_comment TEXT,
  labor_category TEXT,
  reliable_home_improvement_score NUMERIC(5, 2),
  time_taken_to_complete INTEGER,
  project_value_score NUMERIC(5, 2),
  installer_knowledge_score NUMERIC(5, 2),
  data_jsonb JSONB NOT NULL, -- Complete survey data object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create dashboard_metadata table (for DashboardData-level fields like rawColumnLValues, etc.)
CREATE TABLE IF NOT EXISTS dashboard_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  raw_column_l_values JSONB,
  raw_craft_values JSONB,
  raw_prof_values JSONB,
  raw_labor_categories JSONB,
  raw_company_values JSONB,
  raw_installer_names JSONB,
  excel_file_total_rows INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visual_data_user_id ON visual_data(user_id);
CREATE INDEX IF NOT EXISTS idx_visual_data_workroom_name ON visual_data(workroom_name);
CREATE INDEX IF NOT EXISTS idx_survey_data_user_id ON survey_data(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_data_workroom_name ON survey_data(workroom_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_metadata_user_id ON dashboard_metadata(user_id);

-- 5. Add comments
COMMENT ON TABLE visual_data IS 'Stores visual/operational data (sales, labor, vendor debits, cycle times)';
COMMENT ON TABLE survey_data IS 'Stores survey data (LTR, Craft, Prof scores, survey details)';
COMMENT ON TABLE dashboard_metadata IS 'Stores DashboardData-level metadata (raw arrays, Excel file info)';

-- 6. Enable RLS (Row Level Security)
ALTER TABLE visual_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies (users can only see their own data)
CREATE POLICY "Users can view their own visual data" ON visual_data
  FOR SELECT USING (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can insert their own visual data" ON visual_data
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can delete their own visual data" ON visual_data
  FOR DELETE USING (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can view their own survey data" ON survey_data
  FOR SELECT USING (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can insert their own survey data" ON survey_data
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can delete their own survey data" ON survey_data
  FOR DELETE USING (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can view their own dashboard metadata" ON dashboard_metadata
  FOR SELECT USING (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can insert their own dashboard metadata" ON dashboard_metadata
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update their own dashboard metadata" ON dashboard_metadata
  FOR UPDATE USING (auth.uid()::text = (SELECT id::text FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Note: Service role can bypass RLS, so API routes will work fine

