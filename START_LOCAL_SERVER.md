# 🚀 Start Local Development Server

## ✅ Your Server is Running!

The development server is active on port 3000.

## 🌐 Access Your App:

- **Dashboard**: http://localhost:3000
- **Sign-In**: http://localhost:3000/signin

## 🔧 If You Need to Restart:

### Stop the Current Server:
1. Go to the terminal where `npm run dev` is running
2. Press `Ctrl + C`

### Start Fresh:
```bash
cd /Users/samuelendale/Documents/FIS
npm run dev
```

## 📍 Local URLs:

- **Main Dashboard**: http://localhost:3000
- **Sign-In Page**: http://localhost:3000/signin  
- **Workroom Data**: http://localhost:3000/analytics
- **Survey Misc**: http://localhost:3000/survey-misc
- **Workroom Summary**: http://localhost:3000/workroom-summary

## ⚠️ If You See Errors:

1. **Check the terminal** where the server is running for error messages
2. **Check browser console** (F12) for JavaScript errors
3. **Restart the server** if needed:
   ```bash
   # Stop server (Ctrl+C)
   # Then start again
   npm run dev
   ```

## ✅ Microsoft Sign-In Locally:

Your local app should work with Microsoft sign-in because:
- ✅ Redirect URI `http://localhost:3000/signin` is already in Azure Portal
- ✅ Environment variables are in `.env.local`

---

**Open http://localhost:3000 in your browser!** 🎉

