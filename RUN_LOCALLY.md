# 🚀 Run Application Locally

## Your App is Already Running! ✅

The development server is running on port 3000.

## 🌐 Access Your Local App:

**Open in browser:**
- **Main Dashboard**: http://localhost:3000
- **Sign-In Page**: http://localhost:3000/signin

## 📋 If Server is Not Running:

### Start the Development Server:

```bash
cd /Users/samuelendale/Documents/FIS
npm run dev
```

### Stop the Server:

Press `Ctrl + C` in the terminal where the server is running.

### Check if Server is Running:

```bash
# Check if port 3000 is in use
lsof -ti:3000
```

If it returns a number, the server is running.

## 🔧 Troubleshooting:

### Port Already in Use:

If you get an error that port 3000 is already in use:

**Option 1: Stop the existing server**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

**Option 2: Run on different port**
```bash
npm run dev -- -p 3001
```
Then access at: http://localhost:3001

### Missing Dependencies:

If you get module errors:
```bash
npm install
```

### Environment Variables:

Make sure `.env.local` file exists with:
- `NEXT_PUBLIC_MSAL_CLIENT_ID`
- `NEXT_PUBLIC_MSAL_TENANT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Quick Commands:

```bash
# Start server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Install dependencies
npm install
```

## 🎯 Local URLs:

- **Dashboard**: http://localhost:3000
- **Sign-In**: http://localhost:3000/signin
- **Workroom Data**: http://localhost:3000/analytics
- **Survey Misc**: http://localhost:3000/survey-misc
- **Workroom Summary**: http://localhost:3000/workroom-summary

---

**Your server should be running at: http://localhost:3000** 🎉

