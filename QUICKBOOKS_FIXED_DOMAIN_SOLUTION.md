# QuickBooks Fixed Domain Solution

## The Problem
Each Vercel deployment gets a different preview URL, so the redirect URI keeps changing. Intuit requires a **fixed, stable URL**.

## Solutions

### Solution 1: Use Production Domain (Recommended)

Vercel gives you a **stable production domain** that doesn't change. Use that instead of preview URLs.

#### Step 1: Find Your Production Domain

1. Go to Vercel Dashboard → Your Project
2. Look at the top - you'll see your **Production Domain**
3. It should be something like:
   - `fis-bcbs9n06m-samilliniers-projects.vercel.app` (this is your production domain)
   - OR you might have a custom domain

#### Step 2: Use Production Domain for QuickBooks

**In Intuit Dashboard:**
1. Go to Keys & OAuth
2. Add this **ONE** redirect URI (your production domain):
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```
3. **Remove** any preview URLs
4. Save

**In Vercel Environment Variables:**
1. Go to Settings → Environment Variables
2. Set `QUICKBOOKS_REDIRECT_URI` to:
   ```
   https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback
   ```
3. Make sure it's enabled for **Production** environment
4. Save

#### Step 3: Always Test on Production Domain

- ✅ Use: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
- ❌ Don't use: Preview URLs (they change every deployment)

### Solution 2: Use Custom Domain (Best for Production)

If you have a custom domain:

1. **Add Custom Domain in Vercel:**
   - Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain (e.g., `fis.yourdomain.com`)
   - Follow Vercel's instructions to configure DNS

2. **Use Custom Domain in Intuit:**
   ```
   https://fis.yourdomain.com/api/quickbooks/callback
   ```

3. **Update Environment Variable:**
   - Set `QUICKBOOKS_REDIRECT_URI` to your custom domain

### Solution 3: Use Environment Variable for Fixed URL

We can update the code to always use a fixed URL from environment variables instead of constructing it dynamically.

## Recommended: Use Production Domain

For now, the easiest solution is to:

1. **Always use your production domain** for QuickBooks:
   - `https://fis-bcbs9n06m-samilliniers-projects.vercel.app`

2. **Set this in Intuit Dashboard** (one time, never changes)

3. **Set this in Vercel Environment Variables** (one time)

4. **Test only on production domain**, not preview URLs

## Quick Setup

### 1. Intuit Dashboard
- Add redirect URI: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`
- Save

### 2. Vercel Environment Variables
- Key: `QUICKBOOKS_REDIRECT_URI`
- Value: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/api/quickbooks/callback`
- Environments: ✅ Production only (or all if you want)
- Save

### 3. Update Code to Use Fixed URL

The code should use the environment variable instead of constructing from `window.location.origin`.

## Testing

After setup:
1. Always test on: `https://fis-bcbs9n06m-samilliniers-projects.vercel.app/finance-hub`
2. Don't test on preview URLs
3. The redirect URI will now always match!
