# Add Lowe's Login Redirect URI to Azure

## Option 1: Use Existing Redirect URI (Recommended - Already Done in Code)

The code has been updated to use the same redirect URI as the main app (`/signin`), which should already be registered in Azure. This means **no Azure changes are needed** - it should work immediately!

The redirect will go to `/signin`, but after successful authentication, the Lowe's login page will detect the Microsoft account and redirect to the Lowe's dashboard.

## Option 2: Add Separate Redirect URI (If Option 1 Doesn't Work)

If you need a separate redirect URI for Lowe's login:

### Steps:

1. **Go to Azure Portal:**
   - Visit: https://portal.azure.com
   - Sign in with your Microsoft account

2. **Navigate to App Registration:**
   - Click **"Azure Active Directory"** (left menu)
   - Click **"App registrations"**
   - Find and click: **"FIS POD"** (or search for Client ID from your environment variables)

3. **Add Redirect URI:**
   - Click **"Authentication"** in the left menu
   - Scroll to **"Single-page application"** section
   - Under **"Redirect URIs"**, click **"Add URI"**
   - Add your Lowe's login redirect URI:
     ```
     http://localhost:3000/lowes/login        (for local development)
     https://your-domain.com/lowes/login     (for production)
     ```
   - Click **"Save"** at the top

4. **Wait 5-10 minutes** for Azure to update

5. **Try logging in again**

## Current Setup (After Code Update)

The Lowe's login page now uses the same redirect URI as the main app:
- **Redirect URI**: `/signin` (already registered)
- **After login**: Automatically redirects to `/lowes/dashboard`

This should work without any Azure configuration changes!

## Troubleshooting

If you still get redirect URI errors:

1. **Check your environment variables:**
   - `NEXT_PUBLIC_MSAL_CLIENT_ID` - Must match Azure App Registration
   - `NEXT_PUBLIC_MSAL_TENANT_ID` - Should be set

2. **Verify redirect URIs in Azure:**
   - Make sure `/signin` is listed under "Single-page application" redirect URIs
   - Should see: `http://localhost:3000/signin` and your production URL

3. **Clear browser cache** and try again

4. **Check browser console** (F12) for detailed error messages
