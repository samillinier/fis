# ⚡ Quick Fix: Add Environment Variables to Vercel

## The Error You're Seeing:

"Microsoft login is not configured. Please set NEXT_PUBLIC_MSAL_CLIENT_ID in Vercel environment variables."

## ✅ Solution: Add 2 Environment Variables

### Step 1: Go to Vercel

1. **Visit:** https://vercel.com/dashboard
2. **Click** your "fis" project

### Step 2: Add Variables

1. **Click** "Settings" tab
2. **Click** "Environment Variables" (left sidebar)
3. **Click** "Add New"

**Add Variable 1:**
- **Name:** `NEXT_PUBLIC_MSAL_CLIENT_ID`
- **Value:** `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Click** "Save"

**Add Variable 2:**
- **Name:** `NEXT_PUBLIC_MSAL_TENANT_ID`
- **Value:** `common`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Click** "Save"

### Step 3: Redeploy

1. **Click** "Deployments" tab
2. **Click** "..." on latest deployment
3. **Click** "Redeploy"
4. **Wait** 2-3 minutes

### Step 4: Test

1. Visit: https://fis-he6w.vercel.app/signin
2. Click "Sign in with Microsoft"
3. ✅ Should work!

---

**That's it! After redeploy, sign-in will work.** 🚀

