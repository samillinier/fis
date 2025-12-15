# Debug: Tables Are Empty (0 Records)

## Problem
Both `visual_data` and `survey_data` tables show 0 records, meaning data is NOT being saved.

## Possible Causes

### 1. RLS (Row Level Security) Blocking Inserts
**Most Likely Issue!**

The RLS policies might be blocking inserts even with service role. 

**Fix:** Run this in Supabase SQL Editor:
```sql
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;
```

Then try uploading data again.

### 2. Insert Failing Silently
The insert might be failing but errors aren't being shown.

**Check:** 
1. Open browser console (F12)
2. Upload data
3. Look for red error messages
4. Check for messages like:
   - `❌ Error inserting visual data:`
   - `📡 Insert response: { error: ... }`

### 3. API Not Being Called
The save function might not be triggering.

**Check:**
1. Browser console should show: `💾 [POST /api/data] Saving data for user...`
2. If you don't see this, `setData()` isn't being called

### 4. Data Validation Failing
All records might be filtered out as invalid.

**Check:** Look for messages like:
- `⚠️ Skipping visual record with null data_jsonb`
- `❌ No valid visual records to insert`

## Debug Steps

### Step 1: Test Manual Insert
Run `database/test-insert-manually.sql` to verify tables work:
1. Get your user_id
2. Try inserting a test record manually
3. If it works → Tables are fine, issue is in code
4. If it fails → Table/RLS issue

### Step 2: Disable RLS
Run the SQL above to disable RLS temporarily.

### Step 3: Check Browser Console
Upload data and watch for:
- `💾 [POST /api/data] Saving data...`
- `📡 Insert response:`
- Any error messages

### Step 4: Check Server Logs
If you have Vercel/Next.js logs, check for:
- API route errors
- Database connection errors
- Insert errors

## Quick Fix

**Most likely solution:** Disable RLS temporarily:

```sql
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
```

Then upload data again. If it works, we know RLS was the issue and can fix the policies.



