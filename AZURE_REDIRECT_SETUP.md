# 🔐 Azure Redirect URI Setup - Step by Step

## Your Vercel URL: https://pod.floorinteriorservices.com

## ⚠️ CRITICAL: Without this, Microsoft sign-in won't work!

## 📋 Step-by-Step Instructions:

### Step 1: Go to Azure Portal

1. Visit: https://portal.azure.com
2. Sign in with your Microsoft account

### Step 2: Find Your App Registration

1. In the left menu, click **"Azure Active Directory"**
2. Click **"App registrations"** (under "Manage")
3. Find your app in the list:
   - Look for **"FIS POD"**
   - Or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
4. Click on it to open

### Step 3: Open Authentication Settings

1. In the left menu of your app, click **"Authentication"**
2. You'll see different platform types (Web, Single-page application, etc.)

### Step 4: Add Redirect URIs

1. Scroll down to **"Single-page application"** section
2. Under **"Redirect URIs"**, you should see:
   - `http://localhost:3000/signin` (if you added it before)
   - `http://localhost:3000` (if you added it before)

3. **Add Production URIs:**
   - Click **"Add URI"** button
   - Type: `https://pod.floorinteriorservices.com/signin`
   - Click **"Add URI"** button again
   - Type: `https://pod.floorinteriorservices.com`

4. **Click "Save"** at the top of the page

### Step 5: Verify Settings

Make sure these are correct:
- ✅ **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts" (Multi-tenant)
- ✅ Redirect URIs include:
  - `http://localhost:3000/signin`
  - `http://localhost:3000`
  - `https://pod.floorinteriorservices.com/signin` ← NEW
  - `https://pod.floorinteriorservices.com` ← NEW

### Step 6: Wait for Propagation

**Important:** Azure changes take 5-10 minutes to propagate. Wait before testing!

## ✅ After Setup:

1. Wait 5-10 minutes
2. Clear browser cache (or use Incognito)
3. Go to: https://pod.floorinteriorservices.com/signin
4. Click "Sign in with Microsoft"
5. Microsoft popup should open!

## 🔗 Quick Links:

- **Azure Portal**: https://portal.azure.com
- **Your App**: https://pod.floorinteriorservices.com
- **App Registration**: Azure AD → App registrations → "FIS POD"

## 📝 What Redirect URIs Do:

Microsoft needs to know which URLs are allowed to redirect users back after sign-in. Without these, Microsoft will reject the sign-in request and nothing will happen.

---

**This is usually the reason the button does nothing!** Add the redirect URIs and wait 5-10 minutes.

