# 🚨 Immediate Fix: Redirect URI Error

## The Problem:

The redirect URI being sent doesn't match what's registered in Azure Portal.

## 🔍 What the App is Sending:

Your app sends: `https://fis-he6w.vercel.app/signin`

## ✅ Solution: Exact Match Required

### Step 1: Verify in Azure Portal

1. Go to: https://portal.azure.com
2. Azure AD → App registrations → "FIS POD"
3. Authentication → Single-page application

### Step 2: Check if This EXACT URI Exists:

```
https://fis-he6w.vercel.app/signin
```

**Requirements:**
- ✅ Must be EXACTLY this (character-for-character)
- ✅ No trailing slash
- ✅ Lowercase `https://`
- ✅ Platform type: **"Single-page application"**

### Step 3: If It's Not There, Add It:

1. Click **"+ Add Redirect URI"**
2. **Platform:** Select "Single-page application"
3. **URI:** Type exactly: `https://fis-he6w.vercel.app/signin`
4. Click **"Add"**
5. Click **"Save"** at the top

### Step 4: Also Add Root URL:

Add this one too (some auth flows use it):

1. Click **"+ Add Redirect URI"** again
2. **Platform:** Select "Single-page application"
3. **URI:** Type exactly: `https://fis-he6w.vercel.app`
4. Click **"Add"**
5. Click **"Save"** at the top

### Step 5: Wait & Test

1. **Wait 10-15 minutes** (Azure needs time to update)
2. Clear your browser cache
3. Try sign-in again

## ⚠️ Common Mistakes:

### ❌ Wrong Platform Type
- Not "Single-page application" → Won't work!

### ❌ Trailing Slash
- ❌ `https://fis-he6w.vercel.app/signin/` (wrong)
- ✅ `https://fis-he6w.vercel.app/signin` (correct)

### ❌ Wrong Protocol
- ❌ `http://fis-he6w.vercel.app/signin` (wrong - missing 's')
- ✅ `https://fis-he6w.vercel.app/signin` (correct)

### ❌ Case Sensitivity
- Must be lowercase `https://`

## 📋 Final Checklist:

In Azure Portal, under "Single-page application", you MUST have:

- [ ] `https://fis-he6w.vercel.app/signin` ← **This one is critical!**
- [ ] `https://fis-he6w.vercel.app`
- [ ] `http://localhost:3000/signin` (for local dev)
- [ ] `http://localhost:3000` (for local dev)

## 🔍 Still Not Working?

### Try This:

1. **Delete all redirect URIs**
2. **Add them back one by one:**
   - Start with: `https://fis-he6w.vercel.app/signin`
   - Then add: `https://fis-he6w.vercel.app`
3. **Save**
4. **Wait 15 minutes**
5. **Test in incognito window**

### Check Browser Console:

1. Open: https://fis-he6w.vercel.app/signin
2. Press **F12**
3. **Console** tab
4. Click sign-in
5. Look for any errors showing the redirect_uri value

---

**The URI must be EXACTLY: `https://fis-he6w.vercel.app/signin` in Azure Portal!** 🎯

