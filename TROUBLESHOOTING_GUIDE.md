# 🔍 Troubleshooting: "I Don't See It"

## What are you not seeing?

### Option 1: Don't see tables in Supabase

**Check if schema was run:**
1. Go to Supabase Dashboard → Table Editor
2. Do you see 3 tables: `users`, `workroom_data`, `historical_data`?
   - ✅ **If YES:** Tables exist, skip to Option 2
   - ❌ **If NO:** You need to run the schema (see below)

**Run the schema:**
1. Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy ALL code from `database/schema.sql` (all 93 lines)
4. Paste and click "Run"
5. Check Table Editor again

---

### Option 2: Don't see data after uploading

**Step 1: Check if you're signed in**
- Data is filtered by user email
- Make sure you're signed in to the app

**Step 2: Check browser console**
1. Open your app
2. Press F12 (open DevTools)
3. Go to "Console" tab
4. Upload a file
5. Look for:
   - ✅ "✅ Data saved to database successfully" = Working!
   - ❌ Any red errors = Problem

**Step 3: Check database connection**
1. Visit: `https://your-app.vercel.app/api/db-check`
2. Should show:
   ```json
   {
     "connected": true,
     "tables": {
       "users": true,
       "workroom_data": true,
       "historical_data": true
     }
   }
   ```

**Step 4: Check Supabase Table Editor**
1. Supabase Dashboard → Table Editor
2. Click `workroom_data` table
3. Click "View data" or refresh
4. Your uploaded data should be there

---

### Option 3: Don't see the schema.sql file

The file is at: `/Users/samuelendale/Documents/FIS/database/schema.sql`

**To copy it:**
1. Open the file in your editor
2. Select all (Cmd+A)
3. Copy (Cmd+C)
4. Paste into Supabase SQL Editor

---

### Option 4: Connection errors

**Check environment variables:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verify these exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. If missing, add them and redeploy

**Check Supabase keys:**
- Make sure keys are correct in Vercel
- They should match your `.env.local` file

---

## Quick Test Steps

1. **Test connection:**
   ```
   https://your-app.vercel.app/api/db-check
   ```

2. **Check tables exist:**
   - Supabase → Table Editor → Should see 3 tables

3. **Upload test file:**
   - Sign in → Upload CSV/Excel
   - Check browser console (F12)
   - Check Supabase → `workroom_data` table

4. **If still not working:**
   - Share the error message from browser console
   - Share what `/api/db-check` shows

---

**What specifically are you not seeing?**
- Tables in Supabase?
- Data after uploading?
- The schema.sql file?
- Something else?

Let me know and I'll help you fix it!

