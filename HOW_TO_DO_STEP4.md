# Step 4: Configure Environment Variables - Detailed Guide

## What You're Doing
You're adding your Supabase database connection keys to your project so it can connect to the database.

## Step-by-Step Instructions

### Part A: Get Your Supabase Keys

1. **Go to Supabase Dashboard**
   - Log into [supabase.com](https://supabase.com)
   - Select your project

2. **Navigate to API Settings**
   - Click **"Settings"** (gear icon) in the left sidebar
   - Click **"API"** under Project Settings

3. **Copy These 3 Values:**

   **a) Project URL**
   - Look for **"Project URL"**
   - Copy the entire URL (e.g., `https://abcdefghijklmnop.supabase.co`)
   - This is your `NEXT_PUBLIC_SUPABASE_URL`

   **b) anon/public key**
   - Look for **"Project API keys"**
   - Find **"anon"** or **"public"** key
   - Click the copy icon or select and copy
   - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (It starts with `eyJ...` and is very long)

   **c) service_role key**
   - In the same section, find **"service_role"** key
   - Click "Reveal" if it's hidden
   - Click the copy icon or select and copy
   - ⚠️ **Keep this secret!** Don't share it publicly
   - This is your `SUPABASE_SERVICE_ROLE_KEY`

### Part B: Add Keys to Your Project

1. **Create/Open `.env.local` File**
   - In your project folder (`/Users/samuelendale/Documents/FIS`)
   - Create a file named `.env.local` (if it doesn't exist)
   - Open it in a text editor

2. **Add the Following Lines:**

```env
# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=PASTE_YOUR_PROJECT_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# Microsoft Authentication (existing - keep these if you have them)
NEXT_PUBLIC_MSAL_CLIENT_ID=your_msal_client_id
NEXT_PUBLIC_MSAL_TENANT_ID=common
```

3. **Replace the Placeholder Values:**
   - Replace `PASTE_YOUR_PROJECT_URL_HERE` with your actual Project URL
   - Replace `PASTE_YOUR_ANON_KEY_HERE` with your actual anon key
   - Replace `PASTE_YOUR_SERVICE_ROLE_KEY_HERE` with your actual service_role key
   - Keep your Microsoft auth keys if you already have them

### Example (with fake values):

```env
# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE5OTI5MywiZXhwIjoxOTMxNzczMjkzfQ.example_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MTk5MjkzLCJleHAiOjE5MzE3NzMyOTN9.service_role_key_here

# Microsoft Authentication
NEXT_PUBLIC_MSAL_CLIENT_ID=90da75a4-0ce9-49a2-9ab9-79adaaf65b3a
NEXT_PUBLIC_MSAL_TENANT_ID=common
```

### Important Notes:

✅ **No spaces** around the `=` sign  
✅ **No quotes** around the values (unless the value itself contains spaces)  
✅ Keys are **very long** - make sure you copy the entire key  
✅ The file should be named **exactly** `.env.local` (starts with a dot!)

### Verify the File:

Your `.env.local` file should look like this:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...very_long_key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...very_long_key...
NEXT_PUBLIC_MSAL_CLIENT_ID=your_client_id
NEXT_PUBLIC_MSAL_TENANT_ID=common
```

### Save and Restart:

1. **Save** the `.env.local` file
2. **Restart your dev server** if it's running:
   - Stop it (Ctrl+C)
   - Start again: `npm run dev`

## Quick Checklist:

- [ ] Got Project URL from Supabase Settings → API
- [ ] Got anon/public key from Supabase Settings → API
- [ ] Got service_role key from Supabase Settings → API
- [ ] Created/opened `.env.local` file in project root
- [ ] Added all 3 Supabase variables
- [ ] Replaced placeholder values with actual keys
- [ ] Saved the file
- [ ] Restarted dev server (if running)

## Troubleshooting:

### "Supabase environment variables are not set"
- Make sure `.env.local` file exists in the project root
- Check that variable names are exactly correct (case-sensitive!)
- Make sure there are no extra spaces
- Restart your dev server after adding variables

### Can't find the keys in Supabase
- Make sure you're in the correct project
- Go to Settings → API (not Authentication)
- The keys are in the "Project API keys" section

### File not saving
- Make sure you named it `.env.local` (with the dot at the start)
- Make sure you're in the project root folder (`/Users/samuelendale/Documents/FIS`)

---

**Once you've added the keys and restarted the server, you're done with Step 4!** ✅

Next: Test the connection by uploading data!

