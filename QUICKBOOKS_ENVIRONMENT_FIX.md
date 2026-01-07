# 🚨 CRITICAL: Environment Mismatch Fix

## The Problem

You're getting "undefined didn't connect" because:
- Your redirect URI is configured in **Development** environment in Intuit Dashboard
- But you might be testing in **Production**, or vice versa
- The redirect URI needs to be in **BOTH** environments

## The Fix

### Step 1: Add Redirect URI to BOTH Environments

In Intuit Dashboard:

1. Go to **Settings** → **Redirect URIs**
2. Click **"</> Development"** tab
3. Make sure this URI is there:
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```
4. **IMPORTANT:** Click **"Production"** tab (next to Development)
5. Add the **SAME** redirect URI to Production:
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```
6. Click **Save** in BOTH tabs

### Step 2: Verify App Name in BOTH Environments

1. Go to **Settings** → **Basic app info**
2. Make sure **App Name** is set to: `FISPOD`
3. Save

### Step 3: Check Which Environment You're Using

In Intuit Dashboard, look at the top:
- **Development** = Sandbox/Testing
- **Production** = Live/Real QuickBooks

**For testing, use Development (Sandbox) environment:**
- Make sure `QUICKBOOKS_ENVIRONMENT=sandbox` in Vercel
- Make sure redirect URI is in Development tab in Intuit Dashboard

### Step 4: Redeploy and Test

1. After adding redirect URI to BOTH environments, wait 5-10 minutes
2. Redeploy your app on Vercel
3. Test on: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`

## Quick Checklist

- [ ] Redirect URI added to **Development** tab in Intuit Dashboard
- [ ] Redirect URI added to **Production** tab in Intuit Dashboard (same URI)
- [ ] App Name is set to `FISPOD` in Intuit Dashboard
- [ ] `QUICKBOOKS_ENVIRONMENT=sandbox` in Vercel (for testing)
- [ ] Waited 5-10 minutes after Intuit Dashboard changes
- [ ] Redeployed app on Vercel
- [ ] Testing on production domain (not preview URLs)

## Why This Happens

Intuit requires the redirect URI to be configured in the **same environment** you're using:
- If your app is in **Development** mode → redirect URI must be in Development tab
- If your app is in **Production** mode → redirect URI must be in Production tab
- **Best practice:** Add it to BOTH so it works in either environment

## Still Not Working?

1. **Check browser console** (F12) when clicking "Connect to QuickBooks"
2. Look for the logged "Redirect URI" value
3. Verify it matches EXACTLY what's in Intuit Dashboard
4. Make sure you're checking the correct environment tab (Development vs Production)
