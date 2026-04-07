-- Shared "Sales Last Week" CSV for Q1 tracker (one row per shared admin bucket).
-- Run in Supabase SQL Editor if the table does not exist.

CREATE TABLE IF NOT EXISTS lowes_sales_last_week_snapshot (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  csv_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS idx_lowes_sales_last_week_updated ON lowes_sales_last_week_snapshot(updated_at DESC);

COMMENT ON TABLE lowes_sales_last_week_snapshot IS 'Latest Sales Last Week CSV for Q1 district pivot; user_id is shared admin bucket (getSharedAdminUserId).';
