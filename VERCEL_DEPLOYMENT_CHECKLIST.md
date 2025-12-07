# ✅ Vercel Deployment Checklist - Supabase Setup

## 🎉 Your Code is Deployed!

Now let's make sure everything is connected properly.

## Step 1: Verify Environment Variables in Vercel

Your app needs these environment variables in Vercel to connect to Supabase:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Click your **"fis"** project

2. **Go to Settings → Environment Variables**

3. **Verify these 3 Supabase variables are set:**

   ```
   NEXT_PUBLIC_SUPABASE_URL
   Value: https://idkuchtgrgooqixdjjcc.supabase.co
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: sb_publishable_Vqo7Xww4Go4iQJ7U44t9vQ_ZbZokbID
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

   ```
   SUPABASE_SERVICE_ROLE_KEY
   Value: sb_secret_1u_e0Fo-lp_LCy8Zjsw2nQ_7OWZqMBH
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

4. **Also verify Microsoft Auth variables:**
   ```
   NEXT_PUBLIC_MSAL_CLIENT_ID
   Value: 90da75a4-0ce9-49a2-9ab9-79adaaf65b3a
   ```

   ```
   NEXT_PUBLIC_MSAL_TENANT_ID
   Value: common
   ```

## Step 2: Run Database Schema in Supabase

**This is REQUIRED!** Your Supabase database needs the tables created.

1. **Open Supabase Dashboard:**
   - In Vercel Dashboard → Storage → Click `fis-database`
   - Click **"Open in Supabase"** button (top right)
   - OR go directly to: https://supabase.com/dashboard/project/idkuchtgrgooqixdjjcc

2. **Run the Schema:**
   - Click **"SQL Editor"** (left sidebar)
   - Click **"New Query"**
   - Open `database/schema.sql` from your project
   - Copy **ALL** the SQL code (lines 1-93)
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)
   - Should see: ✅ "Success. No rows returned"

3. **Verify Tables Created:**
   - Click **"Table Editor"** (left sidebar)
   - You should see 3 tables:
     - ✅ `users`
     - ✅ `workroom_data`
     - ✅ `historical_data`

## Step 3: Redeploy (If You Just Added Environment Variables)

If you just added environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for redeploy to complete

## Step 4: Test Your Deployed App

1. **Visit your app:**
   - Your Vercel URL (e.g., `https://fis-he6w.vercel.app`)

2. **Check database connection:**
   - Visit: `https://your-app.vercel.app/api/db-check`
   - Should show: `"connected": true` and all tables exist

3. **Test file upload:**
   - Sign in to your app
   - Upload a CSV/Excel file
   - Check browser console (F12) - should see: "✅ Data saved to database successfully"
   - Check Supabase Dashboard → Table Editor → `workroom_data` table
   - Your data should be there! 🎉

## Troubleshooting

### "Database tables not found"
- **Fix:** Run `database/schema.sql` in Supabase SQL Editor (Step 2 above)

### "Supabase environment variables not found"
- **Fix:** Add the 3 Supabase variables to Vercel Environment Variables (Step 1)
- **Then:** Redeploy (Step 3)

### Data not appearing in Supabase
1. Check browser console for errors (F12)
2. Visit `/api/db-check` to see connection status
3. Make sure you're signed in (data is filtered by user)
4. Verify tables exist in Supabase Table Editor

### App shows errors after deployment
1. Check Vercel deployment logs:
   - Deployments → Latest → Click on it → View logs
2. Check for build errors
3. Verify all environment variables are set correctly

## Quick Verification Commands

After deployment, you can test:

1. **Check database connection:**
   ```
   https://your-app.vercel.app/api/db-check
   ```

2. **Expected response:**
   ```json
   {
     "connected": true,
     "tables": {
       "users": true,
       "workroom_data": true,
       "historical_data": true
     },
     "message": "✅ Database connected and all tables exist!"
   }
   ```

---

**Once you complete Step 2 (run the schema), your app should be fully working!** 🚀

