-- FIS Dashboard Database Schema
-- Run this SQL in your Supabase SQL Editor

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

-- Authorized users / allowlist
CREATE TABLE IF NOT EXISTS authorized_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access requests (pending approvals)
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- Row Level Security (RLS) - Disabled since we use Microsoft Auth
-- Security is handled at the API layer (filtering by user_id/email)
-- Note: Since we're using service_role key, RLS is bypassed anyway

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workroom_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own data" ON workroom_data;
DROP POLICY IF EXISTS "Users can insert own data" ON workroom_data;
DROP POLICY IF EXISTS "Users can update own data" ON workroom_data;
DROP POLICY IF EXISTS "Users can delete own data" ON workroom_data;

DROP POLICY IF EXISTS "Users can view own historical data" ON historical_data;
DROP POLICY IF EXISTS "Users can insert own historical data" ON historical_data;
DROP POLICY IF EXISTS "Users can update own historical data" ON historical_data;
DROP POLICY IF EXISTS "Users can delete own historical data" ON historical_data;

-- Allow all operations for service_role key (API routes handle security)
-- These policies allow access when using service_role key (which bypasses RLS anyway)
CREATE POLICY "Service role full access workroom_data" ON workroom_data
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access historical_data" ON historical_data
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access authorized_users" ON authorized_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access access_requests" ON access_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Note: Security is enforced at the API layer where we filter by user_id (email)
-- The API routes use service_role key and manually filter: .eq('user_id', userId)

