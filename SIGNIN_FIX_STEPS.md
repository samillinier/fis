# 🔧 Fix Sign-In Button - Step by Step

## Your Issue: Sign-in button does nothing

## 🎯 Most Common Fix (Do This First!)

### **Add Redirect URIs to Azure Portal**

Microsoft requires your Vercel URL to be registered before sign-in works.

### ✅ Quick Steps:

1. **Go to Azure Portal:**
   - https://portal.azure.com
   - Sign in

2. **Find Your App:**
   - Azure Active Directory → App registrations
   - Click **"FIS POD"** (or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`)

3. **Add Redirect URIs:**
   - Click **"Authentication"** (left menu)
   - Scroll to **"Single-page application"** section
   - Click **"Add URI"** and add:
     - `https://fis-he6w.vercel.app/signin`
   - Click **"Add URI"** again and add:
     - `https://fis-he6w.vercel.app`
   - Click **"Save"** at the top

4. **Wait 5-10 minutes** for Azure to update

5. **Test:**
   - Go to: https://fis-he6w.vercel.app/signin
   - Click "Sign in with Microsoft"
   - ✅ Popup should open!

## 🔍 Check Browser Console (Important!)

Before doing anything, check for errors:

1. Open: https://fis-he6w.vercel.app/signin
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Click the sign-in button
5. **Share any red errors you see!**

**Common errors:**
- `AADSTS500113: No reply address is registered` → Add redirect URIs (above)
- `NEXT_PUBLIC_MSAL_CLIENT_ID is not defined` → Environment variable missing

## ⚙️ Also Check Vercel Environment Variables:

1. Go to: https://vercel.com/dashboard
2. Your Project → Settings → Environment Variables
3. Must have:
   - `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
   - `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`
4. If missing, add and **redeploy**

## 📋 Quick Checklist:

- [ ] Checked browser console (F12) for errors
- [ ] Added redirect URIs to Azure Portal
- [ ] Clicked "Save" in Azure
- [ ] Verified Vercel environment variables
- [ ] Waited 5-10 minutes after Azure changes
- [ ] Tried sign-in again

---

**After Vercel redeploys (2-3 minutes), try sign-in again!**

If you still have issues, **share the browser console error** (F12 → Console tab).

