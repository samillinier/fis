# How to Verify Redirect URI is Correct

## ✅ Verification Methods

### Method 1: Test the Endpoint Directly

The redirect URI `https://pod.floorinteriorservices.com/api/quickbooks/callback` should be accessible.

**Test it:**
1. Open browser and go to: `https://pod.floorinteriorservices.com/api/quickbooks/callback`
2. **Expected behavior:** It should redirect to `/finance-hub?error=missing_parameters` (because there are no OAuth parameters)
3. **This confirms:** The endpoint exists and is working ✅

**Or use curl:**
```bash
curl -I https://pod.floorinteriorservices.com/api/quickbooks/callback
```
**Expected:** HTTP 307 redirect (this is correct - it redirects when no OAuth params)

### Method 2: Check Browser Console

1. Go to: `https://pod.floorinteriorservices.com/finance-hub`
2. Press **F12** → **Console** tab
3. Click "Connect to QuickBooks"
4. Look for the log: `Redirect URI: https://pod.floorinteriorservices.com/api/quickbooks/callback`
5. **Copy this exact value**

### Method 3: Verify in Intuit Dashboard

1. Go to: https://developer.intuit.com/app/developer/dashboard
2. Select app: **FISPOD**
3. Go to **Settings** → **Redirect URIs** → **Development** tab
4. **Check if this URI is listed:**
   ```
   https://pod.floorinteriorservices.com/api/quickbooks/callback
   ```
5. **Compare character-by-character:**
   - ✅ Starts with `https://`
   - ✅ Domain: `pod.floorinteriorservices.com`
   - ✅ Path: `/api/quickbooks/callback`
   - ✅ No trailing slash
   - ✅ All lowercase

### Method 4: Check Network Tab

1. Go to: `https://pod.floorinteriorservices.com/finance-hub`
2. Press **F12** → **Network** tab
3. Click "Connect to QuickBooks"
4. Look for request to `appcenter.intuit.com`
5. Click on it → **Headers** tab
6. Check the **redirect_uri** parameter in the URL
7. It should be: `https://pod.floorinteriorservices.com/api/quickbooks/callback`

### Method 5: Verify Code Configuration

**Frontend (FinanceHub.tsx):**
```typescript
const PRODUCTION_DOMAIN = 'https://pod.floorinteriorservices.com'
const REDIRECT_URI = `${PRODUCTION_DOMAIN}/api/quickbooks/callback`
// Result: https://pod.floorinteriorservices.com/api/quickbooks/callback ✅
```

**Backend (callback/route.ts):**
```typescript
const PRODUCTION_DOMAIN = 'https://pod.floorinteriorservices.com'
const REDIRECT_URI = `${PRODUCTION_DOMAIN}/api/quickbooks/callback`
// Result: https://pod.floorinteriorservices.com/api/quickbooks/callback ✅
```

## ✅ Current Status

Based on the test:
- ✅ **Endpoint exists:** `https://pod.floorinteriorservices.com/api/quickbooks/callback`
- ✅ **Endpoint responds:** Returns HTTP 307 (redirects when no OAuth params - this is correct)
- ✅ **Code uses correct domain:** `pod.floorinteriorservices.com`
- ✅ **Path is correct:** `/api/quickbooks/callback`

## ⚠️ What to Verify in Intuit Dashboard

The redirect URI must be **exactly** registered in Intuit Dashboard:

1. **Settings** → **Redirect URIs** → **Development** tab
2. Should see: `https://pod.floorinteriorservices.com/api/quickbooks/callback`
3. **Must match exactly:**
   - Same domain: `pod.floorinteriorservices.com`
   - Same path: `/api/quickbooks/callback`
   - Same protocol: `https://`
   - No trailing slash
   - Exact case (all lowercase)

## 🔍 Quick Verification Checklist

- [ ] Endpoint is accessible (test in browser)
- [ ] Browser console shows correct redirect URI
- [ ] Intuit Dashboard has the exact same URI
- [ ] Code uses the same domain (`pod.floorinteriorservices.com`)
- [ ] No trailing slash anywhere
- [ ] All lowercase

## 📋 Summary

**Your redirect URI is correct if:**
1. ✅ The endpoint exists and responds (it does - tested)
2. ✅ It's registered in Intuit Dashboard (you need to verify this)
3. ✅ The code uses the same URI (it does)
4. ✅ It matches exactly (character-by-character)

The redirect URI `https://pod.floorinteriorservices.com/api/quickbooks/callback` is **correct** based on the code and endpoint test. The only thing to verify is that it's **registered in Intuit Dashboard** with the exact same value.
