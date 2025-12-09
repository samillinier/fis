# 🔧 Fix Preview Deployment Redirect URI Error

## The Issue

You're seeing this error for a **preview deployment URL**:
```
https://fis-hn1wxhvs9-samilliniers-projects.vercel.app/signin
```

This is a **Vercel preview URL** that changes with each deployment.

## Quick Fix: Add This Preview URL

### Step 1: Add to Azure AD

1. **Go to Azure Portal:**
   - https://portal.azure.com
   - Sign in

2. **Navigate to App Registration:**
   - Search for "App registrations"
   - Find **"FIS POD"** (Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`)

3. **Add Preview URL:**
   - Click **"Authentication"** (left sidebar)
   - Under **"Single-page application"**, click **"Add URI"**
   - Add these URIs:

   **Preview URL 1:**
   ```
   https://fis-hn1wxhvs9-samilliniers-projects.vercel.app/signin
   ```

   **Preview URL 2:**
   ```
   https://fis-hn1wxhvs9-samilliniers-projects.vercel.app
   ```

4. **Click "Save"**

### Step 2: Verify Production URL is Added

Make sure these are also added:

**Production URL 1:**
```
https://fis-phi.vercel.app/signin
```

**Production URL 2:**
```
https://fis-phi.vercel.app
```

## ⚠️ Important Note

**Preview URLs change with each deployment!** Each time Vercel creates a new preview, you'll get a new URL like:
- `https://fis-[random-hash]-samilliniers-projects.vercel.app`

### Options:

**Option 1: Add Preview URLs Manually (Current)**
- Add each new preview URL to Azure AD as they appear
- Works but requires manual updates

**Option 2: Use Production URL for Auth (Recommended)**
- Configure the app to always use the production URL for authentication
- Preview deployments will redirect to production for sign-in
- More stable, but previews won't test auth flow

**Option 3: Use Local Development**
- Test auth locally with `http://localhost:3000`
- Only use production for final testing

## Recommended: Use Production URL

For now, the easiest solution is to:
1. ✅ Add the current preview URL (so it works now)
2. ✅ Use production URL (`https://fis-phi.vercel.app`) for testing auth
3. ✅ Preview deployments will work for everything except auth

---

**After adding the preview URL, wait 1-2 minutes and try again!** 🚀
