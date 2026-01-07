# ✅ Redirect URI Verified - Intuit Dashboard Issue

## Good News
The redirect URI in your code is **CORRECT**:
```
https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
```

The error is happening because **Intuit can't find this redirect URI** in their system.

## The Problem

The error URL shows Intuit is receiving the correct redirect URI, but it's not registered in your Intuit Dashboard configuration.

## The Fix

### Step 1: Verify Redirect URI in Intuit Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD**
3. Go to **Settings** → **Redirect URIs**
4. Check **BOTH** tabs:
   - **"</> Development"** tab
   - **"Production"** tab

5. In **BOTH** tabs, make sure this EXACT URI is listed:
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```

6. **Check for:**
   - ✅ No trailing slash
   - ✅ Exact case (all lowercase)
   - ✅ Includes `https://`
   - ✅ Includes `/api/quickbooks/callback`

### Step 2: If Not There, Add It

1. Click **"+ Add URI"** button
2. Paste: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`
3. Click **Save**
4. **Repeat for BOTH Development and Production tabs**

### Step 3: Verify App Name

1. Go to **Settings** → **Basic app info**
2. Make sure **App Name** is: `FISPOD`
3. If it's empty or different, set it to `FISPOD`
4. Click **Save**

### Step 4: Wait and Test

1. **Wait 10-15 minutes** after saving (Intuit needs time to propagate changes)
2. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. Go to: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
4. Click "Connect to QuickBooks" again

## Common Issues

### Issue 1: Redirect URI in Wrong Environment
- **Symptom:** URI is in Development but not Production (or vice versa)
- **Fix:** Add it to BOTH environments

### Issue 2: Typo or Extra Characters
- **Symptom:** URI almost matches but has a typo
- **Fix:** Copy-paste the exact URI from this document

### Issue 3: Changes Not Saved
- **Symptom:** Added URI but didn't click Save
- **Fix:** Make sure to click **Save** button after adding

### Issue 4: Changes Not Propagated
- **Symptom:** Added URI but still getting error
- **Fix:** Wait 10-15 minutes, then try again

## Verification Checklist

Before testing again:

- [ ] Redirect URI added to **Development** tab in Intuit Dashboard
- [ ] Redirect URI added to **Production** tab in Intuit Dashboard
- [ ] URI matches EXACTLY (no trailing slash, correct case)
- [ ] Clicked **Save** in both tabs
- [ ] App Name is set to `FISPOD`
- [ ] Waited 10-15 minutes after saving
- [ ] Cleared browser cache
- [ ] Testing on production domain (not preview URLs)

## Still Not Working?

If you've verified all of the above and it's still not working:

1. **Take a screenshot** of:
   - Intuit Dashboard → Settings → Redirect URIs → Development tab
   - Intuit Dashboard → Settings → Redirect URIs → Production tab
   - Intuit Dashboard → Settings → Basic app info (showing App Name)

2. **Check the exact error message** on the Intuit error page
   - What does it say specifically?
   - Is it "redirect_uri mismatch" or "undefined didn't connect"?

3. **Verify environment variable:**
   - In Vercel, check `NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN`
   - Should be: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app`
   - NOT: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`

The code adds `/api/quickbooks/callback` automatically, so the environment variable should only have the domain.
