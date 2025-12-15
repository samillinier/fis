-- Add JSONB column to workroom_data table to store complete WorkroomData object
-- This ensures all fields are preserved when saving/loading

-- Add data_jsonb column to store complete workroom data as JSON
ALTER TABLE workroom_data 
ADD COLUMN IF NOT EXISTS data_jsonb JSONB;

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_workroom_data_jsonb ON workroom_data USING GIN (data_jsonb);

-- Add comment
COMMENT ON COLUMN workroom_data.data_jsonb IS 'Complete WorkroomData object stored as JSON for full data persistence';



