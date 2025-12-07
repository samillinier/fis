# ✅ How to Test if Vercel Postgres Database is Working

## 🎯 Quick Test Steps:

### Step 1: Sign In to Your App
1. Visit: https://fis-he6w.vercel.app
2. Sign in with Microsoft (after fixing redirect URIs)

### Step 2: Upload Data
1. Upload visual data (Excel file)
2. Upload survey data (if you have it)
3. The data should save automatically

### Step 3: Check Browser Console (F12)
1. Open browser Developer Tools (Press F12)
2. Go to **"Console"** tab
3. Look for messages:
   - ✅ **Good:** No errors, or "Data saved successfully"
   - ❌ **Bad:** "Database API error, using localStorage fallback" = Database not working

### Step 4: Check Database in Vercel Dashboard

#### Option A: Check via Vercel Storage
1. Go to: https://vercel.com/dashboard
2. Click your **"fis"** project
3. Click **"Storage"** tab
4. Click your **Postgres database** (`fis-database`)
5. Click **"Tables"** tab
6. Click **"workroom_data"** table
7. Click **"Data"** tab
8. **You should see your uploaded data here!** ✅

#### Option B: Check via Supabase Dashboard
1. Go to: https://vercel.com/dashboard
2. Click your **"fis"** project
3. Click **"Storage"** tab
4. Click your database
5. Click **"Open in Supabase"** button
6. In Supabase:
   - Click **"Table Editor"** (left sidebar)
   - Click **"workroom_data"** table
   - **You should see your data!** ✅

### Step 5: Verify Data Persists
1. Upload data in your app
2. **Refresh the page** (F5)
3. Navigate to a different page and come back
4. **Close and reopen your browser**
5. **Sign in again**
6. Your data should still be there! ✅

If data persists after refresh, the database is working!

## ✅ Signs Database is Working:

- ✅ Data appears in Vercel Storage → Tables → workroom_data
- ✅ Data persists after page refresh
- ✅ Data persists after closing browser
- ✅ No "localStorage fallback" messages in console
- ✅ Multiple users can see their own data (if testing with different accounts)

## ❌ Signs Database is NOT Working:

- ❌ Console shows "Database API error, using localStorage fallback"
- ❌ Data disappears after page refresh
- ❌ No data in Vercel Storage tables
- ❌ Error messages in browser console (F12)
- ❌ 500 errors in Vercel Function Logs

## 🔍 Advanced: Check Vercel Function Logs

1. Go to: https://vercel.com/dashboard
2. Click your **"fis"** project
3. Click **"Logs"** tab (or "Deployments" → Latest → "Functions")
4. Look for API calls to `/api/data`:
   - ✅ **Success:** Status 200, no errors
   - ❌ **Failure:** Status 500, error messages

## 🧪 Test Upload Flow:

1. **Sign in** → Should work
2. **Upload Excel file** → Should process
3. **See dashboard with data** → Should display
4. **Refresh page** → Data should still be there
5. **Check database tables** → Should see data in `workroom_data`

---

**If all these steps work, your database is working perfectly!** 🎉

