-- Fix Store Weekly Forecast Table
-- Run this if you get "column store does not exist" error
-- This will check and fix the table structure

-- First, check if table exists and what columns it has
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'lowes_store_weekly_forecasts') THEN
    
    -- Check if 'store' column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'lowes_store_weekly_forecasts' 
                   AND column_name = 'store') THEN
      
      RAISE NOTICE 'Table exists but store column is missing. Dropping and recreating table...';
      
      -- Drop the table if it has wrong structure
      DROP TABLE IF EXISTS lowes_store_weekly_forecasts CASCADE;
      
      -- Recreate with correct structure
      CREATE TABLE lowes_store_weekly_forecasts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        district TEXT NOT NULL,
        store TEXT NOT NULL,
        district_q1_jobs INTEGER NOT NULL,
        pct_of_district NUMERIC(10, 6) NOT NULL,
        store_q1_job_forecast INTEGER NOT NULL,
        week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 13),
        jobs_needed INTEGER NOT NULL DEFAULT 0,
        workroom TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_district_store_week UNIQUE(district, store, week_number)
      );
      
      RAISE NOTICE 'Table recreated successfully!';
    ELSE
      RAISE NOTICE 'Table exists and has correct structure.';
    END IF;
  ELSE
    RAISE NOTICE 'Table does not exist. Creating it...';
    
    -- Create the table
    CREATE TABLE lowes_store_weekly_forecasts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      district TEXT NOT NULL,
      store TEXT NOT NULL,
      district_q1_jobs INTEGER NOT NULL,
      pct_of_district NUMERIC(10, 6) NOT NULL,
      store_q1_job_forecast INTEGER NOT NULL,
      week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 13),
      jobs_needed INTEGER NOT NULL DEFAULT 0,
      workroom TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_district_store_week UNIQUE(district, store, week_number)
    );
    
    RAISE NOTICE 'Table created successfully!';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_forecast_district ON lowes_store_weekly_forecasts(district);
CREATE INDEX IF NOT EXISTS idx_store_forecast_store ON lowes_store_weekly_forecasts(store);
CREATE INDEX IF NOT EXISTS idx_store_forecast_week ON lowes_store_weekly_forecasts(week_number);
CREATE INDEX IF NOT EXISTS idx_store_forecast_workroom ON lowes_store_weekly_forecasts(workroom);
CREATE INDEX IF NOT EXISTS idx_store_forecast_district_week ON lowes_store_weekly_forecasts(district, week_number);
CREATE INDEX IF NOT EXISTS idx_store_forecast_workroom_week ON lowes_store_weekly_forecasts(workroom, week_number);

-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lowes_store_weekly_forecasts'
ORDER BY ordinal_position;
