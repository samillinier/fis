# 🔧 Fix: Database Connection Issue

## Problem Summary

You uploaded a file and it appears in your app, but you don't see it in Vercel Postgres. This is because:

1. **Your code is set up to use Vercel Postgres** (`@vercel/postgres` package)
2. **But the database connection isn't configured** (missing `POSTGRES_URL` environment variable)
3. **The app falls back to localStorage** when the database connection fails
4. **So data is saved locally in your browser**, not in the cloud database

## Quick Diagnosis

Visit this URL in your browser (or add `/api/db-check` to your app URL):
```
http://localhost:3000/api/db-check
```

This will tell you exactly what's wrong:
- ✅ If database is connected
- ✅ If tables exist
- ✅ What needs to be fixed

## Solution: Connect to Vercel Postgres

### Option 1: Use Vercel Postgres (Recommended)

**Step 1: Create Database in Vercel**
1. Go to: https://vercel.com/dashboard
2. Click your **"fis"** project
3. Click **"Storage"** tab (left sidebar)
4. Click **"Create Database"** button
5. Select **"Postgres"**
6. Name: `fis-database`
7. Click **"Create"**
8. Wait 1-2 minutes

**Step 2: Run Database Schema**
1. In Vercel Dashboard → Storage → Your Database
2. Click **"SQL Editor"** tab
3. Open `database/vercel-postgres-schema.sql` from your project
4. Copy **ALL** the SQL code
5. Paste into Vercel SQL Editor
6. Click **"Run"** (Cmd/Ctrl + Enter)
7. Verify: Click **"Tables"** tab - should see 3 tables

**Step 3: For Local Development**
1. In Vercel Dashboard → Storage → Your Database → **Settings**
2. Copy the **Connection String** (POSTGRES_URL)
3. Add to your `.env.local` file:
   ```
   POSTGRES_URL=your_connection_string_here
   ```
4. Restart dev server: `npm run dev`

**Step 4: Redeploy**
- Vercel will automatically add environment variables to your deployment
- Or manually redeploy from Vercel Dashboard

### Option 2: Check Current Setup

**If you already created the database:**
1. Check Vercel Dashboard → Your Project → Settings → Environment Variables
2. Look for `POSTGRES_URL` - it should be there automatically
3. If not, the database might not be linked to your project
4. Make sure you created it in the same Vercel project

## Verify It's Working

1. **Check database connection:**
   - Visit: `http://localhost:3000/api/db-check`
   - Should show: `"connected": true` and all tables exist

2. **Upload a file:**
   - Upload a CSV/Excel file
   - Check browser console (F12) for errors
   - Check Network tab → Look for `/api/data` request
   - Should return `200 OK`

3. **Check Vercel Postgres:**
   - Vercel Dashboard → Storage → Your Database → Tables
   - Click `workroom_data` table
   - Your uploaded data should be there!

## Why Data Appears in App But Not Database

The app has a **fallback mechanism**:
1. First tries to save to Vercel Postgres (via `/api/data`)
2. If that fails, saves to localStorage (browser storage)
3. When loading, it tries database first, then localStorage

So your data is working in the app because it's saved to localStorage, but it's not in the cloud database yet.

## Next Steps

1. ✅ Create Vercel Postgres database
2. ✅ Run the schema SQL
3. ✅ Add POSTGRES_URL to `.env.local` (for local dev)
4. ✅ Redeploy (for production)
5. ✅ Test by uploading a file
6. ✅ Verify data appears in Vercel Postgres

---

**Need help?** Check the diagnostic endpoint: `/api/db-check`

