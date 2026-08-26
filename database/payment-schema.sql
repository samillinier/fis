-- Payment Data (Monthly) — shared Supabase storage
CREATE TABLE IF NOT EXISTS payment_data (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yearly Payment Data
CREATE TABLE IF NOT EXISTS yearly_payment_data (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  data_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Payment file name metadata (monthly)
CREATE TABLE IF NOT EXISTS payment_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  payment_file_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yearly payment file name metadata
CREATE TABLE IF NOT EXISTS yearly_payment_metadata (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  payment_file_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_payment_data_user_id ON payment_data(user_id);
CREATE INDEX IF NOT EXISTS idx_yearly_payment_data_user_year ON yearly_payment_data(user_id, year);

-- Optional: add payment_file_name to existing user_metadata if you prefer one table
-- ALTER TABLE user_metadata ADD COLUMN IF NOT EXISTS payment_file_name TEXT;
-- ALTER TABLE yearly_user_metadata ADD COLUMN IF NOT EXISTS payment_file_name TEXT;
