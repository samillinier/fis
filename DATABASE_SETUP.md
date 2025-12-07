# Database Setup Guide

## Step 1: Create Supabase Account and Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Fill in:
   - **Name**: `fis-dashboard` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for project to be ready

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `database/schema.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 4: Configure Environment Variables

1. Create/update `.env.local` file in your project root:

```env
# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Microsoft Authentication (existing)
NEXT_PUBLIC_MSAL_CLIENT_ID=your_msal_client_id
NEXT_PUBLIC_MSAL_TENANT_ID=common
```

2. Replace the values with your actual Supabase keys

## Step 5: Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` which we added to `package.json`.

## Step 6: Test the Connection

1. Start your dev server:
```bash
npm run dev
```

2. Upload some data in the app
3. Check Supabase dashboard → **Table Editor** → `workroom_data` table
4. You should see your data there!

## Troubleshooting

### "Supabase environment variables are not set"
- Make sure `.env.local` exists and has the correct values
- Restart your dev server after adding env variables

### "Unauthorized" errors
- Check that your API keys are correct
- Make sure you copied the full key (they're long!)

### Data not appearing in database
- Check browser console for errors
- Verify the API routes are working (check Network tab)
- Check Supabase logs in dashboard

### Row Level Security (RLS) blocking data
- The schema includes RLS policies
- For testing, you can temporarily disable RLS in Supabase dashboard
- Go to **Authentication** → **Policies** and disable if needed

## Next Steps

1. ✅ Database is set up
2. ✅ API routes are created
3. ⏳ Update components to use database API (next step)
4. ⏳ Test data persistence
5. ⏳ Deploy with database

## Important Notes

- **Free tier**: Supabase free tier includes 500MB database, 2GB bandwidth
- **Backup**: Supabase automatically backs up your database
- **Security**: Never commit `.env.local` to git (it's in `.gitignore`)
- **Production**: Use environment variables in your hosting platform (Vercel, etc.)

