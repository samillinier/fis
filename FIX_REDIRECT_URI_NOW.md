# 🔧 Fix Redirect URI Error - Immediate Steps

## The Error You're Seeing:

```
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid.
```

## 🔍 Step 1: Find What Redirect URI is Being Sent

Let's check what the app is actually sending:

1. **Open Browser Developer Tools:**
   - Go to: https://fis-he6w.vercel.app/signin
   - Press **F12** (or Cmd+Option+I on Mac)
   - Click **"Network"** tab

2. **Try Sign-In:**
   - Click "Sign in with Microsoft"
   - Watch the Network tab

3. **Find the Request:**
   - Look for a request to `login.microsoftonline.com` or `login.live.com`
   - Click on it
   - Look at the **Request URL** or **Query String Parameters**
   - Find the `redirect_uri` parameter

4. **Copy the EXACT redirect_uri value:**
   - It might look like: `https://fis-he6w.vercel.app/signin`
   - Copy it EXACTLY as shown (including any special characters)

## ✅ Step 2: Verify in Azure Portal

1. Go to: https://portal.azure.com
2. Azure AD → App registrations → "FIS POD"
3. Authentication → Single-page application

4. **Check if the EXACT URI from Step 1 is listed:**
   - It must match character-for-character
   - Case-sensitive
   - No extra spaces

## 🔧 Step 3: Common Issues & Fixes

### Issue 1: URI Not Matching Exactly

**Check:**
- Does it have `https://` (not `http://`)?
- Does it have `/signin` at the end?
- Any trailing slashes?
- Any special characters or encoding?

**Fix:**
- Add the EXACT URI from Step 1 to Azure Portal
- Make sure platform type is **"Single-page application"**

### Issue 2: Wrong Platform Type

**Check:**
- Is it under "Single-page application" section?
- Not "Web" or "Mobile/Desktop"

**Fix:**
- If it's under wrong section, delete it
- Add it again under "Single-page application"

### Issue 3: Changes Not Propagated

**Check:**
- When did you add the URI?
- Did you click "Save"?

**Fix:**
- Wait **10-15 minutes** (sometimes takes longer)
- Clear browser cache
- Try incognito/private window

### Issue 4: Redirect URI Format

The app sends: `window.location.origin + '/signin'`

So from `https://fis-he6w.vercel.app/signin`, it should send:
- `https://fis-he6w.vercel.app/signin`

Make sure this EXACT value is in Azure Portal.

## 🎯 Quick Action Items:

1. [ ] Check Network tab to see what redirect_uri is being sent
2. [ ] Verify that EXACT URI is in Azure Portal
3. [ ] Check platform type is "Single-page application"
4. [ ] Wait 10-15 minutes if you just added it
5. [ ] Clear browser cache and try again
6. [ ] Try incognito/private window

## 📋 Double-Check Your Azure Configuration:

**Must Have (all 4):**
- [ ] `https://fis-he6w.vercel.app/signin`
- [ ] `https://fis-he6w.vercel.app`
- [ ] `http://localhost:3000/signin`
- [ ] `http://localhost:3000`

**All must be:**
- Platform type: **"Single-page application"**
- No trailing slashes
- Exact match (case-sensitive)

---

**Start with Step 1 - check the Network tab to see what redirect_uri is actually being sent!** 🔍

