# Immediate Fix for "undefined didn't connect" Error

## Quick Fix Steps (Do These Now)

### 1. Check Your Vercel Domain
Find your actual Vercel domain. It should look like:
- `https://fis-xxxxx.vercel.app` or
- `https://your-custom-domain.com`

### 2. Add Redirect URI to Intuit Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Click on your app: **FISPOD**
3. Go to **Keys & OAuth** section
4. Under **Redirect URIs**, add this EXACTLY (replace with your actual domain):

   ```
   https://your-actual-vercel-domain.vercel.app/api/quickbooks/callback
   ```

   **For local testing, also add:**
   ```
   http://localhost:3000/api/quickbooks/callback
   ```

5. **IMPORTANT**: 
   - ✅ No trailing slash
   - ✅ Exact case
   - ✅ Include `https://` or `http://`
   - ✅ Click **Save**

### 3. Set App Name in Intuit Dashboard

1. In Intuit Dashboard, go to **App Overview** or **Settings**
2. Make sure **App Name** is set (not empty)
3. If empty, set it to: `FISPOD` or `Finance Integration System`
4. Save

### 4. Add Environment Variable to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key**: `QUICKBOOKS_REDIRECT_URI`
   - **Value**: `https://your-actual-vercel-domain.vercel.app/api/quickbooks/callback`
   - **Environments**: All (Production, Preview, Development)
3. Save

### 5. Redeploy

After making changes:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

### 6. Test Again

1. Go to your app: `/finance-hub`
2. Click "Connect to QuickBooks"
3. It should work now!

## What Was Wrong?

The error "undefined didn't connect" happens when:
- The redirect URI in your code doesn't match what's registered in Intuit Dashboard
- The app name is not set in Intuit Dashboard
- The redirect URI has a trailing slash or wrong format

## Still Not Working?

1. **Check browser console** (F12 → Console tab)
   - Look for the logged "Redirect URI" value
   - Make sure it matches what's in Intuit Dashboard EXACTLY

2. **Verify in Intuit Dashboard**
   - Go to Keys & OAuth
   - Check the Redirect URIs list
   - Make sure your URL is there and matches exactly

3. **Check Vercel Environment Variables**
   - Make sure `QUICKBOOKS_REDIRECT_URI` is set
   - Make sure it's available for all environments

4. **Wait a few minutes**
   - Changes in Intuit Dashboard can take 5-10 minutes to propagate

## Need Your Actual Domain?

If you're not sure what your Vercel domain is:
1. Go to Vercel Dashboard
2. Click on your project
3. Look at the top - it shows your domain
4. Or go to Settings → Domains

Then use that domain in the steps above.
