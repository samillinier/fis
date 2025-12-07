# ⚡ Quick Fix: Internal Server Error

## What's Happening:

The server is crashing when trying to load. Most likely causes:

1. **Supabase connection failing** (database not configured or invalid keys)
2. **Missing environment variables**
3. **API route initialization error**

## 🔍 Step 1: Check the Terminal

**Look at the terminal where `npm run dev` is running:**

You should see error messages. Common ones:
- `Missing Supabase configuration`
- `Database error: requested path is invalid`
- `Cannot read property of undefined`

**Share those error messages and I can fix it!**

## ⚡ Quick Fix: Disable Database Temporarily

If database is causing issues, the app can work with localStorage only. But first, let's see what the actual error is.

## 🛠️ What I Just Fixed:

I updated the API routes to initialize Supabase client only when needed (lazy initialization) instead of at module level. This should prevent crashes during startup.

## ✅ Try This:

1. **Restart the server:**
   ```bash
   # Press Ctrl+C to stop
   # Then:
   npm run dev
   ```

2. **Check if error is gone**

3. **If still error, share the terminal output**

## 📋 Common Errors & Fixes:

### Error: "Missing Supabase configuration"
**Fix:** Check `.env.local` has all Supabase variables

### Error: "requested path is invalid"
**Fix:** Database tables don't exist - run `database/schema.sql` in Supabase

### Error: "Cannot read property of undefined"
**Fix:** Share the full error message for specific fix

---

**Restart the server and share the terminal error message if it persists!**

