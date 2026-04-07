# 🔍 Debug: Sign-In Page Not Loading

## Issue: https://pod.floorinteriorservices.com/signin shows nothing

## 🔍 Quick Checks:

### 1. Check Browser Console
- Open: https://pod.floorinteriorservices.com/signin
- Press **F12** (or Cmd+Option+I on Mac)
- Check **Console** tab for errors
- Check **Network** tab for failed requests

### 2. Common Issues:

#### A. Environment Variables Missing
**Symptoms:**
- Blank page
- Console error: "Microsoft login is not configured"
- Console error: "NEXT_PUBLIC_MSAL_CLIENT_ID is not set"

**Fix:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify these are set:
  - `NEXT_PUBLIC_MSAL_CLIENT_ID`
  - `NEXT_PUBLIC_MSAL_TENANT_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- After adding/updating, **redeploy** the project

#### B. Build Errors
**Symptoms:**
- Blank page
- Vercel build succeeded but page doesn't load
- Runtime errors

**Fix:**
- Check Vercel Dashboard → Your Project → Deployments
- Click on latest deployment
- Check **Build Logs** for errors
- Check **Function Logs** for runtime errors

#### C. JavaScript Errors
**Symptoms:**
- Page partially loads but buttons don't work
- Console shows JavaScript errors

**Common Errors:**
- `ReferenceError: window is not defined` - SSR issue
- `Cannot read property of undefined` - Missing dependencies
- `Module not found` - Build issue

**Fix:**
- Check browser console for specific error
- Verify all dependencies are in `package.json`

#### D. Redirect URI Not Configured
**Symptoms:**
- Page loads but Microsoft sign-in fails
- Error: "AADSTS500113: No reply address is registered"

**Fix:**
- Go to Azure Portal → App Registrations → "FIS POD"
- Authentication → Single-page application
- Add redirect URI: `https://pod.floorinteriorservices.com/signin`
- Add redirect URI: `https://pod.floorinteriorservices.com`
- Save and wait 5-10 minutes

## 🛠️ Debugging Steps:

### Step 1: Check Vercel Deployment Status
1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Check latest deployment:
   - Should show "Ready" or "Building"
   - If "Error", check build logs

### Step 2: Check Environment Variables
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all 5 variables are set
3. Make sure they're enabled for **Production** environment

### Step 3: Check Browser Console
1. Open: https://pod.floorinteriorservices.com/signin
2. Open Developer Tools (F12)
3. Check:
   - **Console** tab - any red errors?
   - **Network** tab - any failed requests (red)?
   - **Sources** tab - can you see the page code?

### Step 4: Test Home Page
- Try: https://pod.floorinteriorservices.com
- Does the home page load?
- If home page works but sign-in doesn't, it's a routing issue

## 🔧 Quick Fixes:

### Fix 1: Redeploy After Adding Environment Variables
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/update variables
3. Go to **Deployments** tab
4. Click **..."** on latest deployment → **Redeploy**

### Fix 2: Check Build Logs
1. Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Scroll to **Build Logs**
4. Look for errors (red text)

### Fix 3: Add Redirect URIs to Azure
1. Azure Portal: https://portal.azure.com
2. Azure Active Directory → App registrations → "FIS POD"
3. Authentication → Single-page application
4. Add: `https://pod.floorinteriorservices.com/signin`
5. Add: `https://pod.floorinteriorservices.com`
6. Save

## 📝 What to Check:

- [ ] Vercel deployment is "Ready" (not Error)
- [ ] All environment variables are set in Vercel
- [ ] Environment variables are enabled for Production
- [ ] Browser console shows no errors
- [ ] Redirect URIs added to Azure Portal
- [ ] Tried hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

## 🆘 Still Not Working?

Share these details:
1. Browser console errors (F12 → Console tab)
2. Vercel build logs (from Deployments tab)
3. Screenshot of the page
4. What you see (blank page? error message? loading spinner?)

---

**Most Common Issue:** Environment variables not set in Vercel. Check Vercel Dashboard first!

