-- Cycle Time YTD / LY cloud storage
-- Primary: private Supabase Storage bucket `cycle-time`
--   paths: ytd/data.json, ly/data.json
--   payload: { records, fileName, uploadedAt, variant }
--
-- Optional table (not required — API uses Storage):
CREATE TABLE IF NOT EXISTS cycle_time_data (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('ytd', 'ly')),
  data_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_cycle_time_data_user_variant
  ON cycle_time_data(user_id, variant);
