# QuickBooks Connection Checklist

## To Fix "undefined didn't connect" Error

### 1. ✅ Environment Variables (CRITICAL)
Add these to **Vercel Dashboard** → Your Project → Settings → Environment Variables:

```env
QUICKBOOKS_CLIENT_ID=694ad793-ff6f-442d-8fce-1ece6e00117b
QUICKBOOKS_CLIENT_SECRET=hpb2sXyBG1AZBb5typR2c4hnt3O0GTQG5LZZKV5L
QUICKBOOKS_REDIRECT_URI=https://your-production-domain.vercel.app/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN=your_verifier_token_from_intuit_dashboard
```

**Important:**
- Replace `your-production-domain.vercel.app` with your actual Vercel domain
- For production, set `QUICKBOOKS_ENVIRONMENT=production`
- Make sure to select **ALL environments** (Production, Preview, Development)
- `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` is optional but recommended for webhook security

### 2. ✅ Intuit Developer Dashboard Configuration

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Find your app (App ID: `694ad793-ff6f-442d-8fce-1ece6e00117b`)
3. Click on **Keys & OAuth** section
4. Under **Redirect URIs**, add **EXACTLY** (case-sensitive, no trailing slash):
   - `https://your-production-domain.vercel.app/api/quickbooks/callback`
   - `http://localhost:3000/api/quickbooks/callback` (for local testing)

**Critical:** The redirect URI must match **EXACTLY** - no extra spaces, no trailing slashes, exact case.

### 2b. ✅ Webhook Configuration (Optional but Recommended)

1. In Intuit Developer Dashboard, go to **Webhooks** section
2. Select **Development** or **Production** environment
3. Set **Endpoint URL**:
   - Development: `http://localhost:3000/api/quickbooks/webhook`
   - Production: `https://your-production-domain.vercel.app/api/quickbooks/webhook`
4. Click **Show verifier token** and copy it
5. Add token to environment variables as `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN`
6. Select subscribed events (Account, Invoice, Customer, etc.)
7. Click **Save**

### 3. ✅ Database Setup

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Copy and paste the entire contents of database/quickbooks_connections.sql
```

Or manually create the table:

```sql
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

CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_user_id ON quickbooks_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_realm_id ON quickbooks_connections(realm_id);

ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;

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

### 4. ✅ Verify App Configuration in Intuit Dashboard

In Intuit Developer Dashboard, make sure:
- ✅ App is in **Development** mode (for sandbox) or **Production** mode
- ✅ **App Name** is set (not empty/undefined)
- ✅ **Redirect URIs** match exactly
- ✅ **Scopes** include: `com.intuit.quickbooks.accounting`

### 5. ✅ Test the Connection

1. Deploy to Vercel (or run locally)
2. Go to `/finance-hub`
3. Click "Connect to QuickBooks"
4. You should be redirected to Intuit login
5. After authorizing, you should be redirected back

### Common Issues & Fixes

**"undefined didn't connect"**
- ✅ Check that **App Name** is set in Intuit Developer Dashboard
- ✅ Verify redirect URI matches exactly
- ✅ Ensure environment variables are set in Vercel

**"Token exchange failed"**
- ✅ Verify `QUICKBOOKS_CLIENT_SECRET` is set correctly
- ✅ Check redirect URI matches exactly in both places
- ✅ Ensure app is in correct mode (sandbox vs production)

**"Database error"**
- ✅ Run the SQL migration in Supabase
- ✅ Verify RLS policies are created
- ✅ Check Supabase connection is working

### Quick Verification Commands

Check if environment variables are set (in Vercel):
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Verify all 4 variables are present

Check database table exists:
```sql
SELECT * FROM quickbooks_connections LIMIT 1;
```

If this fails, the table doesn't exist - run the migration.
