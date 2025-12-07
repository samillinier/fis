# 🔧 Fix: Redirect URI Error

## Error You're Seeing:

```
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid. 
The expected value is a URI which matches a redirect URI registered for this client application.
```

## 🎯 Problem:

The redirect URI used by the app doesn't match what's registered in Azure Portal.

## ✅ Solution: Add Redirect URIs to Azure Portal

### Step 1: Go to Azure Portal

1. Visit: https://portal.azure.com
2. Sign in

### Step 2: Find Your App Registration

1. Click **"Azure Active Directory"** (left menu)
2. Click **"App registrations"**
3. Find **"FIS POD"** and click it
   - Or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`

### Step 3: Add Redirect URIs

1. Click **"Authentication"** (left menu)
2. Scroll to **"Single-page application"** section
3. Under **"Redirect URIs"**, click **"Add URI"**

**Add these URIs (one at a time):**

1. **First URI:**
   - `https://fis-he6w.vercel.app/signin`
   - Click **"Add"**

2. **Second URI:**
   - `https://fis-he6w.vercel.app`
   - Click **"Add"**

3. **Third URI (for local development):**
   - `http://localhost:3000/signin`
   - Click **"Add"**

4. **Fourth URI (for local development):**
   - `http://localhost:3000`
   - Click **"Add"**

### Step 4: Save

1. Click **"Save"** at the top of the page
2. **Wait 5-10 minutes** for Azure to update (important!)

### Step 5: Test Again

1. Go to: https://fis-he6w.vercel.app/signin
2. Click "Sign in with Microsoft"
3. Should work now! ✅

## 📋 Redirect URIs Checklist:

Make sure these are all added in Azure Portal:

- ✅ `https://fis-he6w.vercel.app/signin`
- ✅ `https://fis-he6w.vercel.app`
- ✅ `http://localhost:3000/signin` (for local dev)
- ✅ `http://localhost:3000` (for local dev)

## ⚠️ Important Notes:

1. **Wait 5-10 minutes** after saving - Azure needs time to propagate changes
2. **Exact match required** - The URI must match exactly (including `https://` and `/signin`)
3. **No trailing slashes** - Don't add trailing slashes to the URIs

## 🔍 Verify Redirect URI Format:

Your redirect URIs should look exactly like this in Azure:
- `https://fis-he6w.vercel.app/signin` (not `https://fis-he6w.vercel.app/signin/`)
- `https://fis-he6w.vercel.app` (not `https://fis-he6w.vercel.app/`)

---

**After adding these URIs and waiting 5-10 minutes, sign-in should work!** 🚀

