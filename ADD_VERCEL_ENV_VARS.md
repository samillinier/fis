# ⚙️ Add Environment Variables to Vercel

## Issue: Missing `NEXT_PUBLIC_MSAL_CLIENT_ID` Environment Variable

The error shows that Microsoft login isn't configured. You need to add environment variables to Vercel.

## ✅ Quick Fix Steps:

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Sign in if needed
3. Find your **"fis"** project and click on it

### Step 2: Open Environment Variables Settings

1. Click **"Settings"** tab (top menu)
2. Click **"Environment Variables"** (left sidebar)

### Step 3: Add Microsoft Auth Variables

Add these two variables:

#### Variable 1:
- **Key:** `NEXT_PUBLIC_MSAL_CLIENT_ID`
- **Value:** `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- **Environment:** Check all (Production, Preview, Development)

Click **"Add"**

#### Variable 2:
- **Key:** `NEXT_PUBLIC_MSAL_TENANT_ID`
- **Value:** `common`
- **Environment:** Check all (Production, Preview, Development)

Click **"Add"**

### Step 4: Redeploy

After adding the variables:

1. Go to **"Deployments"** tab
2. Click **"..."** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for deployment to complete

### Step 5: Test Again

1. Visit: https://fis-he6w.vercel.app/signin
2. Click "Sign in with Microsoft"
3. Should work now! ✅

## 📋 Checklist:

- [ ] Added `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- [ ] Added `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed the project
- [ ] Tested sign-in again

## 🔧 Detailed Steps with Screenshots:

### Finding Environment Variables:

1. **Vercel Dashboard** → Your Project
2. **Settings** tab (top navigation)
3. **Environment Variables** (left sidebar, under "General")

### Adding a Variable:

1. Click **"Add New"** button
2. Enter the **Key** (variable name)
3. Enter the **Value**
4. Check the environments you want (check all three!)
5. Click **"Save"**

### After Adding Variables:

**Important:** You must redeploy for changes to take effect!

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Confirm and wait

---

**After redeploy, your sign-in should work!** 🎉

