# User Profile Database Migration

This migration adds user profile fields (workroom and role) and notifications table to the database.

## Steps to Run Migration

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Migration Script**
   - Copy and paste the contents of `add-user-profile.sql`
   - Click "Run" to execute the migration

3. **Verify Migration**
   - Check that the `user_metadata` table has `workroom` and `user_role` columns
   - Check that the `notifications` table exists
   - Verify indexes are created

## What This Migration Does

1. **Adds columns to `user_metadata` table:**
   - `workroom` (TEXT) - Stores the user's workroom (e.g., "Tampa", "Sarasota")
   - `user_role` (TEXT) - Stores the user's role (GM, PC, or Other)

2. **Creates `notifications` table:**
   - Stores notifications for users based on low heatmap scores
   - Links to users via `user_id`
   - Tracks read/unread status

3. **Creates indexes:**
   - Improves query performance for workroom and notification lookups

## Verification

After running the migration, you can verify it worked by running:

```sql
-- Check user_metadata columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_metadata' 
AND column_name IN ('workroom', 'user_role');

-- Check notifications table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'notifications';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('user_metadata', 'notifications');
```

## Troubleshooting

If you encounter errors:

1. **"relation does not exist"** - Make sure you've run the base schema migration first (`schema.sql` or `schema-simple.sql`)

2. **"column already exists"** - The migration uses `IF NOT EXISTS`, so this shouldn't happen, but if it does, the columns are already added

3. **Permission errors** - Make sure you're using the service role key in your environment variables

