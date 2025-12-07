# 🔍 Debug Redirect URI Issue

## Current Error:
```
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid. 
The expected value is a URI which matches a redirect URI registered for this client application.
```

## 🔍 What the App is Sending:

The app is configured to use:
- `window.location.origin + '/signin'`

So if you're on:
- **Production:** `https://fis-he6w.vercel.app/signin`
- **Local:** `http://localhost:3000/signin`

## ✅ What Should Be in Azure Portal:

Make sure these EXACT URIs are added (case-sensitive, no trailing slashes):

1. `https://fis-he6w.vercel.app/signin`
2. `https://fis-he6w.vercel.app`
3. `http://localhost:3000/signin`
4. `http://localhost:3000`

## 🔧 Troubleshooting Steps:

### Step 1: Verify Exact Match

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Try to sign in
4. Look for the request to `login.microsoftonline.com`
5. Check the `redirect_uri` parameter in the URL
6. Make sure this EXACT value is in Azure Portal

### Step 2: Check Azure Portal Again

1. Go to: https://portal.azure.com
2. Azure AD → App registrations → "FIS POD"
3. Authentication → Single-page application
4. Verify the redirect URI EXACTLY matches what's in the request

### Step 3: Common Issues

#### Issue 1: Trailing Slash
- ❌ Wrong: `https://fis-he6w.vercel.app/signin/`
- ✅ Correct: `https://fis-he6w.vercel.app/signin`

#### Issue 2: Wrong Platform Type
- Must be **"Single-page application"** not "Web"

#### Issue 3: Case Sensitivity
- Must match exactly (lowercase/uppercase matters)

#### Issue 4: Wait Time
- Changes can take 5-15 minutes to propagate

### Step 4: Double-Check Your Configuration

In Azure Portal, make sure:

- [ ] Platform type is **"Single-page application"**
- [ ] URI is **exactly** `https://fis-he6w.vercel.app/signin` (no trailing slash)
- [ ] URI is **exactly** `https://fis-he6w.vercel.app` (no trailing slash)
- [ ] You clicked **"Save"** (or it auto-saved)
- [ ] You've waited at least **5-10 minutes** since saving

## 🆘 Still Not Working?

### Option 1: Check Browser Console

1. Open: https://fis-he6w.vercel.app/signin
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Click "Sign in with Microsoft"
5. Look for any error messages
6. Check **Network** tab for the redirect_uri being sent

### Option 2: Try Adding More Redirect URIs

Sometimes adding variations helps:

- `https://fis-he6w.vercel.app/signin` ✅
- `https://fis-he6w.vercel.app` ✅
- `https://fis-he6w.vercel.app/` (with trailing slash)
- `https://fis-he6w.vercel.app/#` (with hash)

### Option 3: Clear Cache

1. Clear browser cache
2. Try incognito/private window
3. Try different browser

---

**Check the Network tab to see what redirect_uri is actually being sent!** 🔍

