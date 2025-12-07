# 🔧 Add Preview Redirect URI to Azure

## ⚠️ Issue Found:

The redirect URI being used is:
```
https://fis-5t7hsgyd7-samilliniers-projects.vercel.app/signin
```

This is a **Vercel preview URL**, not the production URL.

## 📋 Solution: Add Preview URL to Azure

### Step 1: Go to Azure Portal
1. Visit: https://portal.azure.com
2. Search for **"App registrations"**
3. Click on **"FIS POD"** (your app)

### Step 2: Add Preview Redirect URIs
1. Click **"Authentication"** in the left sidebar
2. Scroll to **"Single-page application"** section
3. Click **"+ Add URI"**

**Add these 2 URIs:**

1. **Preview Sign-in URL:**
   ```
   https://fis-5t7hsgyd7-samilliniers-projects.vercel.app/signin
   ```

2. **Preview Root URL:**
   ```
   https://fis-5t7hsgyd7-samilliniers-projects.vercel.app
   ```

### Step 3: Also Add Production URLs (If Not Already Added)

**Add these for production:**

1. **Production Sign-in:**
   ```
   https://fis-he6w.vercel.app/signin
   ```

2. **Production Root:**
   ```
   https://fis-he6w.vercel.app
   ```

3. **Local Development:**
   ```
   http://localhost:3000/signin
   ```
   ```
   http://localhost:3000
   ```

### Step 4: Save and Wait
1. Click **"Save"** button
2. **Wait 5-10 minutes** for Azure to propagate changes

### Step 5: Test
1. Try signing in again
2. Should work now! ✅

## ⚠️ Important Note:

**Vercel creates NEW preview URLs for each deployment/PR:**
- Each preview deployment gets a unique URL like `fis-xxxxx-samilliniers-projects.vercel.app`
- You may need to add new preview URLs as they change
- **Better option:** Use the **production URL** (`https://fis-he6w.vercel.app`) which stays the same

## 💡 Recommendation:

1. **For now:** Add the current preview URL to get it working
2. **For production:** Use `https://fis-he6w.vercel.app` which doesn't change
3. **If preview URLs keep changing:** You might want to only test on production URL

---

**After adding these URIs and waiting a few minutes, the sign-in should work!** 🚀

