# 🔧 Fix Redirect URI Error - Step by Step

## The Error:
```
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid. 
The expected value is a URI which matches a redirect URI registered for this client application.
```

## ✅ Solution: Add Redirect URIs to Azure Portal

### Step 1: Go to Azure Portal
1. Visit: https://portal.azure.com
2. Sign in with your Microsoft account

### Step 2: Navigate to App Registration
1. Click **"Azure Active Directory"** (in left sidebar)
2. Click **"App registrations"**
3. Find and click **"FIS POD"**
   - Or search for: Client ID `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`

### Step 3: Open Authentication Settings
1. Click **"Authentication"** in the left menu
2. Scroll down to **"Single-page application"** section

### Step 4: Add Redirect URIs

Click **"Add URI"** button and add these URIs one by one:

**URI 1:**
```
https://fis-he6w.vercel.app/signin
```
Click **"Add"**

**URI 2:**
```
https://fis-he6w.vercel.app
```
Click **"Add"**

**URI 3 (for local development):**
```
http://localhost:3000/signin
```
Click **"Add"**

**URI 4 (for local development):**
```
http://localhost:3000
```
Click **"Add"**

### Step 5: Save Changes
1. Click **"Save"** button at the top of the page
2. Wait for confirmation message

### Step 6: Wait for Changes to Propagate
⚠️ **IMPORTANT:** Wait 5-10 minutes for Azure to update its configuration

### Step 7: Test Sign-In
1. Go to: https://fis-he6w.vercel.app/signin
2. Click "Sign in with Microsoft"
3. ✅ Microsoft login popup should appear!

## 📋 Redirect URIs Checklist:

Make sure all 4 of these are added:
- [ ] `https://fis-he6w.vercel.app/signin`
- [ ] `https://fis-he6w.vercel.app`
- [ ] `http://localhost:3000/signin`
- [ ] `http://localhost:3000`

## ⚠️ Important Notes:

1. **Wait 5-10 minutes** after saving - Azure needs time to propagate
2. **Exact match required** - URIs must match exactly (case-sensitive)
3. **No trailing slashes** - Don't add `/` at the end
4. **Must be "Single-page application"** type, not "Web"

## 🔍 If It Still Doesn't Work:

1. Double-check URIs are exact matches
2. Make sure you clicked "Save" at the top
3. Wait longer (sometimes takes up to 10 minutes)
4. Clear browser cache and try again
5. Check browser console (F12) for any other errors

---

**After adding these URIs and waiting 5-10 minutes, sign-in will work!** 🚀

