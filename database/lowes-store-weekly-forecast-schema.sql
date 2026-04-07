-- Store Weekly Job Forecast Schema
-- Run this SQL in your Supabase SQL Editor
-- This stores store-level Q1 job forecasts with district alignment and workroom mapping

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if it exists with wrong structure (uncomment if needed)
-- DROP TABLE IF EXISTS lowes_store_weekly_forecasts;

-- Table to store store-level weekly job forecasts
CREATE TABLE IF NOT EXISTS lowes_store_weekly_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district TEXT NOT NULL,
  store TEXT NOT NULL,
  district_q1_jobs INTEGER NOT NULL,
  pct_of_district NUMERIC(10, 6) NOT NULL, -- Store percentage share (Labor PO weighting)
  store_q1_job_forecast INTEGER NOT NULL, -- Total Q1 forecast for the store
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 13),
  jobs_needed INTEGER NOT NULL DEFAULT 0, -- Jobs needed for this store in this week
  workroom TEXT, -- Mapped workroom name from districtToWorkroom
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_district_store_week UNIQUE(district, store, week_number)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_store_forecast_district ON lowes_store_weekly_forecasts(district);
CREATE INDEX IF NOT EXISTS idx_store_forecast_store ON lowes_store_weekly_forecasts(store);
CREATE INDEX IF NOT EXISTS idx_store_forecast_week ON lowes_store_weekly_forecasts(week_number);
CREATE INDEX IF NOT EXISTS idx_store_forecast_workroom ON lowes_store_weekly_forecasts(workroom);
CREATE INDEX IF NOT EXISTS idx_store_forecast_district_week ON lowes_store_weekly_forecasts(district, week_number);
CREATE INDEX IF NOT EXISTS idx_store_forecast_workroom_week ON lowes_store_weekly_forecasts(workroom, week_number);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Store Weekly Job Forecast schema setup complete!';
  RAISE NOTICE 'Table created: lowes_store_weekly_forecasts';
END $$;
