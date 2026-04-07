# Finding OAuth Settings in Intuit Dashboard

## Where to Find OAuth Settings

The OAuth settings might be in different places depending on your Intuit Dashboard version:

### Option 1: Keys & OAuth Section

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select your app: **FISPOD**
3. Look for **"Keys & OAuth"** in the left sidebar or tabs
4. Click on it
5. You should see:
   - Client ID
   - Client Secret
   - Redirect URIs section

### Option 2: Settings → Redirect URIs

1. Go to **Settings** (in left sidebar or tabs)
2. Click **"Redirect URIs"** tab
3. This is where you configure OAuth redirect URIs

### Option 3: App Overview

1. Go to **App Overview** or main app page
2. Look for sections like:
   - "Authentication"
   - "OAuth Configuration"
   - "API Keys"
   - "Credentials"

## What You Should See

For OAuth to work, you need:

1. **Client ID**: `694ad793-ff6f-442d-8fce-1ece6e00117b` (you have this)
2. **Client Secret**: Should be visible (not empty)
3. **Redirect URIs**: List of allowed redirect URIs

## If You Can't Find OAuth Settings

### Check App Type

1. Go to **App Overview**
2. Check what **type of app** it is:
   - ✅ **Web App** = Should have OAuth
   - ✅ **OAuth 2.0 App** = Should have OAuth
   - ❌ **Desktop App** = Might not have OAuth
   - ❌ **Mobile App** = Different auth method

### Check App Status

1. In **App Overview**, check if app is:
   - ✅ **"In Development"** = Should have full settings
   - ❌ **"Pending"** = Might be limited
   - ❌ **"Inactive"** = Settings might be hidden

## What to Do

### Step 1: Take Screenshots

Please take screenshots of:
1. **App Overview** page (showing app type and status)
2. **Settings** page (all tabs visible)
3. **Keys & OAuth** section (if you can find it)
4. **Redirect URIs** page (Development tab)

### Step 2: Check Navigation

Look at the left sidebar or top navigation. What sections do you see?
- App Overview
- Settings
- Keys & OAuth
- Webhooks
- Analytics
- etc.

### Step 3: Verify Redirect URIs

Even if you can't find "OAuth 2.0" specifically, the important thing is:

1. Go to **Settings** → **Redirect URIs**
2. Make sure you're on **"</> Development"** tab
3. Verify the redirect URI is listed:
   ```
   https://pod.floorinteriorservices.com/api/quickbooks/callback
   ```

## The Important Part

You don't necessarily need to see "OAuth 2.0" explicitly. What matters is:

1. ✅ **Redirect URIs** are configured (Settings → Redirect URIs)
2. ✅ **Client ID** and **Client Secret** exist (Keys & OAuth or App Overview)
3. ✅ **App Name** is set (Settings → Basic app info)

## Quick Check

Can you see:
- [ ] **Settings** → **Redirect URIs**? (This is the most important)
- [ ] **Keys & OAuth** section? (Might be called something else)
- [ ] **Client Secret** anywhere? (Should be visible or have a "Show" button)

If you can see **Redirect URIs**, that's what we need! The OAuth 2.0 label might just be implied or in a different location.

## Share What You See

Please tell me:
1. What sections/tabs do you see in the Intuit Dashboard?
2. Can you find **Settings** → **Redirect URIs**?
3. What does **App Overview** show for app type and status?

This will help me guide you to the right place!
