# 🚀 How to Deploy - Complete Guide

## 📋 Current Status:

Your code is already on GitHub and Vercel is connected. To deploy:

## ✅ Step 1: Add Environment Variables (REQUIRED!)

Before deploying, add these to Vercel:

1. **Go to:** https://vercel.com/dashboard
2. **Your Project → Settings → Environment Variables**
3. **Add these 2 variables:**

   **Variable 1:**
   - Name: `NEXT_PUBLIC_MSAL_CLIENT_ID`
   - Value: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_MSAL_TENANT_ID`
   - Value: `common`
   - Environments: ✅ Production ✅ Preview ✅ Development

## ✅ Step 2: Redeploy

After adding environment variables, redeploy:

### Method A: Redeploy from Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/dashboard
2. Your Project → **"Deployments"** tab
3. Click **"..."** (three dots) on latest deployment
4. Click **"Redeploy"**
5. Wait 2-3 minutes

### Method B: Push to GitHub (Auto-Deploys)

Code is already pushed! Vercel will auto-deploy when:
- You push new changes to GitHub
- Or you manually redeploy from dashboard

## ✅ Step 3: Test Your Deployment

After deployment completes:

1. Visit: https://fis-he6w.vercel.app/signin
2. Click "Sign in with Microsoft"
3. Should work! ✅

## 🔧 If Sign-In Doesn't Work:

Add redirect URIs to Azure Portal:

1. Go to: https://portal.azure.com
2. Azure AD → App registrations → "FIS POD"
3. Authentication → Single-page application
4. Add redirect URIs:
   - `https://fis-he6w.vercel.app/signin`
   - `https://fis-he6w.vercel.app`
5. Save and wait 5-10 minutes

## 📝 Summary:

1. ✅ Code is on GitHub
2. ⚠️ **Add environment variables to Vercel** (Step 1)
3. ✅ **Redeploy from Vercel dashboard** (Step 2)
4. ✅ Test sign-in (Step 3)

---

**Everything is ready! Just add the environment variables and redeploy!** 🚀

