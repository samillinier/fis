# 🔄 How to Restart Your Server

## Current Status:

The server is running on port 3000, but you're seeing an Internal Server Error.

## ✅ Restart Steps:

### Option 1: Restart in Terminal (Recommended)

1. **Find the terminal where `npm run dev` is running**
   - Look for the terminal window showing Next.js output
   - You should see messages like "Ready on http://localhost:3000"

2. **Stop the server:**
   - Press `Ctrl + C` (or `Cmd + C` on Mac)
   - Wait for it to stop

3. **Start it again:**
   ```bash
   npm run dev
   ```

### Option 2: Kill and Restart (If Ctrl+C doesn't work)

If the server won't stop with Ctrl+C:

```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Then start again
npm run dev
```

### Option 3: Use a New Terminal Window

1. Open a new terminal window
2. Run:
   ```bash
   cd /Users/samuelendale/Documents/FIS
   lsof -ti:3000 | xargs kill -9 2>/dev/null
   npm run dev
   ```

## ✅ After Restart:

1. Wait for the server to start (you'll see "Ready on http://localhost:3000")
2. Open http://localhost:3000 in your browser
3. Check if the error is gone

## 🔍 If Error Persists:

Check the terminal output for error messages and share them!

---

**The fixes I made should prevent the initialization error. Just restart the server!**

