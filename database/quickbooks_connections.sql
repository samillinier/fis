-- QuickBooks Connections Table
-- Stores OAuth tokens and connection information for QuickBooks integration

CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_user_id ON quickbooks_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_realm_id ON quickbooks_connections(realm_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own connections
CREATE POLICY "Users can view own QuickBooks connections"
  ON quickbooks_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own connections
CREATE POLICY "Users can insert own QuickBooks connections"
  ON quickbooks_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own connections
CREATE POLICY "Users can update own QuickBooks connections"
  ON quickbooks_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own connections
CREATE POLICY "Users can delete own QuickBooks connections"
  ON quickbooks_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE quickbooks_connections IS 'Stores QuickBooks OAuth tokens and connection information for each user';

