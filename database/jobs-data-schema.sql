-- Jobs export (admin-uploaded job list) — shared Supabase storage
-- All admins read/write the same shared location so uploaded data is visible to everyone.
CREATE TABLE IF NOT EXISTS jobs_data (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_data_user_id ON jobs_data(user_id);
