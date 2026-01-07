# Fix "database_error" After QuickBooks Connection

## The Problem

After successfully connecting to QuickBooks (OAuth worked!), you're getting a "database_error" when trying to save the connection.

## Root Cause

The `quickbooks_connections` table either:
1. **Doesn't exist** in your Supabase database
2. **RLS policies are blocking** the insert (even though service_role should bypass RLS)

## Solution: Create the Table

### Step 1: Run SQL Migration in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Copy and paste this entire SQL script:

```sql
-- QuickBooks Connections Table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_user_id ON quickbooks_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_realm_id ON quickbooks_connections(realm_id);

-- Enable RLS
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view own QuickBooks connections" ON quickbooks_connections;
DROP POLICY IF EXISTS "Users can insert own QuickBooks connections" ON quickbooks_connections;
DROP POLICY IF EXISTS "Users can update own QuickBooks connections" ON quickbooks_connections;
DROP POLICY IF EXISTS "Users can delete own QuickBooks connections" ON quickbooks_connections;

-- Create RLS policies
-- Note: These policies use auth.uid(), but service_role bypasses RLS
-- The API uses service_role key, so these policies won't block inserts
CREATE POLICY "Users can view own QuickBooks connections"
  ON quickbooks_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own QuickBooks connections"
  ON quickbooks_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own QuickBooks connections"
  ON quickbooks_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own QuickBooks connections"
  ON quickbooks_connections FOR DELETE
  USING (auth.uid() = user_id);
```

5. Click **"Run"** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
6. Wait for success message

### Step 2: Verify Table Created

1. In Supabase Dashboard, go to **Table Editor**
2. Look for `quickbooks_connections` table
3. It should show columns: `id`, `user_id`, `realm_id`, `access_token`, etc.

### Step 3: Test Connection Again

1. Go to: `https://fis-phi.vercel.app/finance-hub`
2. Click "Connect to QuickBooks"
3. Authorize the connection
4. It should work now!

## Alternative: Disable RLS (If Policies Are Blocking)

If the table exists but RLS is still blocking, you can temporarily disable RLS:

```sql
ALTER TABLE quickbooks_connections DISABLE ROW LEVEL SECURITY;
```

**Note:** This is less secure, but since you're using service_role key in the API, RLS is already bypassed. The policies are mainly for direct database access.

## Verify Table Exists

Run this query in Supabase SQL Editor to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'quickbooks_connections';
```

If it returns a row, the table exists. If empty, run the CREATE TABLE script above.

## Common Issues

### Issue 1: Table Doesn't Exist
- **Symptom:** "relation quickbooks_connections does not exist"
- **Fix:** Run the CREATE TABLE script above

### Issue 2: RLS Blocking (Even with Service Role)
- **Symptom:** Insert fails with permission error
- **Fix:** Disable RLS temporarily: `ALTER TABLE quickbooks_connections DISABLE ROW LEVEL SECURITY;`

### Issue 3: Foreign Key Constraint
- **Symptom:** "foreign key constraint fails"
- **Fix:** Make sure `users` table exists and the `user_id` exists in it

## Quick Test

After creating the table, test with this query:

```sql
SELECT * FROM quickbooks_connections LIMIT 1;
```

If it runs without error, the table exists and is accessible.

## Summary

The "database_error" means the `quickbooks_connections` table doesn't exist. Run the SQL script above in Supabase SQL Editor to create it, then try connecting again!
