# Complete Debug Steps - Data Not Saving

## Step 1: Disable RLS (Most Important!)

Run this in Supabase SQL Editor:
```sql
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;
```

**This is likely the main issue!** RLS might be blocking inserts even with service role.

## Step 2: Check Browser Console

1. Open your app
2. Press **F12** → **Console** tab
3. **Clear the console** (right-click → Clear console)
4. Upload your data file
5. **Copy ALL messages** and share them

Look for:
- `💾 [saveDashboardData] Called with X workrooms`
- `💾 [POST /api/data] Saving data for user...`
- `📊 Separated: X visual records, Y survey records`
- `✅ Saved X visual records`
- **Any red error messages**

## Step 3: Check if API is Being Called

In browser console, you should see:
- `💾 [DualFileUpload] Saving visual/survey data to Supabase...`
- `💾 [saveDashboardData] Called with X workrooms`

If you DON'T see these → `setData()` isn't being called

## Step 4: Verify Data Format

The console should show:
- `📊 [POST /api/data] First workroom sample: { name: ..., hasSales: ..., hasLtrScore: ... }`

This confirms data is being sent correctly.

## Step 5: Check Insert Response

Look for:
- `📡 [POST /api/data] Insert response: { error: ..., success: ... }`
- `🔍 [POST /api/data] Verification query result:`

This shows if the insert actually worked.

## Step 6: Final Verification

After upload, run this in Supabase:
```sql
SELECT COUNT(*) FROM visual_data;
SELECT COUNT(*) FROM survey_data;
```

If still 0 → Insert is failing
If > 0 → Data is saving, might be user_id issue

## Most Likely Issues (in order):

1. **RLS blocking inserts** → Disable RLS (Step 1)
2. **API not being called** → Check console for `saveDashboardData` messages
3. **Insert failing silently** → Check `Insert response` in console
4. **Wrong user_id** → Already fixed with the SQL I gave you

## What to Share

After following steps 1-2, share:
1. **All browser console messages** (copy/paste)
2. **Result of Step 6** (count queries)
3. **Any error messages** you see





