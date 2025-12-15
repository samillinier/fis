# Debug: Data Not Saving to Supabase

## Quick Test

1. **Open your application**
2. **Open Browser Console** (F12 → Console tab)
3. **Upload a file** (visual or survey data)
4. **Look for these messages:**
   - `💾 [DualFileUpload] Saving visual/survey data to Supabase...`
   - `💾 [POST /api/data] Saving data for user...`
   - `✅ Saved X visual records to visual_data table`
   - **Any red error messages**

## Common Issues & Solutions

### Issue 1: No Console Messages
**Problem:** Upload button doesn't trigger save
**Solution:** Check if `setData()` is being called after file upload

### Issue 2: "Database tables not found" Error
**Problem:** Migration not run
**Solution:** Run `database/separate-visual-survey-tables.sql` in Supabase SQL Editor

### Issue 3: "Unauthorized" Error
**Problem:** User not logged in
**Solution:** Make sure you're logged in before uploading

### Issue 4: Data Saved But Not Visible
**Problem:** user_id mismatch
**Solution:** Run diagnostic query:
```sql
SELECT v.*, u.email 
FROM visual_data v 
LEFT JOIN users u ON v.user_id = u.id 
ORDER BY v.created_at DESC;
```

### Issue 5: Silent Failure
**Problem:** Error not being logged
**Solution:** Check server logs (Vercel/Next.js logs)

## Test Endpoint

I've created a test endpoint. To use it:

1. **Open Browser Console**
2. **Run this command:**
```javascript
fetch('/api/test-save', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('fis-user')).email,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

This will test if:
- Tables exist
- You can insert data
- You can read data back
- Your user_id is correct

## What to Share

If data still doesn't save, share:
1. **Browser console output** (all messages after upload)
2. **Result of test endpoint** (from above)
3. **Any error messages** you see



