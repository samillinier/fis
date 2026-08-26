-- Scheduled Jobs export (measure / install / work order) — shared Supabase storage
CREATE TABLE IF NOT EXISTS scheduled_job_data (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_job_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  scheduled_job_file_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_job_data_user_id ON scheduled_job_data(user_id);
