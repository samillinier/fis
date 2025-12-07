# ✅ Deployment Checklist

## 1. Code Deployment

- ✅ Changes committed
- ✅ Pushed to GitHub
- ⏳ Vercel auto-deploy (check dashboard)

## 2. Environment Variables (Vercel)

**Go to**: Vercel Dashboard → Project → Settings → Environment Variables

### Required Variables (Keep):
- ✅ `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- ✅ `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`

### Remove These (No longer needed):
- ❌ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ❌ `SUPABASE_SERVICE_ROLE_KEY`

## 3. Azure Redirect URIs

**Go to**: https://portal.azure.com → Azure AD → App registrations → "FIS POD"

### Add These Redirect URIs:
- ✅ `https://fis-he6w.vercel.app/signin`
- ✅ `https://fis-he6w.vercel.app`

## 4. Test Deployment

After deployment completes:

1. ✅ Visit: https://fis-he6w.vercel.app
2. ✅ Test Microsoft sign-in
3. ✅ Upload data file
4. ✅ Verify localStorage works
5. ✅ Check all pages load correctly

## 5. Post-Deployment

- ✅ Update Azure redirect URIs
- ✅ Remove unused Supabase env vars from Vercel
- ✅ Test all functionality

---

**Your app is deploying! Check Vercel dashboard for status.** 🚀

