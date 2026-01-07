# QuickBooks Exact Configuration

## Your Redirect URI

**Production:**
```
https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
```

**Local Development:**
```
http://localhost:3000/api/quickbooks/callback
```

## Step-by-Step Configuration

### 1. Intuit Developer Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD** (AppID: `694ad793-ff6f-442d-8fce-1ece6e00117b`)
3. Go to **Keys & OAuth** section
4. Under **Redirect URIs**, add these EXACTLY:

   **Production:**
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```

   **Development (for local testing):**
   ```
   http://localhost:3000/api/quickbooks/callback
   ```

5. **IMPORTANT:**
   - ✅ No trailing slash
   - ✅ Exact case (all lowercase in this case)
   - ✅ Include `https://` or `http://`
   - ✅ Click **Save**

### 2. Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add or update:

   **Key:** `QUICKBOOKS_REDIRECT_URI`
   
   **Value:** `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`
   
   **Environments:** ✅ Production ✅ Preview ✅ Development

5. Click **Save**

### 3. Verify App Name

1. In Intuit Dashboard, go to **App Overview** or **Settings**
2. Make sure **App Name** is set (not empty/undefined)
3. If empty, set it to: `FISPOD`

### 4. Redeploy

After making changes:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

### 5. Test

1. Go to: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
2. Click **Connect to QuickBooks**
3. It should work!

## Verification Checklist

Before testing, make sure:

- [ ] Redirect URI added in Intuit Dashboard (exact match, no trailing slash)
- [ ] `QUICKBOOKS_REDIRECT_URI` set in Vercel (all environments)
- [ ] App Name set in Intuit Dashboard
- [ ] App redeployed on Vercel
- [ ] Waited 5-10 minutes after Intuit Dashboard changes

## Current Configuration Summary

- **Vercel Domain:** `fis-bcbs9n06m-samilliniers-projects.vercel.app`
- **Redirect URI:** `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`
- **Client ID:** `694ad793-ff6f-442d-8fce-1ece6e00117b`
- **Webhook Verifier Token:** `c54a23bf-9349-488d-b158-412e054d707a` (already configured)
