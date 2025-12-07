-- Vercel Postgres Schema for FIS Dashboard
-- Run this SQL in Vercel Postgres SQL Editor
-- Vercel Postgres automatically provides UUID support

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workroom data table (main dashboard data)
CREATE TABLE IF NOT EXISTS workroom_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Note: Vercel Postgres doesn't use Row Level Security (RLS)
-- Security is handled at the API layer by filtering by user_id/email

