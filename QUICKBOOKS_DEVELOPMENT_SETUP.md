# QuickBooks Development Setup (Sandbox)

## Goal
Get QuickBooks working in **Development/Sandbox** environment first, then move to Production later.

## Step 1: Verify Environment Variable

In **Vercel Dashboard** → **Settings** → **Environment Variables**:

Make sure you have:
- **Key**: `QUICKBOOKS_ENVIRONMENT`
- **Value**: `sandbox` (NOT `production`)
- **Environments**: ✅ All (Production, Preview, Development)

This tells the app to use Development/Sandbox mode.

## Step 2: Configure Intuit Dashboard - Development Only

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD**
3. Go to **Settings** → **Redirect URIs**
4. **IMPORTANT:** Make sure you're on the **"</> Development"** tab (not Production)
5. Add this redirect URI:
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```
6. Click **Save**

**Note:** You can ignore the Production tab for now. We'll configure it later.

## Step 3: Verify App Name

1. In Intuit Dashboard → **Settings** → **Basic app info**
2. Make sure **App Name** is: `FISPOD`
3. Save if needed

## Step 4: Test in Development

1. Wait 5-10 minutes after saving in Intuit Dashboard
2. Go to: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
3. Click "Connect to QuickBooks"
4. You should be redirected to Intuit's **Sandbox/Development** login

## Step 5: Use Sandbox QuickBooks Company

When connecting:
- You'll need to sign in with a **Sandbox QuickBooks account**
- If you don't have one, create it at: https://developer.intuit.com/app/developer/sandbox
- Or use the test company provided by Intuit

## Development vs Production

### Development (Sandbox):
- ✅ Safe for testing
- ✅ Use test/sandbox QuickBooks companies
- ✅ `QUICKBOOKS_ENVIRONMENT=sandbox`
- ✅ Redirect URI in Development tab

### Production (Live):
- ⚠️ Uses real QuickBooks companies
- ⚠️ Only use when ready
- ⚠️ `QUICKBOOKS_ENVIRONMENT=production`
- ⚠️ Redirect URI in Production tab

## Current Configuration Checklist

For Development to work:

- [ ] `QUICKBOOKS_ENVIRONMENT=sandbox` in Vercel
- [ ] Redirect URI added to **Development** tab in Intuit Dashboard
- [ ] App Name set to `FISPOD` in Intuit Dashboard
- [ ] Waited 5-10 minutes after Intuit Dashboard changes
- [ ] Testing on production domain (not preview URLs)

## Troubleshooting

### "redirect_uri not registered"
- Make sure redirect URI is in **Development** tab (not Production)
- Verify exact match (no trailing slash, correct case)
- Wait 5-10 minutes after adding

### "undefined didn't connect"
- Make sure App Name is set in Intuit Dashboard
- Verify you're testing in Development environment

### Wrong QuickBooks login page
- Check `QUICKBOOKS_ENVIRONMENT` is set to `sandbox`
- Should see "Sandbox" or "Development" branding in Intuit login

## When Ready for Production

Once Development is working:

1. Add redirect URI to **Production** tab in Intuit Dashboard
2. Change `QUICKBOOKS_ENVIRONMENT` to `production` in Vercel
3. Test with a real QuickBooks company
4. Redeploy app

But for now, let's get Development working first! 🚀
