# ⚡ Quick Fix: Sign-In Button Not Working

## Your Issue: Clicking "Sign in with Microsoft" does nothing

## 🎯 Most Likely Fix (90% of cases):

### **Add Redirect URIs to Azure Portal**

Microsoft won't allow sign-in if your Vercel URL isn't registered in Azure.

### ✅ Quick Steps (5 minutes):

1. **Go to Azure Portal:**
   - Visit: https://portal.azure.com
   - Sign in

2. **Find Your App:**
   - Click **"Azure Active Directory"** (left menu)
   - Click **"App registrations"**
   - Find **"FIS POD"** and click it
   - (Or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`)

3. **Add Redirect URIs:**
   - Click **"Authentication"** (left menu)
   - Scroll to **"Single-page application"** section
   - Under **"Redirect URIs"**, click **"Add URI"**
   - Add: `https://pod.floorinteriorservices.com/signin`
   - Click **"Add URI"** again
   - Add: `https://pod.floorinteriorservices.com`
   - Click **"Save"** at the top

4. **Wait & Test:**
   - **Wait 5-10 minutes** (Azure needs time to update)
   - Go to: https://pod.floorinteriorservices.com/signin
   - Click "Sign in with Microsoft"
   - ✅ Microsoft popup should open!

## 🔍 Check Browser Console First:

Before doing the above, check for errors:

1. Open: https://pod.floorinteriorservices.com/signin
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Click the sign-in button
5. Look for red errors

**Common errors:**
- `AADSTS500113: No reply address is registered` → Redirect URI not added (do Step 3 above)
- `NEXT_PUBLIC_MSAL_CLIENT_ID is not defined` → Environment variable missing in Vercel

## 📋 Checklist:

- [ ] Checked browser console (F12) for errors
- [ ] Added redirect URIs to Azure Portal (Step 3)
- [ ] Clicked "Save" in Azure Portal
- [ ] Waited 5-10 minutes
- [ ] Tried clicking sign-in button again

## 🆘 Still Not Working?

**Share the browser console error (F12 → Console tab)** and I'll help fix it!

---

**Most likely fix: Add redirect URIs to Azure Portal!** See Step 3 above. ⬆️

