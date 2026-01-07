# 🚨 CRITICAL FIX: "undefined didn't connect" Error

## The Root Cause

The error "undefined didn't connect" means **Intuit can't identify your app** because:
1. **App Name is NOT set** in Intuit Dashboard (most common)
2. OR redirect URI doesn't match exactly

## IMMEDIATE ACTION REQUIRED

### Step 1: Set App Name in Intuit Dashboard (CRITICAL!)

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Click on your app: **FISPOD** (AppID: `694ad793-ff6f-442d-8fce-1ece6e00117b`)
3. Look for **App Overview** or **Settings** section
4. Find **App Name** field
5. **Is it empty or showing "undefined"?**
   - If YES → **THIS IS THE PROBLEM!**
6. **Set App Name:**
   - Click **Edit** or find the App Name field
   - Enter: `FISPOD`
   - **Save**

**This is the #1 cause of "undefined didn't connect" error!**

### Step 2: Verify Redirect URI in Intuit Dashboard

1. In Intuit Dashboard, go to **Keys & OAuth**
2. Under **Redirect URIs**, you should see:
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```
3. **Check:**
   - ✅ No trailing slash
   - ✅ Exact case (all lowercase)
   - ✅ Includes `https://`
   - ✅ Includes `/api/quickbooks/callback`

4. **If it's NOT there or different:**
   - Add it exactly as shown above
   - Click **Save**
   - Wait 5-10 minutes

### Step 3: Check Browser Console

1. Open your app: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
2. Press **F12** → **Console** tab
3. Click "Connect to QuickBooks"
4. Look for logs that show:
   - Client ID
   - Redirect URI
   - OAuth URL

5. **Copy the Redirect URI value** and verify it matches:
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```

### Step 4: Verify Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check if `NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN` is set
3. Value should be: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app`
4. If not set, add it:
   - Key: `NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN`
   - Value: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app`
   - Environments: ✅ Production
   - Save
   - Redeploy

## Most Likely Issue

**90% of the time, the problem is:**
- ❌ App Name is empty/undefined in Intuit Dashboard

**To fix:**
1. Go to Intuit Dashboard
2. Find App Overview or Settings
3. Set App Name to: `FISPOD`
4. Save
5. Wait 5-10 minutes
6. Try again

## Verification Checklist

Before trying again, confirm:

- [ ] **App Name is set** in Intuit Dashboard (NOT empty/undefined) ← MOST IMPORTANT
- [ ] Redirect URI is in Intuit Dashboard (exact match)
- [ ] Redirect URI has no trailing slash
- [ ] `NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN` is set in Vercel
- [ ] App has been redeployed after environment variable changes
- [ ] Waited 5-10 minutes after Intuit Dashboard changes

## Still Not Working?

If you've set the App Name and it's still not working:

1. **Take a screenshot** of:
   - Intuit Dashboard → App Overview (showing App Name)
   - Intuit Dashboard → Keys & OAuth → Redirect URIs
   - Browser console logs (the OAuth Configuration output)

2. **Check the exact error:**
   - Is it still "undefined didn't connect"?
   - Or a different error message?

3. **Verify you're testing on the correct domain:**
   - Use: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
   - NOT preview URLs

## Quick Test

After setting App Name:
1. Wait 5-10 minutes
2. Clear browser cache (Ctrl+Shift+Delete)
3. Go to: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
4. Click "Connect to QuickBooks"
5. Check if error changed or if it works
