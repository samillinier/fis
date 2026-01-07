# QuickBooks App Activation Issue

## The Problem

Your redirect URI is **correct** (`https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`), but Intuit is still rejecting it with "undefined didn't connect".

This usually means the **app itself isn't properly activated** or there's a configuration issue.

## Possible Causes

### 1. App Not Published/Activated

Intuit apps need to be in a specific state to work:

1. Go to Intuit Dashboard → **App Overview**
2. Check the **app status**:
   - ✅ **"In Development"** or **"Active"** = Good
   - ❌ **"Pending"** or **"Inactive"** = Problem

3. If it's pending/inactive:
   - You may need to complete app setup
   - Check if there are any required fields missing
   - Look for a "Publish" or "Activate" button

### 2. Redirect URI Not Actually Registered

Even if you added it, it might not be saved:

1. Go to **Settings** → **Redirect URIs** → **Development** tab
2. **Verify the URI is actually listed** (not just in the input field)
3. If it's not there:
   - Delete any existing entries
   - Click "+ Add URI"
   - Type: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`
   - Click **Save**
   - Wait 10-15 minutes

### 3. App Keys Not Generated

1. Go to **Keys & OAuth** section
2. Check if **Client ID** and **Client Secret** are visible
3. If Client Secret is missing or says "Generate", you need to generate it first

### 4. Wrong App Type/Configuration

1. Check **App Overview** → **App Type**
2. Make sure it's configured as a **Web App** or **OAuth 2.0** app
3. Not a desktop or mobile app

## Step-by-Step Fix

### Step 1: Verify App Status

1. Intuit Dashboard → **App Overview**
2. Check status - what does it say?
3. If pending/inactive, complete any required setup steps

### Step 2: Verify Keys & OAuth

1. Go to **Keys & OAuth**
2. Verify:
   - ✅ Client ID: `694ad793-ff6f-442d-8fce-1ece6e00117b`
   - ✅ Client Secret is visible (not empty)
   - ✅ OAuth 2.0 is enabled

### Step 3: Re-add Redirect URI (Fresh Start)

1. **Settings** → **Redirect URIs** → **Development** tab
2. **Delete ALL existing redirect URIs** (if any)
3. Click **Save**
4. Wait 2 minutes
5. Click **"+ Add URI"**
6. **Type manually** (don't copy-paste):
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```
7. **Double-check:**
   - No trailing slash
   - All lowercase
   - Includes `https://`
   - Includes `/api/quickbooks/callback`
8. Click **Save**
9. **Wait 15 minutes** (Intuit needs time to propagate)

### Step 4: Verify App Name

1. **Settings** → **Basic app info**
2. **App Name** must be: `FISPOD` (not empty, not "undefined")
3. Save if needed

### Step 5: Test Again

1. Wait 15 minutes after saving
2. Clear browser cache
3. Go to: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
4. Click "Connect to QuickBooks"

## What to Check

Please verify and share:

1. **App Status:**
   - Intuit Dashboard → App Overview
   - What does it say? (Active, In Development, Pending, etc.)

2. **Keys & OAuth:**
   - Is Client Secret visible?
   - Is OAuth 2.0 enabled?

3. **Redirect URI:**
   - Settings → Redirect URIs → Development tab
   - Is the URI actually listed (not just in input field)?
   - Can you take a screenshot?

4. **App Type:**
   - What type of app is it? (Web App, Desktop, Mobile, etc.)

## Alternative: Contact Intuit Support

If none of this works, the issue might be:
- App needs approval from Intuit
- Account limitations
- Platform-specific issue

You can contact Intuit Developer Support:
- https://help.developer.intuit.com/
- Or through the Intuit Developer Dashboard → Support

## Quick Test

Try this to verify the redirect URI is the issue:

1. Add a **different** redirect URI temporarily:
   ```
   http://localhost:3000/api/quickbooks/callback
   ```
2. Save it
3. Try connecting from localhost (if you can)
4. If that works, the issue is with the Vercel domain
5. If that also fails, the issue is with app configuration

Let me know what you find!
