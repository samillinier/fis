# 🔧 Fix: Environment Variable Not Working in Vercel

## Error:
```
Microsoft login is not configured. Please set NEXT_PUBLIC_MSAL_CLIENT_ID in Vercel environment variables.
```

## 🎯 Problem:
The environment variable isn't being read by the deployed app.

## ✅ Solution: Verify & Redeploy

### Step 1: Verify Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Click your **"fis"** project
3. Click **"Settings"** tab (top navigation)
4. Click **"Environment Variables"** (left sidebar)

### Step 2: Check These Variables Exist

You should have these 2 variables:

**Variable 1:**
- **Name:** `NEXT_PUBLIC_MSAL_CLIENT_ID`
- **Value:** `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- **Environments:** ✅ Production ✅ Preview ✅ Development

**Variable 2:**
- **Name:** `NEXT_PUBLIC_MSAL_TENANT_ID`
- **Value:** `common`
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Step 3: If Variables Are Missing or Wrong

**Add Variable 1:**
1. Click **"Add New"**
2. **Name:** `NEXT_PUBLIC_MSAL_CLIENT_ID`
3. **Value:** `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
4. **Environments:** Check all three (Production, Preview, Development)
5. Click **"Save"**

**Add Variable 2:**
1. Click **"Add New"** again
2. **Name:** `NEXT_PUBLIC_MSAL_TENANT_ID`
3. **Value:** `common`
4. **Environments:** Check all three (Production, Preview, Development)
5. Click **"Save"**

### Step 4: REDEPLOY (Critical!)

**After adding/changing environment variables, you MUST redeploy:**

1. Go to **"Deployments"** tab
2. Click **"..."** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Confirm by clicking **"Redeploy"** again
5. Wait 2-3 minutes for deployment to complete

### Step 5: Verify After Redeploy

1. After deployment completes, visit: https://fis-he6w.vercel.app/signin
2. The error should be gone
3. Sign-in should work (if redirect URIs are also configured)

## ⚠️ Important Notes:

1. **Environment variables must start with `NEXT_PUBLIC_`** to be available in the browser
2. **Must redeploy after adding/changing** environment variables
3. **Check all environments** (Production, Preview, Development) when adding
4. **Variable names are case-sensitive**

## 🔍 Common Issues:

### Issue 1: Variable Not Redeployed
- ✅ Added variable but didn't redeploy
- **Fix:** Redeploy the project

### Issue 2: Wrong Variable Name
- ❌ `MSAL_CLIENT_ID` (missing `NEXT_PUBLIC_`)
- ✅ `NEXT_PUBLIC_MSAL_CLIENT_ID` (correct)

### Issue 3: Wrong Environment Selected
- Only selected "Development" but trying to use in Production
- **Fix:** Select all environments when adding

### Issue 4: Typo in Variable Name
- Double-check spelling: `NEXT_PUBLIC_MSAL_CLIENT_ID`

## 📋 Checklist:

- [ ] Variable `NEXT_PUBLIC_MSAL_CLIENT_ID` exists in Vercel
- [ ] Value is: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- [ ] Variable `NEXT_PUBLIC_MSAL_TENANT_ID` exists
- [ ] Value is: `common`
- [ ] Both variables have all environments selected
- [ ] Redeployed after adding/changing variables
- [ ] Waited for deployment to complete

---

**Most common fix: Add the variables and then REDEPLOY!** 🚀

