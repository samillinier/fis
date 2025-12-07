# 🚀 Quick Deploy to Vercel

## ✅ Your build is ready! 

Build test passed. Ready to deploy!

## 🎯 Fastest Way to Deploy:

### 1. Go to Vercel Dashboard:
👉 https://vercel.com/new

### 2. Import from GitHub:
- Click **"Import Git Repository"**
- Select: `samillinier/fis` (or paste GitHub URL)
- Click **"Import"**

### 3. Configure Project:
- Framework: **Next.js** (auto-detected)
- Root Directory: `./` (default)
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)

### 4. Add Environment Variables:

Click **"Environment Variables"** and add these 5 variables:

```
NEXT_PUBLIC_MSAL_CLIENT_ID
90da75a4-0ce9-49a2-9ab9-79adaaf65b3a

NEXT_PUBLIC_MSAL_TENANT_ID
common

NEXT_PUBLIC_SUPABASE_URL
https://idkuchtgrgooqixdjjcc.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
sb_publishable_Vqo7Xww4Go4iQJ7U44t9vQ_ZbZokbID

SUPABASE_SERVICE_ROLE_KEY
sb_secret_1u_e0Fo-lp_LCy8Zjsw2nQ_7OWZqMBH
```

**For each variable:**
- Check all environments: Production, Preview, Development
- Click "Add"

### 5. Deploy:
- Click **"Deploy"**
- Wait 2-3 minutes
- 🎉 Your app is live!

### 6. Update Azure Redirect URLs:

After deployment, you'll get a URL like: `https://fis-xxxxx.vercel.app`

**Go to Azure Portal:**
1. https://portal.azure.com
2. Azure Active Directory → App registrations → "FIS POD"
3. Authentication → Single-page application
4. Add redirect URI: `https://your-app.vercel.app/signin`
5. Add redirect URI: `https://your-app.vercel.app`
6. Save

## ✅ Done!

Your app is now live on Vercel! 🎊

---

**Need help?** See `DEPLOY_TO_VERCEL.md` for detailed instructions.

