# 🔄 How to Redeploy on Vercel

## Option 1: Redeploy from Vercel Dashboard (Recommended)

### After Adding Environment Variables:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Click your "fis" project

2. **Redeploy:**
   - Click **"Deployments"** tab
   - Find the latest deployment
   - Click **"..."** (three dots) on the right
   - Click **"Redeploy"**
   - Confirm by clicking **"Redeploy"** again

3. **Wait 2-3 minutes** for deployment to complete

4. **Test:**
   - Visit: https://fis-he6w.vercel.app/signin
   - Click "Sign in with Microsoft"
   - Should work now! ✅

## Option 2: Trigger Deploy by Pushing to GitHub

If you want to trigger a fresh deployment:

```bash
# Make a small change (or just add a comment)
git add .
git commit -m "Trigger redeploy"
git push origin main
```

Vercel will automatically deploy when you push to GitHub.

## Option 3: Deploy via Vercel CLI

If you have Vercel CLI installed:

```bash
cd /Users/samuelendale/Documents/FIS
vercel --prod
```

## ✅ After Redeployment:

1. **Verify Environment Variables:**
   - Settings → Environment Variables
   - Make sure both Microsoft variables are there

2. **Test Sign-In:**
   - Go to: https://fis-he6w.vercel.app/signin
   - Click "Sign in with Microsoft"
   - Should open Microsoft login popup

3. **If Sign-In Still Doesn't Work:**
   - Add redirect URIs to Azure Portal (see SIGNIN_FIX_STEPS.md)
   - Wait 5-10 minutes after adding

---

**Easiest way: Use Option 1 - Redeploy from Vercel Dashboard!** 🚀

