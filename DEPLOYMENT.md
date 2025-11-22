# Deployment Guide

## Recommended: Deploy to Vercel

### Prerequisites
- GitHub account (your code should be pushed to GitHub)
- Vercel account (free at [vercel.com](https://vercel.com))

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Log in with your GitHub account

3. **Import your project**:
   - Click "Add New Project"
   - Select your GitHub repository (`fis`)
   - Vercel will auto-detect Next.js settings

4. **Configure Project** (usually auto-detected):
   - Framework Preset: Next.js
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Your app will be live at `your-project-name.vercel.app`

6. **Optional - Custom Domain**:
   - Go to Project Settings → Domains
   - Add your custom domain

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No** (first time) or **Yes** (updates)
   - Project name: `fis-dashboard` (or your preferred name)
   - Directory: `./` (press Enter)
   - Override settings? **No**

4. **Production Deployment**:
   ```bash
   vercel --prod
   ```

## Alternative Platforms

### Deploy to Netlify

1. **Push to GitHub** (if not already)
2. **Go to [netlify.com](https://netlify.com)**
3. **Click "Add new site" → "Import an existing project"**
4. **Connect GitHub and select your repository**
5. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. **Click "Deploy site"**

### Deploy to Railway

1. **Push to GitHub**
2. **Go to [railway.app](https://railway.app)**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Add a `railway.json` file** (optional, auto-detects Next.js)
6. **Railway will auto-deploy**

## Important Notes

### Data Persistence
- ⚠️ **Current Setup**: Your app uses `localStorage` for data persistence
- This means uploaded data is stored **client-side only** in the browser
- Data will **not persist** if user clears browser data or uses a different device
- For production with data persistence, consider:
  - Adding a backend API
  - Using a database (PostgreSQL, MongoDB, etc.)
  - Implementing user accounts with cloud storage

### Environment Variables (if needed later)
If you need environment variables:
1. Go to Vercel Project Settings → Environment Variables
2. Add any required variables
3. Redeploy

### Build Optimization
The app should build fine as-is. If you encounter issues:
- Make sure all dependencies are in `package.json`
- Check build logs in Vercel dashboard
- Test locally with `npm run build` first

## Post-Deployment Checklist

- [ ] Test the deployed app
- [ ] Verify file upload works
- [ ] Test authentication (sign in/sign up)
- [ ] Check all pages load correctly
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Enable analytics (optional, in Vercel dashboard)

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure `package.json` has all dependencies
- Test build locally: `npm run build`

### App Not Loading
- Check Vercel deployment logs
- Verify all routes are working
- Check browser console for errors

### Authentication Issues
- Verify `localStorage` is enabled in browser
- Check AuthContext is working correctly

## Need Help?
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

