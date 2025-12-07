# 🔐 Microsoft Sign-In - Quick Setup

## ✅ Good News!

**Your Microsoft sign-in is already configured!** The redirect URI is automatically detected from your domain, so it works on:
- ✅ Local: `http://localhost:3000`
- ✅ Production: `https://your-app.vercel.app` (after you add it to Azure)

## 🚀 What You Need to Do After Deployment:

### 1. Deploy to Vercel
- Follow `QUICK_DEPLOY.md`
- Get your Vercel URL: `https://your-app.vercel.app`

### 2. Add Redirect URI to Azure (ONE TIME SETUP)

**Go to Azure Portal:**
1. https://portal.azure.com
2. Azure Active Directory → **App registrations** → **"FIS POD"**
3. **Authentication** → **Single-page application**
4. Add these 2 redirect URIs:
   - `https://your-app.vercel.app/signin`
   - `https://your-app.vercel.app`
5. Click **Save**

### 3. Environment Variables in Vercel

Already documented in `ENV_VARS_FOR_VERCEL.txt`:
- `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`

## 🎯 That's It!

After adding the redirect URIs to Azure, Microsoft sign-in will work on production automatically!

## ⚠️ Important:

- **Wait 5-10 minutes** after adding redirect URIs (Azure propagation delay)
- **Multi-tenant is enabled** - any Azure AD user can sign in
- **No code changes needed** - redirect URI is auto-detected

---

**See `MICROSOFT_SIGNIN_SETUP.md` for detailed instructions and troubleshooting.**

