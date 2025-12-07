# 🔄 Alternative Ways to Set Up Database Schema

Since you're having trouble with the SQL Editor, here are other methods:

## Method 1: Supabase Dashboard - Table Editor (Manual)

**Create tables one by one using the UI:**

### Step 1: Create `users` table
1. Supabase Dashboard → Table Editor → "New Table"
2. Name: `users`
3. Add columns:
   - `id` - UUID, Primary Key, Default: `gen_random_uuid()`
   - `email` - Text, Unique, Not Null
   - `name` - Text, Nullable
   - `created_at` - Timestamp, Default: `now()`
   - `updated_at` - Timestamp, Default: `now()`

### Step 2: Create `workroom_data` table
1. New Table → Name: `workroom_data`
2. Add columns (see schema.sql for full list)
3. Add Foreign Key: `user_id` → References `users(id)`

### Step 3: Create `historical_data` table
1. New Table → Name: `historical_data`
2. Add columns (see schema.sql)

**⚠️ This is tedious - Method 2 is easier!**

---

## Method 2: Copy-Paste SQL (Simplified)

**Instead of the full schema, run these 3 simple commands:**

### Quick Setup SQL (Copy this):

```sql
-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create workroom_data table
CREATE TABLE IF NOT EXISTS workroom_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workroom_name TEXT NOT NULL,
  store TEXT,
  sales NUMERIC(15, 2),
  labor_po NUMERIC(15, 2),
  vendor_debit NUMERIC(15, 2),
  category TEXT,
  cycle_time INTEGER,
  ltr_score NUMERIC(5, 2),
  craft_score NUMERIC(5, 2),
  prof_score NUMERIC(5, 2),
  survey_date DATE,
  survey_comment TEXT,
  labor_category TEXT,
  reliable_home_improvement_score NUMERIC(5, 2),
  time_taken_to_complete INTEGER,
  project_value_score NUMERIC(5, 2),
  installer_knowledge_score NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create historical_data table
CREATE TABLE IF NOT EXISTS historical_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  upload_date DATE NOT NULL,
  week TEXT NOT NULL,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  data JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workroom_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;

-- 6. Create policies
CREATE POLICY "Service role full access workroom_data" ON workroom_data
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access historical_data" ON historical_data
  FOR ALL USING (true) WITH CHECK (true);
```

**Steps:**
1. Copy the SQL above
2. Supabase Dashboard → SQL Editor → New Query
3. Paste
4. Click "Run"

---

## Method 3: Use Supabase CLI (If Installed)

If you have Supabase CLI:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref idkuchtgrgooqixdjjcc

# Run migration
supabase db push
```

**But you'd need to set up migrations first - this is more complex.**

---

## Method 4: Use Vercel's Database UI

Since you have Supabase through Vercel:

1. **Vercel Dashboard → Storage → `fis-database`**
2. Click **"Open in Supabase"** button
3. This opens Supabase Dashboard
4. Then use Method 2 (copy-paste SQL)

---

## Method 5: Test Without Schema First

**Just to verify connection works:**

1. Visit: `https://your-app.vercel.app/api/db-check`
2. It will tell you if tables are missing
3. Then you know you need to run the schema

---

## ⚡ Easiest Method: Simplified SQL Above

**I recommend Method 2** - just copy the simplified SQL I provided above and paste it into Supabase SQL Editor. It's the same as the full schema but formatted for easy copy-paste.

---

## Still Having Issues?

**Tell me:**
1. What happens when you try to open Supabase SQL Editor?
2. Do you see any error messages?
3. Can you access: https://supabase.com/dashboard/project/idkuchtgrgooqixdjjcc ?

I can help troubleshoot the specific issue you're facing!

