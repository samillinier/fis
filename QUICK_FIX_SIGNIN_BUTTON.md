# ⚡ Quick Fix: Sign-In Button Does Nothing

## Your Issue: Clicking "Sign in with Microsoft" does nothing

## 🎯 Solution: Add Redirect URIs to Azure Portal

**This is 99% of the time the issue!** Microsoft won't allow sign-in if your Vercel URL isn't registered.

## ✅ Quick Fix (5 minutes):

### Step 1: Go to Azure Portal
1. Visit: https://portal.azure.com
2. Sign in

### Step 2: Find Your App
1. Click **"Azure Active Directory"** (left menu)
2. Click **"App registrations"**
3. Find **"FIS POD"** and click it
   - Or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`

### Step 3: Add Redirect URIs
1. Click **"Authentication"** (left menu)
2. Scroll to **"Single-page application"** section
3. Under **"Redirect URIs"**, click **"Add URI"**
4. Add this URL: `https://fis-he6w.vercel.app/signin`
5. Click **"Add URI"** again
6. Add this URL: `https://fis-he6w.vercel.app`
7. Click **"Save"** at the top

### Step 4: Wait & Test
1. **Wait 5-10 minutes** (Azure needs time to update)
2. Go to: https://fis-he6w.vercel.app/signin
3. Click "Sign in with Microsoft"
4. ✅ Microsoft popup should open!

## 🔍 Check Browser Console First:

Before doing the above, check for errors:

1. Open: https://fis-he6w.vercel.app/signin
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Click the sign-in button
5. Look for red errors

**Common errors:**
- `AADSTS500113: No reply address is registered` → Redirect URI not added (do Step 3 above)
- `NEXT_PUBLIC_MSAL_CLIENT_ID is not defined` → Environment variable missing in Vercel

## 📋 Checklist:

- [ ] Added redirect URIs to Azure Portal (Step 3)
- [ ] Clicked "Save" in Azure Portal
- [ ] Waited 5-10 minutes
- [ ] Checked browser console (F12) for errors
- [ ] Tried clicking sign-in button again

## 🆘 Still Not Working?

**Share the browser console error (F12 → Console tab)** and I'll help fix it!

---

**Most likely fix: Add redirect URIs to Azure Portal!** See Step 3 above.

