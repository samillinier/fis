# 🚀 Deploy to Vercel - Quick Steps

## ✅ Build Test: PASSED

Your app is ready to deploy!

## 🎯 Deploy Options:

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel:**
   - https://vercel.com/dashboard
   - Sign in

2. **Find Your Project:**
   - Look for "fis" project
   - Or go to: https://vercel.com/dashboard → Your projects

3. **Redeploy:**
   - Click on your project
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Or push to GitHub to trigger auto-deploy

4. **Verify Environment Variables:**
   - Settings → Environment Variables
   - Make sure all 5 variables are set (see `ENV_VARS_FOR_VERCEL.txt`)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
cd /Users/samuelendale/Documents/FIS
vercel --prod
```

### Option 3: Push to GitHub (Auto-Deploy)

If your repo is connected to Vercel:

```bash
# Commit changes
git add .
git commit -m "Fix API routes and error handling"
git push

# Vercel will auto-deploy
```

## ⚙️ After Deployment:

### 1. Update Azure Redirect URIs

After deployment, add your Vercel URL to Azure Portal:
- https://portal.azure.com
- Azure Active Directory → App registrations → "FIS POD"
- Authentication → Single-page application
- Add: `https://fis-he6w.vercel.app/signin`
- Add: `https://fis-he6w.vercel.app`
- Save

### 2. Test Your Deployment

- Visit: https://fis-he6w.vercel.app
- Test sign-in
- Verify everything works

## 📋 Environment Variables Checklist:

Make sure these are set in Vercel:
- ✅ `NEXT_PUBLIC_MSAL_CLIENT_ID`
- ✅ `NEXT_PUBLIC_MSAL_TENANT_ID`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

See `ENV_VARS_FOR_VERCEL.txt` for values.

---

**Ready to deploy!** Choose one of the options above. 🚀
