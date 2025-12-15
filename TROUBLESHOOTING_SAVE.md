# Troubleshooting: Data Not Saving to Supabase

## Quick Checks

### 1. Check Browser Console
After uploading, look for:
- ✅ `💾 [POST /api/data] Saving data for user...`
- ✅ `✅ Saved X visual records to visual_data table`
- ❌ Any red error messages

### 2. Check Server Logs
If you have access to Vercel/Next.js logs, check for:
- API route errors
- Database connection errors
- Insert errors

### 3. Test Database Connection
Run this in Supabase SQL Editor:
```sql
-- Check if you can manually insert
INSERT INTO visual_data (user_id, workroom_name, store, sales, data_jsonb)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'TEST',
  '123',
  1000,
  '{"name": "TEST", "store": "123", "sales": 1000}'::jsonb
);

-- Check if it was inserted
SELECT * FROM visual_data WHERE workroom_name = 'TEST';

-- Clean up
DELETE FROM visual_data WHERE workroom_name = 'TEST';
```

## Common Issues

### Issue 1: RLS Blocking Inserts
**Symptom:** No errors, but data doesn't appear
**Solution:** Run `database/disable-rls-temporarily.sql` to test

### Issue 2: data_jsonb is NULL
**Symptom:** Error about required field
**Solution:** Check if workroom data is being properly formatted

### Issue 3: user_id Mismatch
**Symptom:** Data saved but not visible to you
**Solution:** Check your user_id matches the data's user_id

### Issue 4: Tables Don't Exist
**Symptom:** Error "relation does not exist"
**Solution:** Run `database/separate-visual-survey-tables.sql`

## Debug Steps

1. **Upload data** → Watch browser console
2. **Check for errors** → Look for red messages
3. **Run test endpoint** → `/api/test-save` (see DEBUG_DATA_SAVE.md)
4. **Check Supabase** → Run diagnostic queries
5. **Try disabling RLS** → See if that's the issue

## What to Share

If still not working, share:
1. Browser console output (all messages)
2. Any error messages
3. Result of test endpoint
4. Result of manual insert test (above)



