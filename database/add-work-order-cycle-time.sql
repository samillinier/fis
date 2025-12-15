-- Add 'work_order_cycle_time' metric type to performance_forms table
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE performance_forms 
DROP CONSTRAINT IF EXISTS performance_forms_metric_type_check;

-- Step 2: Add the new CHECK constraint with 'work_order_cycle_time' included
ALTER TABLE performance_forms 
ADD CONSTRAINT performance_forms_metric_type_check 
CHECK (metric_type IN (
  'vendor_debit', 
  'ltr', 
  'cycle_time', 
  'reschedule_rate', 
  'job_cycle_time', 
  'details_cycle_time',
  'work_order_cycle_time'
));

-- Step 3: Verify the constraint was updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'performance_forms'::regclass
AND conname = 'performance_forms_metric_type_check';

