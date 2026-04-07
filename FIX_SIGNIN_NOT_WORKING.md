# 🔧 Fix: Sign-In Button Not Working

## Issue: Clicking "Sign in with Microsoft" does nothing

## 🔍 Most Likely Causes:

### 1. ⚠️ Azure Redirect URIs Not Configured (90% of cases!)

**Microsoft won't allow sign-in if your Vercel URL isn't registered in Azure.**

**Fix:**
1. Go to: https://portal.azure.com
2. Azure Active Directory → **App registrations** → **"FIS POD"**
3. Click **"Authentication"** (left menu)
4. Scroll to **"Single-page application"** section
5. Click **"Add URI"** and add:
   - `https://pod.floorinteriorservices.com/signin`
   - `https://pod.floorinteriorservices.com`
6. Click **"Save"** at the top
7. **Wait 5-10 minutes** for Azure to update

### 2. ⚠️ Environment Variables Missing in Vercel

**Check Vercel environment variables:**
1. Go to: https://vercel.com/dashboard
2. Your Project → Settings → Environment Variables
3. Must have:
   - `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
   - `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`
4. After adding, **redeploy** the project

### 3. ⚠️ Browser Popup Blocked

**Microsoft sign-in uses a popup window. Your browser might be blocking it.**

**Fix:**
- Check browser address bar for popup blocked notification
- Click to allow popups for `pod.floorinteriorservices.com`
- Try in Incognito/Private window
- Disable popup blocker temporarily

### 4. ⚠️ Check Browser Console for Errors

**Do this first to see what's wrong:**

1. Open: https://pod.floorinteriorservices.com/signin
2. Press **F12** (or Cmd+Option+I on Mac)
3. Click **Console** tab
4. Click the "Sign in with Microsoft" button
5. Look for red error messages

**Common errors:**
- `AADSTS500113: No reply address is registered` → **Redirect URI not added to Azure** (Fix #1)
- `NEXT_PUBLIC_MSAL_CLIENT_ID is not defined` → **Environment variable missing** (Fix #2)
- `Popup blocked` → **Browser blocking popup** (Fix #3)
- `Failed to initialize MSAL` → Check environment variables

## ✅ Quick Fix Checklist:

1. [ ] Check browser console (F12) for errors
2. [ ] Add redirect URIs to Azure Portal (see Fix #1)
3. [ ] Verify environment variables in Vercel
4. [ ] Check if popup is blocked
5. [ ] Wait 5-10 minutes after Azure changes
6. [ ] Try again

## 🆘 Share the Error:

**Please check the browser console (F12) and share any red error messages you see!**

This will help me identify the exact issue.

