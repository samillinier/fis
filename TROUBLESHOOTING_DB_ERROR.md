# 🔧 Troubleshooting: "requested path is invalid" Error

## The Error
If you're seeing: `{"error":"requested path is invalid"}`

This means Supabase is rejecting the connection. Here's how to fix it:

## ✅ Quick Fixes:

### 1. **Check Database Schema (Most Common Issue)**
The error often means the database tables don't exist yet.

**Fix:**
1. Go to: https://supabase.com/dashboard/project/idkuchtgrgooqixdjjcc
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**
4. Open `database/schema.sql` from your project
5. Copy ALL the SQL code
6. Paste and click **"Run"**
7. Should see: ✅ "Success. No rows returned"

### 2. **Verify Your Keys Format**

Your current keys:
- `sb_publishable_Vqo7Xww4Go4iQJ7U44t9vQ_ZbZokbID`
- `sb_secret_1u_e0Fo-lp_LCy8Zjsw2nQ_7OWZqMBH`

These are in a custom format. Standard Supabase keys are JWT tokens that:
- Start with `eyJ...`
- Are 200+ characters long
- Look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...`

**If your keys don't work:**

1. Go to Supabase Dashboard → **Settings** → **API**
2. Look for **"Project API keys"** section
3. Find:
   - **anon/public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)
4. Copy these JWT tokens
5. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_long_jwt_token...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your_long_jwt_token...
   ```
6. Restart your server: `npm run dev`

### 3. **Check Supabase URL**

Make sure your URL is correct:
```
https://idkuchtgrgooqixdjjcc.supabase.co
```

It should:
- Start with `https://`
- End with `.supabase.co`
- No trailing slash

### 4. **Verify Environment Variables**

Check `.env.local` exists and has all values:
```bash
cat .env.local
```

Should show:
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

### 5. **Restart Server After Changes**

After updating `.env.local`, always restart:
```bash
npm run dev
```

## 🎯 Most Likely Solution:

**Run the database schema SQL first!** The tables need to exist before you can use them.

1. Open Supabase SQL Editor
2. Run `database/schema.sql`
3. Then test your app again

## 📝 Still Not Working?

1. Check browser console for full error message
2. Check server terminal for error details
3. Verify Supabase project is active (not paused)
4. Make sure you're using JWT token keys (not custom format)

---

**The app will automatically fallback to localStorage if database connection fails, so you can still use it while fixing the database!** ✅

