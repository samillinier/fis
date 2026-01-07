# QuickBooks Production Setup

## Production Credentials

**Client ID:** `ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS`  
**Client Secret:** `RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU`  
**Environment:** Production

## Environment Variables for Vercel

Add these to **Vercel Dashboard** → Your Project → Settings → Environment Variables:

```env
QUICKBOOKS_CLIENT_ID=ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS
QUICKBOOKS_CLIENT_SECRET=RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU
QUICKBOOKS_REDIRECT_URI=https://fis-phi.vercel.app/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=production
NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN=https://fis-phi.vercel.app
QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN=c54a23bf-9349-488d-b158-412e054d707a
```

**Important:**
- `QUICKBOOKS_ENVIRONMENT=production` (not sandbox)
- Select **ALL environments** (Production, Preview, Development)
- Save after adding

## Environment Variables for Local Development (.env.local)

Add these to your `.env.local` file:

```env
QUICKBOOKS_CLIENT_ID=ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS
QUICKBOOKS_CLIENT_SECRET=RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=production
NEXT_PUBLIC_QUICKBOOKS_PRODUCTION_DOMAIN=https://fis-phi.vercel.app
QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN=c54a23bf-9349-488d-b158-412e054d707a
```

## Intuit Dashboard Configuration

### 1. Production Redirect URIs

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select app: **FISPOD**
3. Go to **Settings** → **Redirect URIs**
4. Click **"Production"** tab (not Development)
5. Add this redirect URI:
   ```
   https://fis-phi.vercel.app/api/quickbooks/callback
   ```
6. For local testing, also add:
   ```
   http://localhost:3000/api/quickbooks/callback
   ```
7. Click **Save**

### 2. Production Keys & Credentials

1. Go to **Keys & Credentials**
2. Click **"Production"** tab
3. Verify:
   - ✅ Client ID: `ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS`
   - ✅ Client Secret: `RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU`

### 3. Verify App Name

1. Go to **Settings** → **Basic app info**
2. Make sure **App Name** is: `FISPOD`
3. Save if needed

## Production vs Sandbox

### Production Mode:
- ✅ Uses real QuickBooks companies
- ✅ API Endpoint: `https://quickbooks.api.intuit.com`
- ✅ Requires production credentials
- ✅ Uses production redirect URIs

### Sandbox Mode (Previous):
- ⚠️ Uses test/sandbox companies
- ⚠️ API Endpoint: `https://sandbox-quickbooks.api.intuit.com`
- ⚠️ Uses development credentials

## Code Changes Made

✅ Updated Client ID to production: `ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS`  
✅ Code will use production API when `QUICKBOOKS_ENVIRONMENT=production`

## Next Steps

1. **Update Vercel Environment Variables:**
   - Add `QUICKBOOKS_CLIENT_ID` = `ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS`
   - Add `QUICKBOOKS_CLIENT_SECRET` = `RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU`
   - Update `QUICKBOOKS_ENVIRONMENT` = `production`

2. **Update Intuit Dashboard:**
   - Add redirect URI to **Production** tab
   - Verify production credentials

3. **Update Local .env.local:**
   - Add production credentials
   - Set `QUICKBOOKS_ENVIRONMENT=production`

4. **Redeploy:**
   - After updating environment variables, redeploy

5. **Test:**
   - Connect to a real QuickBooks company (not sandbox)

## Important Notes

⚠️ **Production uses REAL QuickBooks companies** - be careful with test data  
⚠️ **Make sure redirect URI is in Production tab** (not just Development)  
⚠️ **Production credentials are different** from development credentials

## Current Configuration

- **Environment:** Production
- **Client ID:** `ABrb8WSjbtNgNncrOBdtTktvg3o4ODoKA5cyEwdadWO0O6rPGS`
- **Client Secret:** `RV6biSiVZ4mO0cFyGlDIV7fDSyH299YSV7b7FgAU`
- **API Endpoint:** `https://quickbooks.api.intuit.com`
- **Redirect URI:** `https://fis-phi.vercel.app/api/quickbooks/callback`

Ready for production! 🚀
