# 🔧 Fix: Sign-In Button Not Working

## Issue: Clicking "Sign in with Microsoft" button does nothing

## 🔍 Most Common Causes:

### 1. Redirect URI Not Added to Azure Portal

**This is the #1 cause!** Microsoft won't allow sign-in if the redirect URI isn't registered.

**Fix:**
1. Go to Azure Portal: https://portal.azure.com
2. Azure Active Directory → **App registrations** → **"FIS POD"**
3. Click **"Authentication"** (left menu)
4. Under **"Single-page application"** section, add these redirect URIs:
   - `https://fis-he6w.vercel.app/signin`
   - `https://fis-he6w.vercel.app`
5. Click **"Save"**
6. Wait 5-10 minutes for changes to propagate

### 2. Environment Variables Missing

Check Vercel environment variables:
- `NEXT_PUBLIC_MSAL_CLIENT_ID` - Must be set!
- `NEXT_PUBLIC_MSAL_TENANT_ID` - Must be set!

**Fix:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify both Microsoft variables are set
3. Redeploy if you just added them

### 3. Browser Blocking Popup

Microsoft sign-in uses a popup window. Your browser might be blocking it.

**Fix:**
- Check browser address bar for popup blocked notification
- Allow popups for `fis-he6w.vercel.app`
- Try in Incognito/Private window
- Disable popup blocker temporarily

### 4. JavaScript Errors

**Check browser console:**
1. Open: https://fis-he6w.vercel.app/signin
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Look for red error messages
5. Click the sign-in button again
6. Check for new errors

**Common errors:**
- `NEXT_PUBLIC_MSAL_CLIENT_ID is not defined` → Environment variable missing
- `Failed to initialize MSAL` → Configuration issue
- `Popup blocked` → Browser blocking popup
- `AADSTS500113: No reply address` → Redirect URI not added to Azure

## 🛠️ Step-by-Step Fix:

### Step 1: Check Browser Console First

1. Open: https://fis-he6w.vercel.app/signin
2. Press **F12**
3. Open **Console** tab
4. Click the "Sign in with Microsoft" button
5. **Share any errors you see** (especially red text)

### Step 2: Add Redirect URIs to Azure (MOST IMPORTANT)

1. **Go to Azure Portal:**
   - https://portal.azure.com
   - Sign in with your Microsoft account

2. **Navigate to App Registration:**
   - Click **"Azure Active Directory"** (left menu)
   - Click **"App registrations"**
   - Find and click: **"FIS POD"** (or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`)

3. **Add Redirect URIs:**
   - Click **"Authentication"** (left menu)
   - Scroll to **"Single-page application"** section
   - Under **"Redirect URIs"**, click **"Add URI"**
   - Add: `https://fis-he6w.vercel.app/signin`
   - Click **"Add URI"** again
   - Add: `https://fis-he6w.vercel.app`
   - Click **"Save"** at the top

4. **Wait 5-10 minutes** for Azure changes to propagate

### Step 3: Verify Environment Variables

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:
   - `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
   - `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`
3. If missing, add them and **redeploy**

### Step 4: Test Again

1. Wait 5-10 minutes after adding redirect URIs
2. Clear browser cache (or use Incognito)
3. Go to: https://fis-he6w.vercel.app/signin
4. Click "Sign in with Microsoft"
5. Microsoft popup should open

## 🔍 What Should Happen:

**When you click the button:**
1. ✅ A Microsoft sign-in popup window opens
2. ✅ You enter your Microsoft credentials
3. ✅ Popup closes automatically
4. ✅ You're redirected to the dashboard

**If nothing happens:**
- Check browser console for errors
- Check if popup is blocked
- Verify redirect URIs are added to Azure

## ⚠️ Common Errors:

### Error: "AADSTS500113: No reply address is registered"
**Fix:** Add redirect URIs to Azure Portal (see Step 2 above)

### Error: "Popup blocked"
**Fix:** Allow popups for your domain in browser settings

### Error: "NEXT_PUBLIC_MSAL_CLIENT_ID is not defined"
**Fix:** Add environment variable in Vercel and redeploy

### No Error, Button Just Doesn't Work
**Fix:** 
1. Check browser console (F12)
2. Verify redirect URIs added to Azure
3. Try different browser or Incognito mode

## 🎯 Quick Checklist:

- [ ] Redirect URIs added to Azure Portal
- [ ] Waited 5-10 minutes after adding redirect URIs
- [ ] Environment variables set in Vercel
- [ ] Checked browser console for errors (F12)
- [ ] Popup blocker disabled
- [ ] Tried Incognito/Private window

## 🆘 Still Not Working?

**Share these details:**
1. Browser console errors (F12 → Console tab)
2. What happens when you click the button (nothing? error message?)
3. Did you add redirect URIs to Azure Portal?
4. Screenshot of the sign-in page

---

**Most likely fix: Add redirect URIs to Azure Portal!** See Step 2 above.
