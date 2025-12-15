-- Fix cycle_time column to accept decimals
-- The error "invalid input syntax for type integer: 28.5" means cycle_time is INTEGER but needs to be NUMERIC

-- Fix visual_data table
ALTER TABLE visual_data 
ALTER COLUMN cycle_time TYPE NUMERIC(10, 2);

-- Fix survey_data table (if it has cycle_time)
-- ALTER TABLE survey_data 
-- ALTER COLUMN cycle_time TYPE NUMERIC(10, 2);

-- Verify the change
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'visual_data'
AND column_name = 'cycle_time';

-- Should show: data_type = 'numeric', numeric_precision = 10, numeric_scale = 2



