# 🔍 Database Connection Diagnostic Guide

## Problem: Files uploaded but not visible in Vercel Postgres

### Quick Check:

1. **Open your browser console** (F12)
2. **Go to:** `http://localhost:3000/api/db-check` (or your Vercel URL + `/api/db-check`)
3. **Check the response** - it will tell you what's wrong

## Common Issues & Solutions:

### Issue 1: POSTGRES_URL Not Set

**Symptoms:**
- Response shows: `"POSTGRES_URL environment variable not found"`

**Solution:**
1. Go to **Vercel Dashboard** → Your Project → **Storage**
2. Click **"Create Database"** → Select **"Postgres"**
3. Name it `fis-database` (or any name)
4. Wait 1-2 minutes for database to be created
5. **Redeploy** your application (Vercel will auto-add environment variables)

**For Local Development:**
- After creating the database in Vercel, go to:
  - Vercel Dashboard → Your Project → Storage → Your Database → **Settings**
  - Copy the **Connection String** (POSTGRES_URL)
  - Add it to your `.env.local` file:
    ```
    POSTGRES_URL=your_connection_string_here
    ```
  - Restart your dev server: `npm run dev`

### Issue 2: Database Tables Don't Exist

**Symptoms:**
- Response shows: `"missingTables": ["users", "workroom_data", "historical_data"]`

**Solution:**
1. Go to **Vercel Dashboard** → Your Project → **Storage** → Your Database
2. Click **"SQL Editor"** tab
3. Open `database/vercel-postgres-schema.sql` from your project
4. Copy **ALL** the SQL code
5. Paste into Vercel SQL Editor
6. Click **"Run"** (or Cmd/Ctrl + Enter)
7. Verify: Click **"Tables"** tab - should see 3 tables

### Issue 3: Database Connection Failed

**Symptoms:**
- Response shows: `"Database connection failed"`

**Solution:**
1. Check if database is running in Vercel Dashboard
2. Verify environment variables are set in Vercel
3. Make sure you redeployed after creating the database
4. Check Vercel deployment logs for errors

### Issue 4: Data Saves to localStorage Only

**Symptoms:**
- File uploads work, but data only appears in browser localStorage
- Data doesn't appear in Vercel Postgres

**Solution:**
- This happens when:
  1. No user is logged in (check localStorage for `fis-user`)
  2. Database connection fails (falls back to localStorage)
  3. API route returns an error (check browser console)

**Check:**
1. Open browser console (F12)
2. Look for errors when uploading a file
3. Check Network tab → Look for `/api/data` request
4. See if it returns an error (401, 500, etc.)

## Step-by-Step Fix:

### Step 1: Check Current Status
Visit: `http://localhost:3000/api/db-check` (or your Vercel URL)

### Step 2: Create Database (if needed)
- Vercel Dashboard → Storage → Create Database → Postgres

### Step 3: Run Schema (if needed)
- Vercel Dashboard → Storage → Your Database → SQL Editor
- Run `database/vercel-postgres-schema.sql`

### Step 4: Add Local Environment Variable (for local dev)
Add to `.env.local`:
```
POSTGRES_URL=your_connection_string_from_vercel
```

### Step 5: Test Again
1. Restart dev server: `npm run dev`
2. Upload a file
3. Check Vercel Postgres → Tables → `workroom_data`

## Verification:

After fixing, you should see:
- ✅ `connected: true`
- ✅ All tables exist: `users`, `workroom_data`, `historical_data`
- ✅ File uploads save to database
- ✅ Data visible in Vercel Postgres dashboard

---

**Still having issues?** Check:
- Browser console for errors
- Vercel deployment logs
- Network tab for API request/response

