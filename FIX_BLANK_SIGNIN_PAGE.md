# 🔧 Fix: Blank Sign-In Page on Vercel

## Issue: https://pod.floorinteriorservices.com/signin shows nothing

The page is loading (HTTP 200) but displaying blank. Here are the most likely causes:

## 🚨 Most Common Issues:

### 1. Environment Variables Missing in Vercel

**Check this first!**

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Click on your project (fis)
3. Go to **Settings** → **Environment Variables**
4. Verify these are ALL set:
   - ✅ `NEXT_PUBLIC_MSAL_CLIENT_ID`
   - ✅ `NEXT_PUBLIC_MSAL_TENANT_ID`
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`

**If any are missing:**
- Add them (see `ENV_VARS_FOR_VERCEL.txt` for values)
- Make sure they're enabled for **Production**, **Preview**, and **Development**
- **Redeploy** your project after adding

### 2. Check Browser Console for Errors

1. Open: https://pod.floorinteriorservices.com/signin
2. Press **F12** (or Cmd+Option+I on Mac)
3. Open **Console** tab
4. Look for red error messages

**Common errors:**
- `NEXT_PUBLIC_MSAL_CLIENT_ID is not defined` → Environment variable missing
- `Cannot read property of undefined` → JavaScript error
- `Module not found` → Build issue
- `Failed to load script` → CDN issue

### 3. Check Vercel Build Logs

1. Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Scroll down to **Build Logs**
4. Look for errors (red text)

**If build failed:**
- Fix the errors shown in logs
- Push changes to GitHub
- Vercel will auto-redeploy

### 4. Auth Context Loading Issue

The sign-in page returns `null` while loading. Check if `AuthContext` is stuck loading:

**In browser console, type:**
```javascript
localStorage.getItem('fis-user')
```

**If this returns something:**
- Clear it: `localStorage.removeItem('fis-user')`
- Refresh the page

### 5. Missing Logo Image

The page tries to load `/logo.png`. If it's missing, it might cause issues:

1. Check if `public/logo.png` exists
2. Verify it was deployed (check Vercel build logs)

## 🛠️ Quick Fix Steps:

### Step 1: Verify Environment Variables
```
1. Vercel Dashboard → Settings → Environment Variables
2. Check all 5 variables are present
3. If missing, add them from ENV_VARS_FOR_VERCEL.txt
4. Redeploy
```

### Step 2: Clear Browser Cache
```
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
2. Or open in Incognito/Private window
```

### Step 3: Check Console Errors
```
1. Open browser DevTools (F12)
2. Console tab
3. Note any errors
4. Share them for debugging
```

### Step 4: Test Home Page
```
Try: https://pod.floorinteriorservices.com
- Does it redirect to /signin?
- Does it show anything?
```

## 🔍 What to Share for Help:

1. **Browser Console Errors** (F12 → Console tab)
2. **Vercel Build Logs** (from Deployments tab)
3. **Environment Variables Status** (screenshot from Vercel)
4. **What you see** (completely blank? loading spinner? error message?)

## ⚡ Most Likely Fix:

**90% of the time it's missing environment variables!**

1. Go to Vercel → Settings → Environment Variables
2. Add all 5 variables from `ENV_VARS_FOR_VERCEL.txt`
3. Redeploy: Deployments → Latest → "..." → Redeploy
4. Wait 2-3 minutes
5. Try again

---

**Need more help?** Share the browser console errors and I can help fix them!

