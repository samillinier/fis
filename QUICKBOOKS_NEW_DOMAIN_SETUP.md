# QuickBooks Setup with New Domain: fis-phi.vercel.app

## Your New Domain
`https://fis-phi.vercel.app`

## Redirect URI (Full Path)
```
https://fis-phi.vercel.app/api/quickbooks/callback
```

## Step-by-Step Setup

### Step 1: Add Redirect URI to Intuit Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD**
3. Go to **Settings** → **Redirect URIs** → **Development** tab
4. Add this EXACT redirect URI:
   ```
   https://fis-phi.vercel.app/api/quickbooks/callback
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
   - **Value**: `https://fis-phi.vercel.app`
   - **Note**: Don't include `/api/quickbooks/callback` - the code adds that automatically
   - **Environments**: ✅ Production
3. Click **Save**

### Step 3: Redeploy

After updating the environment variable:
1. Go to Vercel Dashboard → Deployments
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

### Step 4: Test

1. Go to: `https://fis-phi.vercel.app/finance-hub`
2. Click "Connect to QuickBooks"
3. It should work!

## Important Notes

### Redirect URI Must Be Full Path
- ✅ **Correct**: `https://fis-phi.vercel.app/api/quickbooks/callback`
- ❌ **Wrong**: `https://fis-phi.vercel.app/`
- ❌ **Wrong**: `https://fis-phi.vercel.app`

The `/api/quickbooks/callback` path is required because that's where your callback handler is located.

### Domain Consistency

Make sure:
- ✅ Redirect URI in Intuit Dashboard matches exactly
- ✅ Environment variable in Vercel uses the same domain
- ✅ You're testing on the same domain (`fis-phi.vercel.app`)

## Verification Checklist

Before testing:

- [ ] Redirect URI added to Intuit Dashboard → Settings → Redirect URIs → Development
- [ ] Redirect URI is: `https://fis-phi.vercel.app/api/quickbooks/callback` (full path)
- [ ] `NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN` set to `https://fis-phi.vercel.app` in Vercel
- [ ] App redeployed after environment variable change
- [ ] Waited 10-15 minutes after Intuit Dashboard changes
- [ ] Testing on: `https://fis-phi.vercel.app/finance-hub`

## If You Have Multiple Domains

If you have both:
- `fis-phi.vercel.app` (new)
- `fis-bcbs9n06m-samilliniers-projects.vercel.app` (old)

You can add BOTH redirect URIs to Intuit Dashboard:
1. `https://fis-phi.vercel.app/api/quickbooks/callback`
2. `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`

This way, either domain will work.

## Code Updated

I've updated the code to use `https://fis-phi.vercel.app` as the default domain. After you:
1. Add the redirect URI to Intuit Dashboard
2. Update the environment variable in Vercel
3. Redeploy

It should work! 🚀
