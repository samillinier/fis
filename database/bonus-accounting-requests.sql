-- Bonus requests sent to Accounting from the Bonus page.
-- Run in the Supabase SQL Editor before using the send-to-accounting flow.

CREATE TABLE IF NOT EXISTS bonus_accounting_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_by_email TEXT NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonus_accounting_requests_user_created
  ON bonus_accounting_requests(user_id, created_at DESC);

COMMENT ON TABLE bonus_accounting_requests IS
  'Submitted Bonus Summary requests for Accounting review; user_id uses getSharedAdminUserId().';
