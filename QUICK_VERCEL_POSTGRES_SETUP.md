# ⚡ Quick Vercel Postgres Setup

## ✅ Code Changes Complete!

I've updated your code to use Vercel Postgres. Now you just need to create the database in Vercel.

## 🚀 Quick Setup (5 minutes):

### Step 1: Create Database in Vercel

1. **Go to:** https://vercel.com/dashboard
2. **Click** your **"fis"** project
3. **Click** **"Storage"** tab (left sidebar)
4. **Click** **"Create Database"** button
5. **Select** **"Postgres"**
6. **Name:** `fis-database` (or any name)
7. **Region:** Choose closest to you
8. **Click** **"Create"**
9. **Wait 1-2 minutes** for database to be ready

### Step 2: Run SQL Schema

1. **Open SQL Editor:**
   - In Vercel Dashboard → Storage → Your Database
   - Click **"SQL Editor"** tab

2. **Copy Schema:**
   - Open `database/vercel-postgres-schema.sql` from your project
   - Copy ALL the SQL code

3. **Paste and Run:**
   - Paste into Vercel SQL Editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)
   - Should see: ✅ "Success"

4. **Verify Tables:**
   - Click **"Tables"** tab
   - Should see: `users`, `workroom_data`, `historical_data`

### Step 3: Deploy

1. **Install dependencies locally:**
   ```bash
   npm install
   ```

2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add Vercel Postgres integration"
   git push origin main
   ```

3. **Vercel will auto-deploy** (or redeploy from dashboard)

### Step 4: Test

1. **Visit:** https://fis-he6w.vercel.app
2. **Sign in** with Microsoft
3. **Upload data** - should save to Vercel Postgres!
4. **Check database:**
   - Vercel Dashboard → Storage → Your Database → Tables
   - Should see your data in `workroom_data` table

## ✅ That's It!

- ✅ Environment variables are auto-configured by Vercel
- ✅ Code is ready to use Postgres
- ✅ localStorage fallback if database unavailable

## 📋 Checklist:

- [ ] Created Vercel Postgres database
- [ ] Ran SQL schema in SQL Editor
- [ ] Verified 3 tables created
- [ ] Installed dependencies (`npm install`)
- [ ] Deployed to Vercel
- [ ] Tested uploading data
- [ ] Verified data in database

---

**Follow Steps 1-2 above to complete setup!** 🚀

