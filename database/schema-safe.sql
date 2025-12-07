-- FIS Dashboard Database Schema (Safe to Run Multiple Times)
-- Run this SQL in your Supabase SQL Editor
-- This version can be run multiple times without errors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workroom data table (main dashboard data)
CREATE TABLE IF NOT EXISTS workroom_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workroom_name TEXT NOT NULL,
  store TEXT,
  sales NUMERIC(15, 2),
  labor_po NUMERIC(15, 2),
  vendor_debit NUMERIC(15, 2),
  category TEXT,
  cycle_time INTEGER,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historical data entries table
CREATE TABLE IF NOT EXISTS historical_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  upload_date DATE NOT NULL,
  week TEXT NOT NULL,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  data JSONB NOT NULL, -- Stores the full DashboardData as JSON
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workroom_data_user_id ON workroom_data(user_id);
CREATE INDEX IF NOT EXISTS idx_workroom_data_workroom_name ON workroom_data(workroom_name);
CREATE INDEX IF NOT EXISTS idx_historical_data_user_id ON historical_data(user_id);
CREATE INDEX IF NOT EXISTS idx_historical_data_week ON historical_data(week);
CREATE INDEX IF NOT EXISTS idx_historical_data_month ON historical_data(month);
CREATE INDEX IF NOT EXISTS idx_historical_data_year ON historical_data(year);
CREATE INDEX IF NOT EXISTS idx_historical_data_timestamp ON historical_data(timestamp);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workroom_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own data" ON workroom_data;
DROP POLICY IF EXISTS "Users can insert own data" ON workroom_data;
DROP POLICY IF EXISTS "Users can update own data" ON workroom_data;
DROP POLICY IF EXISTS "Users can delete own data" ON workroom_data;

DROP POLICY IF EXISTS "Users can view own historical data" ON historical_data;
DROP POLICY IF EXISTS "Users can insert own historical data" ON historical_data;
DROP POLICY IF EXISTS "Users can update own historical data" ON historical_data;
DROP POLICY IF EXISTS "Users can delete own historical data" ON historical_data;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON workroom_data
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own data" ON workroom_data
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own data" ON workroom_data
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own data" ON workroom_data
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Similar policies for historical_data
CREATE POLICY "Users can view own historical data" ON historical_data
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own historical data" ON historical_data
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own historical data" ON historical_data
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own historical data" ON historical_data
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema setup complete!';
  RAISE NOTICE 'Tables created: users, workroom_data, historical_data';
  RAISE NOTICE 'RLS policies configured for data security';
END $$;

