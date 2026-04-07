-- Q1 2026 Goals and Weekly Job Count Tracker Schema
-- Run this SQL in your Supabase SQL Editor
-- This tracks job count goals by district and category, and actual job counts week-to-week

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table to store Q1 2026 goals by district and category
CREATE TABLE IF NOT EXISTS lowes_q1_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district TEXT NOT NULL,
  provider TEXT,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 13),
  category TEXT NOT NULL CHECK (category IN ('CARPET', 'HSF', 'TILE', 'TOTAL')),
  planned_count INTEGER NOT NULL DEFAULT 0,
  comparable_count INTEGER DEFAULT 0, -- Comparable/Comparison data from previous period
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(district, week_number, category)
);

-- Table to store actual job counts from Vendor Gateway (week-to-week tracking)
CREATE TABLE IF NOT EXISTS lowes_weekly_job_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district TEXT NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 13),
  category TEXT NOT NULL CHECK (category IN ('CARPET', 'HSF', 'TILE', 'TOTAL')),
  actual_count INTEGER NOT NULL DEFAULT 0,
  week_start_date DATE,
  week_end_date DATE,
  data_source TEXT DEFAULT 'vendor_gateway',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(district, week_number, category, data_source)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_q1_goals_district ON lowes_q1_goals(district);
CREATE INDEX IF NOT EXISTS idx_q1_goals_week ON lowes_q1_goals(week_number);
CREATE INDEX IF NOT EXISTS idx_q1_goals_category ON lowes_q1_goals(category);
CREATE INDEX IF NOT EXISTS idx_q1_goals_district_week ON lowes_q1_goals(district, week_number);

CREATE INDEX IF NOT EXISTS idx_weekly_counts_district ON lowes_weekly_job_counts(district);
CREATE INDEX IF NOT EXISTS idx_weekly_counts_week ON lowes_weekly_job_counts(week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_counts_category ON lowes_weekly_job_counts(category);
CREATE INDEX IF NOT EXISTS idx_weekly_counts_district_week ON lowes_weekly_job_counts(district, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_counts_week_dates ON lowes_weekly_job_counts(week_start_date, week_end_date);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Q1 2026 Goals and Weekly Job Count Tracker schema setup complete!';
  RAISE NOTICE 'Tables created: lowes_q1_goals, lowes_weekly_job_counts';
END $$;
