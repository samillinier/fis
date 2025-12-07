# 🚀 Deploy to Vercel - Step by Step Guide

## ✅ Pre-Deployment Checklist

Before deploying, make sure:
- ✅ Database schema is run in Supabase
- ✅ All environment variables are ready
- ✅ Code is committed to GitHub (if using GitHub integration)

## 📋 Step 1: Prepare Environment Variables

You'll need these environment variables in Vercel:

### Microsoft Auth:
- `NEXT_PUBLIC_MSAL_CLIENT_ID` = `90da75a4-0ce9-49a2-9ab9-79adaaf65b3a`
- `NEXT_PUBLIC_MSAL_TENANT_ID` = `common`

### Supabase Database:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://idkuchtgrgooqixdjjcc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_Vqo7Xww4Go4iQJ7U44t9vQ_ZbZokbID`
- `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_1u_e0Fo-lp_LCy8Zjsw2nQ_7OWZqMBH`

## 🚀 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Sign in with GitHub (or create account)

2. **Import Project:**
   - Click **"Add New..."** → **"Project"**
   - Import from GitHub: `https://github.com/samillinier/fis`
   - Or click **"Deploy"** if you see your repo

3. **Configure Project:**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables:**
   - Click **"Environment Variables"** section
   - Add each variable:
     
     ```
     Name: NEXT_PUBLIC_MSAL_CLIENT_ID
     Value: 90da75a4-0ce9-49a2-9ab9-79adaaf65b3a
     Environment: Production, Preview, Development
     ```
     
     ```
     Name: NEXT_PUBLIC_MSAL_TENANT_ID
     Value: common
     Environment: Production, Preview, Development
     ```
     
     ```
     Name: NEXT_PUBLIC_SUPABASE_URL
     Value: https://idkuchtgrgooqixdjjcc.supabase.co
     Environment: Production, Preview, Development
     ```
     
     ```
     Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
     Value: sb_publishable_Vqo7Xww4Go4iQJ7U44t9vQ_ZbZokbID
     Environment: Production, Preview, Development
     ```
     
     ```
     Name: SUPABASE_SERVICE_ROLE_KEY
     Value: sb_secret_1u_e0Fo-lp_LCy8Zjsw2nQ_7OWZqMBH
     Environment: Production, Preview, Development
     ```

5. **Update Azure App Redirect URLs:**
   - After deployment, Vercel will give you a URL like: `https://your-app.vercel.app`
   - Go to Azure Portal → Your App Registration → Authentication
   - Add redirect URI: `https://your-app.vercel.app/signin`
   - Add redirect URI: `https://your-app.vercel.app`

6. **Deploy:**
   - Click **"Deploy"**
   - Wait for build to complete (2-3 minutes)
   - Your app will be live! 🎉

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd /Users/samuelendale/Documents/FIS
   vercel
   ```

4. **Follow prompts:**
   - Link to existing project or create new
   - Add environment variables when prompted
   - Deploy to production: `vercel --prod`

## ⚙️ Step 3: Configure Azure App Redirect URLs

After deployment, you'll get a Vercel URL. Add it to Azure:

1. **Go to Azure Portal:**
   - https://portal.azure.com
   - Azure Active Directory → App registrations → Your app

2. **Authentication Settings:**
   - Click **"Authentication"** (left menu)
   - Under **"Single-page application"** redirect URIs:
   - Add: `https://your-app.vercel.app/signin`
   - Add: `https://your-app.vercel.app`
   - Click **"Save"**

## 🔍 Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Sign in with Microsoft
3. Upload data
4. Verify it saves to database

## 📝 Important Notes:

### Environment Variables:
- **Public variables** (start with `NEXT_PUBLIC_`): Available in browser
- **Server variables** (like `SUPABASE_SERVICE_ROLE_KEY`): Only in API routes

### Database:
- Same Supabase database works for production
- No need to create new database
- All users will share the same database (filtered by user_id)

### Updates:
- Push to GitHub → Auto-deploys to Vercel
- Or use `vercel --prod` from CLI

## 🐛 Troubleshooting:

### Build Fails:
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors

### Authentication Fails:
- Verify Azure redirect URIs are correct
- Check environment variables in Vercel dashboard
- Verify `NEXT_PUBLIC_MSAL_CLIENT_ID` is set

### Database Errors:
- Verify Supabase environment variables
- Check database tables exist
- Verify service role key is correct

---

**Ready to deploy?** Follow Option A (Dashboard) for the easiest experience! 🚀

