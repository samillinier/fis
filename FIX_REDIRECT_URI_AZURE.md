# 🔧 Fix: Redirect URI Error in Azure

## ✅ Good News:
Microsoft login is working! The error now is just about redirect URI configuration.

## ⚠️ Error:
```
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid.
```

This means the redirect URI your app is using isn't registered in Azure Portal.

## 📋 Solution: Add Redirect URIs to Azure

### Step 1: Open Azure Portal
1. Go to: https://portal.azure.com
2. Sign in with your Microsoft account

### Step 2: Find Your App Registration
1. Search for "App registrations" in the top search bar
2. Click on "App registrations"
3. Find and click on **"FIS POD"** (or your app name)

### Step 3: Add Redirect URIs
1. Click **"Authentication"** in the left sidebar
2. Under **"Single-page application"** platform, you should see existing redirect URIs

### Step 4: Add These Redirect URIs

**Add each of these (one at a time):**

1. **Production URL:**
   ```
   https://fis-he6w.vercel.app/signin
   ```

2. **Production Root:**
   ```
   https://fis-he6w.vercel.app
   ```

3. **Preview URLs** (if you see different preview URLs):
   - Check your Vercel deployments for preview URLs
   - Add them in format: `https://[preview-url]/signin`
   - Add root: `https://[preview-url]`

4. **Local Development:**
   ```
   http://localhost:3000/signin
   ```
   ```
   http://localhost:3000
   ```

### Step 5: Save and Wait
1. Click **"Save"** button
2. **Wait 5-10 minutes** for changes to propagate

### Step 6: Test Again
1. Visit: https://fis-he6w.vercel.app/signin
2. Click "Sign in with Microsoft"
3. Should work now! ✅

## 🎯 Quick Checklist:

- [ ] Added `https://fis-he6w.vercel.app/signin`
- [ ] Added `https://fis-he6w.vercel.app`
- [ ] Added `http://localhost:3000/signin`
- [ ] Added `http://localhost:3000`
- [ ] Saved changes
- [ ] Waited 5-10 minutes
- [ ] Tested sign-in again

## ⚠️ Important Notes:

1. **No trailing slashes** - Use `/signin` not `/signin/`
2. **Exact match required** - The URI must match exactly what your app sends
3. **HTTPS for production** - Must use `https://` not `http://` for Vercel URLs
4. **Propagation time** - Changes can take 5-10 minutes to take effect

---

**After adding these URIs and waiting a few minutes, Microsoft login should work!** 🚀

