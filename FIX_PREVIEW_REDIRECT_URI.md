# 🔧 Fix: Preview Deployment Redirect URI

## The Problem:

Your app is sending a **preview deployment URL** instead of the production URL:

**Being Sent:**
- `https://fis-j97c42pnb-samilliniers-projects.vercel.app/signin`

**Configured in Azure:**
- `https://fis-he6w.vercel.app/signin`

These don't match!

## ✅ Solution 1: Add Preview URL to Azure (Quick Fix)

Add the preview URL to Azure Portal:

1. Go to: https://portal.azure.com
2. Azure AD → App registrations → "FIS POD"
3. Authentication → Single-page application
4. Click **"+ Add Redirect URI"**
5. Add: `https://fis-j97c42pnb-samilliniers-projects.vercel.app/signin`
6. Click **"+ Add Redirect URI"** again
7. Add: `https://fis-j97c42pnb-samilliniers-projects.vercel.app`
8. Click **"Save"**
9. Wait 5-10 minutes

## ✅ Solution 2: Use Production URL (Better Solution)

Instead of using the preview URL, access your app via the production URL:

1. **Visit:** https://fis-he6w.vercel.app/signin
2. This will use the production URL that's already configured in Azure
3. Sign-in should work immediately!

## 🔍 Why This Happened:

Vercel creates different URLs for:
- **Production:** `https://fis-he6w.vercel.app` (your main domain)
- **Preview:** `https://fis-j97c42pnb-samilliniers-projects.vercel.app` (temporary preview URL)

If you accessed the preview URL, the app uses that as the redirect URI.

## ✅ Best Solution:

**Use the production URL:**
- Go to: https://fis-he6w.vercel.app/signin
- This will work with your existing Azure configuration
- No need to add preview URLs (they change with each deployment)

## 📋 Option: Add Wildcard (Advanced)

If you want preview deployments to work, you could add:
- `https://*-samilliniers-projects.vercel.app/signin`
- `https://*-samilliniers-projects.vercel.app`

But this is usually not recommended - better to use production URL.

---

**Quick Fix: Just use https://fis-he6w.vercel.app/signin instead!** 🚀

