# QuickBooks "undefined didn't connect" - Diagnostic Steps

## The Error
"Sorry, but undefined didn't connect" - This means Intuit can't identify your app.

## Most Common Cause: App Name Not Set

The #1 cause is that **App Name is empty/undefined** in Intuit Developer Dashboard.

## Step-by-Step Diagnostic

### Step 1: Check Browser Console

1. Open your app: `https://pod.floorinteriorservices.com/finance-hub`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Click "Connect to QuickBooks"
5. Look for the log output that shows:
   - Client ID
   - Redirect URI
   - Full OAuth URL

**Copy and share these values** - they'll help identify the issue.

### Step 2: Verify Intuit Dashboard - App Name

**CRITICAL:** This is usually the problem!

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Click on your app: **FISPOD**
3. Look for **App Overview** or **Settings** section
4. Find **App Name** field
5. **Is it empty or showing "undefined"?**
   - ✅ If it has a name (like "FISPOD"), that's good
   - ❌ If it's empty/undefined, **THIS IS THE PROBLEM**

**To Fix App Name:**
1. Click **Edit** or **Settings**
2. Set **App Name** to: `FISPOD` or `Finance Integration System`
3. **Save**

### Step 3: Verify Redirect URI in Intuit Dashboard

1. In Intuit Dashboard, go to **Keys & OAuth**
2. Scroll to **Redirect URIs** section
3. Check if this EXACT URI is listed:
   ```
   https://pod.floorinteriorservices.com/api/quickbooks/callback
   ```

**Check for:**
- ✅ Exact match (no trailing slash)
- ✅ Correct case (all lowercase)
- ✅ Includes `https://`
- ✅ Includes `/api/quickbooks/callback` path

**If it's not there or doesn't match exactly:**
1. Add it (or update it)
2. Click **Save**
3. Wait 5-10 minutes for changes to propagate

### Step 4: Check Environment (Development vs Production)

1. In Intuit Dashboard, look at the top
2. Do you see tabs: **Development** and **Production**?
3. **Which one are you using?**

**Important:**
- If your app is in **Development** mode, make sure you're testing with a sandbox QuickBooks company
- If your app is in **Production** mode, make sure you're testing with a real QuickBooks company
- The redirect URI must be added to the **correct environment** tab

### Step 5: Verify Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check if `QUICKBOOKS_REDIRECT_URI` is set
3. Value should be: `https://pod.floorinteriorservices.com/api/quickbooks/callback`
4. Make sure it's enabled for **all environments**

### Step 6: Test the OAuth URL Directly

1. Open browser console (F12)
2. After clicking "Connect to QuickBooks", look for the logged OAuth URL
3. Copy the full URL (it will look like):
   ```
   https://appcenter.intuit.com/connect/oauth2?client_id=694ad793-ff6f-442d-8fce-1ece6e00117b&scope=com.intuit.quickbooks.accounting&redirect_uri=https://pod.floorinteriorservices.com/api/quickbooks/callback&response_type=code&state=***&access_type=offline
   ```
4. Manually visit this URL in a new tab
5. Does it show the same error, or does it work?

## Common Issues & Fixes

### Issue 1: App Name is Empty
**Symptom:** Error says "undefined didn't connect"
**Fix:** Set App Name in Intuit Dashboard → App Overview/Settings

### Issue 2: Redirect URI Mismatch
**Symptom:** Error about redirect URI
**Fix:** Make sure redirect URI in code matches Intuit Dashboard exactly

### Issue 3: Wrong Environment
**Symptom:** Works in one environment but not another
**Fix:** Make sure redirect URI is added to the correct environment tab (Development/Production)

### Issue 4: Changes Not Propagated
**Symptom:** Made changes but still getting error
**Fix:** Wait 5-10 minutes after saving changes in Intuit Dashboard

## What to Share for Help

If still not working, share:
1. Screenshot of Intuit Dashboard → App Overview (showing App Name)
2. Screenshot of Intuit Dashboard → Keys & OAuth → Redirect URIs
3. Browser console logs (the OAuth Configuration output)
4. Which environment you're testing (Development/Production)

## Quick Checklist

Before trying again, verify:

- [ ] App Name is set in Intuit Dashboard (not empty/undefined)
- [ ] Redirect URI is in Intuit Dashboard (exact match, no trailing slash)
- [ ] Redirect URI is in the correct environment tab (Development/Production)
- [ ] `QUICKBOOKS_REDIRECT_URI` is set in Vercel
- [ ] App has been redeployed after changes
- [ ] Waited 5-10 minutes after Intuit Dashboard changes
- [ ] Testing in the correct environment (sandbox vs production)
