# QuickBooks Setup with New Domain: pod.floorinteriorservices.com

## Your New Domain
`https://pod.floorinteriorservices.com`

## Redirect URI (Full Path)
```
https://pod.floorinteriorservices.com/api/quickbooks/callback
```

## Step-by-Step Setup

### Step 1: Add Redirect URI to Intuit Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD**
3. Go to **Settings** → **Redirect URIs** → **Development** tab
4. Add this EXACT redirect URI:
   ```
   https://pod.floorinteriorservices.com/api/quickbooks/callback
   ```
5. **Important:**
   - ✅ No trailing slash
   - ✅ Exact case (all lowercase)
   - ✅ Includes `https://`
   - ✅ Includes `/api/quickbooks/callback` (full path)
6. Click **Save**
7. Wait 10-15 minutes for changes to propagate

### Step 2: Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add or update:
   - **Key**: `NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN`
   - **Value**: `https://pod.floorinteriorservices.com`
   - **Note**: Don't include `/api/quickbooks/callback` - the code adds that automatically
   - **Environments**: ✅ Production
3. Click **Save**

### Step 3: Redeploy

After updating the environment variable:
1. Go to Vercel Dashboard → Deployments
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

### Step 4: Test

1. Go to: `https://pod.floorinteriorservices.com/finance-hub`
2. Click "Connect to QuickBooks"
3. It should work!

## Important Notes

### Redirect URI Must Be Full Path
- ✅ **Correct**: `https://pod.floorinteriorservices.com/api/quickbooks/callback`
- ❌ **Wrong**: `https://pod.floorinteriorservices.com/`
- ❌ **Wrong**: `https://pod.floorinteriorservices.com`

The `/api/quickbooks/callback` path is required because that's where your callback handler is located.

### Domain Consistency

Make sure:
- ✅ Redirect URI in Intuit Dashboard matches exactly
- ✅ Environment variable in Vercel uses the same domain
- ✅ You're testing on the same domain (`pod.floorinteriorservices.com`)

## Verification Checklist

Before testing:

- [ ] Redirect URI added to Intuit Dashboard → Settings → Redirect URIs → Development
- [ ] Redirect URI is: `https://pod.floorinteriorservices.com/api/quickbooks/callback` (full path)
- [ ] `NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN` set to `https://pod.floorinteriorservices.com` in Vercel
- [ ] App redeployed after environment variable change
- [ ] Waited 10-15 minutes after Intuit Dashboard changes
- [ ] Testing on: `https://pod.floorinteriorservices.com/finance-hub`

## If You Have Multiple Domains

If you have both:
- `pod.floorinteriorservices.com` (new)
- `pod.floorinteriorservices.com` (old)

You can add BOTH redirect URIs to Intuit Dashboard:
1. `https://pod.floorinteriorservices.com/api/quickbooks/callback`
2. `https://pod.floorinteriorservices.com/api/quickbooks/callback`

This way, either domain will work.

## Code Updated

I've updated the code to use `https://pod.floorinteriorservices.com` as the default domain. After you:
1. Add the redirect URI to Intuit Dashboard
2. Update the environment variable in Vercel
3. Redeploy

It should work! 🚀
