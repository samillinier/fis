-- Add comparable_count column to existing lowes_q1_goals table
-- Run this SQL in your Supabase SQL Editor
-- This adds the column to store Comparable/Comparison data from the Excel file

ALTER TABLE lowes_q1_goals 
ADD COLUMN IF NOT EXISTS comparable_count INTEGER DEFAULT 0;

-- Update comment for documentation
COMMENT ON COLUMN lowes_q1_goals.comparable_count IS 'Comparable/Comparison data from previous period (e.g., Q1 2025 actuals)';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'lowes_q1_goals' 
AND column_name = 'comparable_count';
