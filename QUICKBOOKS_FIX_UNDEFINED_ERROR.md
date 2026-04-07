# Fix "undefined didn't connect" Error

This error occurs when QuickBooks can't identify your app. Here's how to fix it:

## Root Causes

1. **Redirect URI mismatch** - The redirect URI in your code doesn't match what's in Intuit Dashboard
2. **App name not set** - The app name in Intuit Dashboard is empty/undefined
3. **Environment mismatch** - Using production URL in development or vice versa

## Step-by-Step Fix

### Step 1: Verify Your Current Domain

First, check what domain you're using:
- **Local**: `http://localhost:3000`
- **Vercel Production**: `https://pod.floorinteriorservices.com`
- **Vercel Preview**: `https://your-app-git-branch.vercel.app`

### Step 2: Configure Intuit Developer Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Find your app: **FISPOD** (AppID: `694ad793-ff6f-442d-8fce-1ece6e00117b`)
3. Click **App Overview** (if available) or **Settings**
4. **CRITICAL**: Make sure **App Name** is set (not empty/undefined)
   - If it's empty, set it to something like "FISPOD" or "Finance Integration System"

### Step 3: Configure Redirect URIs (Keys & OAuth)

1. In Intuit Dashboard, go to **Keys & OAuth**
2. Under **Redirect URIs**, add **EXACTLY** these URIs (case-sensitive, no trailing slashes):

   **For Development:**
   ```
   http://localhost:3000/api/quickbooks/callback
   ```

   **For Production (replace with your actual Vercel domain):**
   ```
   https://pod.floorinteriorservices.com/api/quickbooks/callback
   ```

   **Important:**
   - ✅ No trailing slashes
   - ✅ Exact case matching
   - ✅ Include `http://` or `https://`
   - ✅ Include `/api/quickbooks/callback` path

### Step 4: Set Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add or update:
   - **Key**: `QUICKBOOKS_REDIRECT_URI`
   - **Value**: `https://pod.floorinteriorservices.com/api/quickbooks/callback`
   - **Environments**: Select all (Production, Preview, Development)
3. Click **Save**

### Step 5: Update Code to Use Environment Variable

The code should use the environment variable instead of constructing the redirect URI dynamically. This ensures consistency.

### Step 6: Redeploy

After making changes:
1. Redeploy your app on Vercel
2. Wait for deployment to complete
3. Try connecting again

## Verification Checklist

Before trying to connect again, verify:

- [ ] App Name is set in Intuit Dashboard (not empty)
- [ ] Redirect URI is added in Intuit Dashboard (exact match)
- [ ] `QUICKBOOKS_REDIRECT_URI` is set in Vercel environment variables
- [ ] Redirect URI matches exactly (no trailing slash, correct protocol)
- [ ] You're testing in the correct environment (Development vs Production)
- [ ] App has been redeployed after changes

## Common Mistakes

❌ **Wrong**: `https://pod.floorinteriorservices.com/api/quickbooks/callback/` (trailing slash)
✅ **Correct**: `https://pod.floorinteriorservices.com/api/quickbooks/callback`

❌ **Wrong**: `pod.floorinteriorservices.com/api/quickbooks/callback` (missing protocol)
✅ **Correct**: `https://pod.floorinteriorservices.com/api/quickbooks/callback`

❌ **Wrong**: Using localhost URL in production
✅ **Correct**: Use production URL in production environment

## Still Not Working?

1. **Check browser console** - Look for the OAuth URL being generated
2. **Check network tab** - See what redirect_uri is being sent
3. **Verify in Intuit Dashboard** - Double-check the redirect URI is saved
4. **Wait 5-10 minutes** - Changes can take time to propagate

## Need Help?

If still having issues, provide:
- Your actual Vercel domain
- Screenshot of Intuit Dashboard → Keys & OAuth → Redirect URIs
- Browser console logs when clicking "Connect to QuickBooks"
