# 🔧 Add Microsoft Login Environment Variables to Vercel

## ⚠️ Current Issue:
Your app is deployed but Microsoft login is not working because environment variables are missing.

## 📋 What You Need to Do:

### Step 1: Go to Vercel Dashboard
1. **Visit:** https://vercel.com/dashboard
2. **Click** your **"fis"** project

### Step 2: Add Environment Variables
1. **Click** **"Settings"** tab (left sidebar)
2. **Click** **"Environment Variables"** (under Configuration)
3. **Click** **"Add New"** button

### Step 3: Add These Variables (One at a Time)

#### Variable 1:
- **Name:** `NEXT_PUBLIC_MSAL_CLIENT_ID`
- **Value:** `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- **Environment:** Select all (Production, Preview, Development)
- **Click** **"Save"**

#### Variable 2:
- **Name:** `NEXT_PUBLIC_MSAL_TENANT_ID`
- **Value:** `common`
- **Environment:** Select all (Production, Preview, Development)
- **Click** **"Save"**

### Step 4: Redeploy
After adding the variables:
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or wait for the next automatic deployment

### Step 5: Test
1. Visit your app: https://fis-he6w.vercel.app
2. Click **"Sign in with Microsoft"**
3. Should work now! ✅

## ✅ Quick Checklist:
- [ ] Added `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- [ ] Added `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed the app
- [ ] Tested sign-in

---

**That's it! Once you add these variables and redeploy, Microsoft login will work.** 🚀

