-- Shared Bonus page snapshot for all admins.
-- Run in the Supabase SQL Editor before using the cloud-backed Bonus page.

CREATE TABLE IF NOT EXISTS bonus_page_snapshot (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rows_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  tiers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS idx_bonus_page_snapshot_updated
  ON bonus_page_snapshot(updated_at DESC);

COMMENT ON TABLE bonus_page_snapshot IS
  'Latest shared Bonus page rows and tiers for admins; user_id uses getSharedAdminUserId().';
