# Quick Key Setup Guide

## The Keys You Need from Supabase:

### 📍 Location: Supabase Dashboard → Settings → API

You need **3 things**:

1. **Project URL**
   - Format: `https://xxxxx.supabase.co`
   - Example: `https://abcdefghijklmnop.supabase.co`

2. **anon/public Key** 
   - Format: JWT token starting with `eyJ...`
   - Very long (200+ characters)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...`

3. **service_role Key**
   - Format: JWT token starting with `eyJ...`
   - Very long (200+ characters)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...`

## The Keys You Provided:

The keys you shared:
- `sb_publishable_Vqo7Xww4Go4iQJ7U44t9vQ_ZbZokbID`
- `sb_secret_1u_e0Fo-lp_LCy8Zjsw2nQ_7OWZqMBH`

These **don't match** the standard Supabase format. They might be:
- From a different database service
- Custom API keys
- Or from a different section

## What to Do:

1. Go to your Supabase project
2. Click **Settings** → **API**
3. Look for the section that shows:
   - **Project URL** (a URL like `https://xxx.supabase.co`)
   - **Project API keys** with:
     - `anon` or `public` key (very long JWT token)
     - `service_role` key (very long JWT token)

4. Copy those 3 values and share them, or add them to `.env.local`

## Once You Have the Correct Keys:

Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...very_long_jwt_token...
SUPABASE_SERVICE_ROLE_KEY=eyJ...very_long_jwt_token...
```

---

**Can you share your Supabase Project URL and the JWT token keys?** 

Or let me know if you're using a different database service!

