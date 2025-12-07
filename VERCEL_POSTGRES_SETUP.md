# 🚀 Vercel Postgres Setup Guide

## ✅ What I've Done:

1. ✅ Installed `@vercel/postgres` package
2. ✅ Created Vercel Postgres schema (`database/vercel-postgres-schema.sql`)
3. ✅ Updated API routes to use Vercel Postgres
4. ✅ Updated database functions with localStorage fallback
5. ✅ Created helper functions for user management

## 📋 Setup Steps:

### Step 1: Create Vercel Postgres Database

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Click your **"fis"** project

2. **Create Database:**
   - Click **"Storage"** tab (left sidebar)
   - Click **"Create Database"**
   - Select **"Postgres"**
   - Choose a name: `fis-database` (or your preference)
   - Select region closest to you
   - Click **"Create"**

3. **Wait for Database to be Ready:**
   - Takes 1-2 minutes
   - You'll see connection status

### Step 2: Run Database Schema

1. **Open SQL Editor:**
   - In Vercel Dashboard → Your Project → Storage
   - Click on your Postgres database
   - Click **"SQL Editor"** tab

2. **Run Schema:**
   - Open `database/vercel-postgres-schema.sql` from your project
   - Copy ALL the SQL code
   - Paste into Vercel Postgres SQL Editor
   - Click **"Run"** or press Cmd/Ctrl + Enter
   - Should see: ✅ "Success" or "No rows returned"

3. **Verify Tables Created:**
   - Click **"Tables"** tab
   - You should see: `users`, `workroom_data`, `historical_data`

### Step 3: Environment Variables (Auto-Configured)

✅ **Vercel automatically adds these environment variables:**
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

**No manual setup needed!** Vercel does this automatically when you create the database.

### Step 4: Install Dependencies

Run this locally:

```bash
npm install
```

This installs `@vercel/postgres` package.

### Step 5: Deploy to Vercel

1. **Commit and Push:**
   ```bash
   git add .
   git commit -m "Set up Vercel Postgres integration"
   git push origin main
   ```

2. **Vercel will auto-deploy** (if connected to GitHub)
   - Or manually redeploy from Vercel Dashboard

### Step 6: Test

1. **Visit:** https://fis-he6w.vercel.app
2. **Sign in** with Microsoft
3. **Upload data** - should save to Vercel Postgres!
4. **Check database:**
   - Vercel Dashboard → Storage → Your Database → Tables
   - Should see data in `workroom_data` and `historical_data`

## ✅ How It Works:

### Storage Priority:
1. **First:** Tries to save to Vercel Postgres (via API routes)
2. **Fallback:** If API fails, saves to localStorage
3. **Always:** Saves to localStorage as backup

### Benefits:
- ✅ Persistent cloud storage
- ✅ Works across devices
- ✅ Automatic backups
- ✅ localStorage fallback if database unavailable

## 🔍 Verify Setup:

### Check Database:
1. Vercel Dashboard → Storage → Your Database
2. Click **"Tables"** tab
3. Should see: `users`, `workroom_data`, `historical_data`

### Check Data:
1. After uploading data in the app
2. Go to **"Tables"** → `workroom_data`
3. Click **"Data"** tab
4. Should see your uploaded data!

## 🆘 Troubleshooting:

### Error: "Database tables not found"
- **Fix:** Run `database/vercel-postgres-schema.sql` in SQL Editor

### Error: "Connection failed"
- **Fix:** Check database is created and running in Vercel Dashboard

### Data not saving to database
- **Check:** Browser console (F12) for errors
- **Check:** Vercel Function Logs for API errors
- **Fallback:** Data is saved to localStorage as backup

## 📋 Checklist:

- [ ] Created Vercel Postgres database
- [ ] Ran `database/vercel-postgres-schema.sql` in SQL Editor
- [ ] Verified 3 tables created (users, workroom_data, historical_data)
- [ ] Installed dependencies (`npm install`)
- [ ] Deployed to Vercel
- [ ] Tested uploading data
- [ ] Verified data in database tables

---

**Your app is now ready for Vercel Postgres! Follow the steps above to complete setup.** 🚀

