# Using QuickBooks Sandbox Company for Testing

## Your Sandbox Company ID
**Company ID (realmId):** `9341455998950460`

## How Sandbox Companies Work

When you connect to QuickBooks in **Development/Sandbox** mode:
1. You authorize the app
2. QuickBooks redirects back with a `realmId` (company ID)
3. Your app uses this `realmId` to make API calls to that specific company

## Current Setup

Your code is already configured for sandbox:
- ✅ `QUICKBOOKS_ENVIRONMENT=sandbox` (in Vercel)
- ✅ Uses sandbox API: `https://sandbox-quickbooks.api.intuit.com`
- ✅ Will work with any sandbox company, including yours

## How to Connect to Your Sandbox Company

### Step 1: Make Sure You're Using Sandbox

1. **In Vercel Dashboard** → Settings → Environment Variables:
   - `QUICKBOOKS_ENVIRONMENT` should be: `sandbox`

2. **In Intuit Dashboard:**
   - Make sure you're testing in **Development** environment (not Production)
   - Redirect URI should be in **Development** tab

### Step 2: Connect to QuickBooks

1. Go to: `https://pod.floorinteriorservices.com/finance-hub`
2. Click "Connect to QuickBooks"
3. **Sign in with your Intuit Developer account** (the one that has access to the sandbox company)
4. **Select the sandbox company** with ID `9341455998950460`
5. Authorize the connection

### Step 3: Verify Connection

After connecting:
- The `realmId` (`9341455998950460`) will be stored in your database
- Your app will use this `realmId` for all API calls to that company
- You can see the company name in the Finance Hub

## Using a Specific Sandbox Company

The sandbox company ID (`9341455998950460`) will be automatically captured when you:
1. Connect through OAuth
2. Select that company during authorization
3. The `realmId` parameter in the callback will be `9341455998950460`

## Testing with Sandbox

**Benefits of using sandbox:**
- ✅ Safe testing (no real data)
- ✅ Can test without affecting production
- ✅ Free to use
- ✅ Can reset/recreate test data

**Your sandbox company:**
- Company ID: `9341455998950460`
- Accessible through your Intuit Developer account
- Use for all development/testing

## Important Notes

1. **Sandbox vs Production:**
   - Sandbox: `QUICKBOOKS_ENVIRONMENT=sandbox` → Uses `sandbox-quickbooks.api.intuit.com`
   - Production: `QUICKBOOKS_ENVIRONMENT=production` → Uses `quickbooks.api.intuit.com`

2. **Company Selection:**
   - When you click "Connect to QuickBooks", you'll see a list of companies
   - Select the one with ID `9341455998950460` (or any sandbox company)
   - The `realmId` will be automatically saved

3. **Multiple Companies:**
   - Each user can connect to different companies
   - The `realmId` is stored per user in the database
   - Your app will use the correct company for each user

## Current Configuration

- ✅ Environment: Sandbox (Development)
- ✅ API Endpoint: `https://sandbox-quickbooks.api.intuit.com`
- ✅ Your Sandbox Company ID: `9341455998950460`
- ✅ Ready to connect!

## Next Steps

1. **Fix the "undefined didn't connect" error first:**
   - Make sure App Name is set in Intuit Dashboard
   - Make sure redirect URI is registered
   - Then try connecting

2. **When connecting:**
   - Select your sandbox company (`9341455998950460`)
   - Authorize the connection
   - The company ID will be automatically saved

The code is already set up to work with sandbox companies - you just need to get past the OAuth connection error first!
