# 🔧 Fix Azure AD Redirect URI Error

## Error Message
```
AADSTS50011: The redirect URI 'https://fis-phi.vercel.app/signin' does not match 
the redirect URIs configured for the application
```

## Quick Fix: Add Redirect URI to Azure AD

### Step 1: Go to Azure Portal

1. **Open Azure Portal:**
   - Go to: https://portal.azure.com
   - Sign in with your Microsoft account

2. **Navigate to App Registration:**
   - Search for "Azure Active Directory" or "Microsoft Entra ID"
   - Click **"App registrations"** (left sidebar)
   - Find your app: **"FIS POD"** (or search for Client ID: `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`)

### Step 2: Add Redirect URI

1. **Click on your app** ("FIS POD")

2. **Go to Authentication:**
   - Click **"Authentication"** in the left sidebar (under "Manage")

3. **Add Redirect URI:**
   - Scroll down to **"Redirect URIs"** section
   - Click **"Add a platform"** (if needed) or **"Add URI"**
   - Select platform type: **"Single-page application"** (SPA)
   - Add these URIs one by one:

   **URI 1:**
   ```
   https://fis-phi.vercel.app/signin
   ```

   **URI 2:**
   ```
   https://fis-phi.vercel.app
   ```

   **URI 3 (for local development):**
   ```
   http://localhost:3000/signin
   ```

   **URI 4 (for local development):**
   ```
   http://localhost:3000
   ```

4. **Save:**
   - Click **"Save"** button at the top
   - Wait a few seconds for changes to propagate

### Step 3: Verify

1. **Check the list:**
   - You should see all 4 URIs listed under "Single-page application"
   - Make sure `https://fis-phi.vercel.app/signin` is there

2. **Test your app:**
   - Go to: https://fis-phi.vercel.app/signin
   - Try signing in
   - Should work now! ✅

---

## Important Notes

- **Changes take effect immediately** (usually within 1-2 minutes)
- **You can add multiple redirect URIs** - add all environments you use
- **For production:** Always use `https://` (not `http://`)
- **For local dev:** Use `http://localhost:3000`

---

## If You Still Get Errors

1. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear cookies for the site

2. **Wait a minute:**
   - Azure changes can take 1-2 minutes to propagate

3. **Double-check the URI:**
   - Make sure it matches EXACTLY (including trailing slash if present)
   - Case-sensitive

4. **Check platform type:**
   - Must be **"Single-page application"** (SPA)
   - Not "Web" or other types

---

**After adding the redirect URI, your sign-in should work!** 🚀

