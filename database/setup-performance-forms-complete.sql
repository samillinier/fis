-- ============================================================================
-- PERFORMANCE FORMS DATABASE SETUP
-- Complete setup script for all performance forms
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create performance_forms table
-- This table stores all form submissions (Reschedule Rate, LTR, Cycle Time, Vendor Debit)
CREATE TABLE IF NOT EXISTS performance_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workroom TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'vendor_debit', 
    'ltr', 
    'cycle_time', 
    'reschedule_rate', 
    'job_cycle_time', 
    'details_cycle_time'
  )),
  week_start_date DATE NOT NULL,
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workroom, metric_type, week_start_date)
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_forms_user_id ON performance_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_forms_workroom ON performance_forms(workroom);
CREATE INDEX IF NOT EXISTS idx_performance_forms_metric_type ON performance_forms(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_forms_week_start ON performance_forms(week_start_date);
CREATE INDEX IF NOT EXISTS idx_performance_forms_user_workroom_metric_week 
  ON performance_forms(user_id, workroom, metric_type, week_start_date);
CREATE INDEX IF NOT EXISTS idx_performance_forms_submitted_at 
  ON performance_forms(submitted_at DESC);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE performance_forms ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policy if it exists (safe to run multiple times)
DROP POLICY IF EXISTS "Service role full access performance_forms" ON performance_forms;

-- Step 6: Create RLS policy for service role
-- This allows API routes (using service role key) to access all data
-- API routes handle authentication and authorization
CREATE POLICY "Service role full access performance_forms" ON performance_forms
  FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Verify table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'performance_forms'
  ) THEN
    RAISE NOTICE '✅ performance_forms table created successfully!';
  ELSE
    RAISE EXCEPTION '❌ Failed to create performance_forms table';
  END IF;
END $$;

-- Step 8: Display table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'performance_forms'
ORDER BY ordinal_position;

-- ============================================================================
-- SETUP COMPLETE!
-- 
-- The performance_forms table is now ready to store:
-- - Reschedule Rate Accountability Reports
-- - LTR Workroom Performance Reports  
-- - Work Cycle Time Corrective Reports
-- - Vendor Debit Accountability Reports
-- ============================================================================





