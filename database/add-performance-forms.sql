-- Add performance forms table for storing mandatory form submissions
-- Run this SQL in your Supabase SQL Editor

-- Create performance_forms table
CREATE TABLE IF NOT EXISTS performance_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workroom TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('vendor_debit', 'ltr', 'cycle_time', 'reschedule_rate', 'job_cycle_time', 'details_cycle_time')),
  week_start_date DATE NOT NULL,
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workroom, metric_type, week_start_date)
);

-- Indexes for performance_forms
CREATE INDEX IF NOT EXISTS idx_performance_forms_user_id ON performance_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_forms_workroom ON performance_forms(workroom);
CREATE INDEX IF NOT EXISTS idx_performance_forms_metric_type ON performance_forms(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_forms_week_start ON performance_forms(week_start_date);
CREATE INDEX IF NOT EXISTS idx_performance_forms_user_workroom_metric_week ON performance_forms(user_id, workroom, metric_type, week_start_date);

-- Enable RLS
ALTER TABLE performance_forms ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role full access performance_forms" ON performance_forms;

-- Allow all operations for service_role key (API routes handle security)
CREATE POLICY "Service role full access performance_forms" ON performance_forms
  FOR ALL USING (true) WITH CHECK (true);
