# ✅ Vercel Environment Variables Checklist

## Your Vercel URL: https://pod.floorinteriorservices.com

## 🔍 Check These 5 Environment Variables:

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Make sure ALL of these are set:

### 1. Microsoft Authentication:
```
Name: NEXT_PUBLIC_MSAL_CLIENT_ID
Value: 90da75a4-0ce9-49a2-9ab9-79adaaf65b3a
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: NEXT_PUBLIC_MSAL_TENANT_ID
Value: common
Environments: ✅ Production ✅ Preview ✅ Development
```

### 2. Supabase Database:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://idkuchtgrgooqixdjjcc.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: <REDACTED_ANON_KEY>
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: <REDACTED_SERVICE_ROLE_KEY>
Environments: ✅ Production ✅ Preview ✅ Development
```

## ⚠️ Important:

- After adding/updating variables, you **MUST redeploy**
- Go to **Deployments** → Latest deployment → **"..."** → **Redeploy**
- Wait 2-3 minutes for redeploy to complete

## 🔗 Quick Links:

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your App**: https://pod.floorinteriorservices.com
- **Sign-In Page**: https://pod.floorinteriorservices.com/signin

## ✅ Checklist:

- [ ] All 5 environment variables are added
- [ ] All variables are enabled for Production environment
- [ ] Redeployed after adding variables
- [ ] Checked browser console for errors (F12)
- [ ] Checked Vercel build logs for errors

---

**If all variables are set and still not working, check browser console (F12) for JavaScript errors!**

