# 🔧 Fix: "requested path is invalid" Error

## What This Error Means

The error `{"error":"requested path is invalid"}` means Supabase can't connect to your database. This usually happens because:

1. **Database tables don't exist yet** (most common)
2. **Keys are in wrong format**
3. **Database URL is incorrect**

## ✅ Quick Fix (Most Likely Solution)

### Step 1: Run the Database Schema

The tables need to be created first. Here's how:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/idkuchtgrgooqixdjjcc
   - Or go to: https://supabase.com/dashboard → Select your project

2. **Open SQL Editor:**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button

3. **Run the Schema:**
   - Open file: `database/schema.sql` from your project folder
   - Copy ALL the SQL code (everything in that file)
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or press Cmd+Enter)
   - You should see: ✅ "Success. No rows returned"

4. **Verify Tables Created:**
   - Click **"Table Editor"** in left sidebar
   - You should see 3 tables:
     - `users`
     - `workroom_data`
     - `historical_data`

### Step 2: Restart Your Server

```bash
npm run dev
```

### Step 3: Test Again

Try uploading data again. The error should be gone!

## 🔍 If That Doesn't Work

### Check Your Keys Format

Your current keys use a custom format:
- `sb_publishable_Vqo7Xww4Go4iQJ7U44t9vQ_ZbZokbID`
- `sb_secret_1u_e0Fo-lp_LCy8Zjsw2nQ_7OWZqMBH`

**Standard Supabase keys are JWT tokens** that:
- Start with `eyJ...`
- Are 200+ characters long
- Look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...`

**To get the correct keys:**

1. Go to Supabase Dashboard → **Settings** → **API**
2. Find **"Project API keys"** section
3. Copy:
   - **anon/public** key (the long JWT token starting with `eyJ...`)
   - **service_role** key (the long JWT token starting with `eyJ...`)
4. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...paste_your_long_jwt_token_here...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...paste_your_long_jwt_token_here...
   ```
5. Restart server: `npm run dev`

## 🎯 Most Common Fix

**99% of the time, the issue is:** The database tables don't exist yet.

**Solution:** Run `database/schema.sql` in Supabase SQL Editor (see Step 1 above).

## 📝 Still Having Issues?

1. Check browser console (F12) for full error message
2. Check server terminal for error details
3. Verify Supabase project is active (not paused)
4. Make sure `.env.local` file exists and has correct values

---

**Note:** The app will automatically use localStorage as a fallback if the database fails, so you can still use the app while fixing the database connection!

