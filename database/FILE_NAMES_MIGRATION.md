# File Names Persistence - Database Migration

## Overview
File names are now persisted in the cloud database, not just localStorage. This ensures file names persist across devices and page refreshes.

## Database Migration Required

### Step 1: Run the SQL Migration
Run the following SQL in your Supabase SQL Editor (or Vercel Postgres SQL Editor):

```sql
-- Add user_metadata table for storing file names
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visual_file_name TEXT,
  survey_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id ON user_metadata(user_id);

-- Enable RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role full access user_metadata" ON user_metadata;

-- Allow all operations for service_role key (API routes handle security)
CREATE POLICY "Service role full access user_metadata" ON user_metadata
  FOR ALL USING (true) WITH CHECK (true);
```

**OR** simply run the file: `database/add-user-metadata.sql`

## How It Works

1. **On File Upload**: File names are saved to both:
   - localStorage (for offline/fallback)
   - Cloud database (via `/api/file-names` endpoint)

2. **On Page Load**: File names are loaded from:
   - Cloud database first (if authenticated)
   - Falls back to localStorage if database unavailable

3. **On Data Clear**: File names are cleared from both:
   - localStorage
   - Cloud database

## API Endpoints

- `GET /api/file-names` - Fetch file names for current user
- `POST /api/file-names` - Save file names for current user
- `DELETE /api/file-names` - Clear file names for current user

## Files Changed

1. `/app/api/file-names/route.ts` - New API endpoint
2. `/lib/database.ts` - Added `saveFileNames()` and `loadFileNames()` functions
3. `/components/DualFileUpload.tsx` - Updated to use database functions
4. `/database/add-user-metadata.sql` - Database migration script

## Testing

After running the migration:
1. Upload a file
2. Refresh the page
3. File name should still be visible
4. Clear browser data and sign in again - file name should persist

