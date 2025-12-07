# 🔍 Sign-In Diagnostic Checklist

## Issue: Sign-in button does nothing when clicked

### Step 1: Check Browser Console ⚠️ DO THIS FIRST

1. Go to: https://fis-he6w.vercel.app/signin
2. Press **F12** (or Cmd+Option+I on Mac)
3. Click **Console** tab
4. Click "Sign in with Microsoft" button
5. **Look for red errors** and share them!

### Step 2: Common Errors & Fixes

#### Error: `AADSTS500113: No reply address is registered`
**Fix:** Add redirect URIs to Azure Portal (see below)

#### Error: `NEXT_PUBLIC_MSAL_CLIENT_ID is not defined`
**Fix:** Add environment variable in Vercel (see below)

#### Error: `Popup blocked`
**Fix:** Allow popups for `fis-he6w.vercel.app` in browser settings

#### No error, but nothing happens
**Fix:** Check Azure redirect URIs (see below)

### Step 3: Verify Azure Redirect URIs

1. Go to: https://portal.azure.com
2. Azure AD → App registrations → "FIS POD"
3. Authentication → Single-page application
4. Make sure these URIs are listed:
   - `https://fis-he6w.vercel.app/signin`
   - `https://fis-he6w.vercel.app`
5. If missing, add them and click **Save**
6. Wait 5-10 minutes

### Step 4: Verify Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Your Project → Settings → Environment Variables
3. Must have:
   - `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
   - `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`
4. If missing, add them and **redeploy**

### Step 5: Check Popup Blocker

- Look for popup blocked notification in browser
- Allow popups for `fis-he6w.vercel.app`
- Try in Incognito/Private window

---

**Please check Step 1 first and share any console errors!**

