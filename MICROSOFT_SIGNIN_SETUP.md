# 🔐 Microsoft Sign-In Setup for Production

## How Microsoft Sign-In Works

Your app uses **Microsoft Authentication Library (MSAL)** with:
- **Client ID**: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- **Tenant**: `common` (multi-tenant - allows any Azure AD user)
- **Redirect URI**: Automatically set to your current domain + `/signin`

## ✅ Current Setup (Local Development)

**Already Working:**
- ✅ Local: `http://localhost:3000/signin`
- ✅ Environment variables configured
- ✅ Multi-tenant enabled (users from any Azure AD)

## 🚀 Production Deployment Steps

### Step 1: Deploy to Vercel

1. Deploy your app to Vercel (follow `QUICK_DEPLOY.md`)
2. Note your Vercel URL: `https://pod.floorinteriorservices.com`

### Step 2: Add Production Redirect URLs to Azure

**After deployment, you MUST add your Vercel URL to Azure App Registration:**

1. **Go to Azure Portal:**
   - Visit: https://portal.azure.com
   - Sign in with your Microsoft account

2. **Navigate to App Registration:**
   - Click **"Azure Active Directory"** (left menu)
   - Click **"App registrations"**
   - Find and click: **"FIS POD"** (or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`)

3. **Configure Authentication:**
   - Click **"Authentication"** in the left menu
   - Scroll to **"Single-page application"** section
   - Under **"Redirect URIs"**, you should see:
     - ✅ `http://localhost:3000/signin` (already there)
     - ✅ `http://localhost:3000` (already there)

4. **Add Production URLs:**
   - Click **"+ Add a platform"** (if needed)
   - Or click **"Add URI"** under Single-page application
   - Add these 2 URLs (replace `your-app` with your actual Vercel app name):
     ```
     https://pod.floorinteriorservices.com/signin
     https://pod.floorinteriorservices.com
     ```
   - Click **"Save"** at the top

5. **Verify Settings:**
   - **Supported account types**: Should be **"Accounts in any organizational directory and personal Microsoft accounts"** (multi-tenant)
   - If not, click **"Edit"** next to it and select multi-tenant

### Step 3: Environment Variables in Vercel

Make sure these are set in Vercel Dashboard:

```
NEXT_PUBLIC_MSAL_CLIENT_ID=90da75a4-0ce9-49a2-9ab9-79adaaf65b3a
NEXT_PUBLIC_MSAL_TENANT_ID=common
```

✅ **Already documented in:** `ENV_VARS_FOR_VERCEL.txt`

## 📋 Complete Redirect URI List

After setup, you should have:

**Development:**
- `http://localhost:3000/signin`
- `http://localhost:3000`

**Production:**
- `https://pod.floorinteriorservices.com/signin`
- `https://pod.floorinteriorservices.com`

**Preview (Optional - for Vercel preview deployments):**
- `https://your-app-git-branch.vercel.app/signin`
- `https://your-app-git-branch.vercel.app`

## 🔍 How It Works

Your app automatically uses the correct redirect URI:

```typescript
redirectUri: window.location.origin + '/signin'
```

This means:
- **Local**: `http://localhost:3000/signin`
- **Production**: `https://pod.floorinteriorservices.com/signin`
- **No code changes needed!** ✨

## ⚠️ Common Issues

### Error: "AADSTS500113: No reply address is registered"

**Fix:**
- The Vercel URL is not added to Azure redirect URIs
- Add `https://pod.floorinteriorservices.com/signin` to Azure Portal

### Error: "AADSTS50020: User account does not exist in tenant"

**Fix:**
- Check **Supported account types** is set to multi-tenant
- Should be: "Accounts in any organizational directory and personal Microsoft accounts"

### Sign-in works locally but not in production

**Check:**
1. ✅ Redirect URI added to Azure Portal
2. ✅ Environment variables set in Vercel
3. ✅ Supported account types is multi-tenant
4. ✅ Wait 5-10 minutes after Azure changes (propagation delay)

## 🎯 Quick Checklist

Before going live:

- [ ] App deployed to Vercel
- [ ] Vercel URL noted
- [ ] Azure Portal → App Registration → Authentication
- [ ] Production redirect URIs added
- [ ] Environment variables set in Vercel
- [ ] Supported account types = Multi-tenant
- [ ] Test sign-in on production URL

## 🆘 Need Help?

1. **Azure Portal**: https://portal.azure.com
2. **App Registration**: Azure Active Directory → App registrations → FIS POD
3. **Current Redirect URIs**: Authentication → Single-page application section

---

**After adding redirect URIs, Microsoft sign-in will work on production!** 🎉

