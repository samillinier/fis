# 📝 How to Run SQL Schema - Step by Step

## Step 2: Run the SQL Schema

Since you're using Supabase (through Vercel), here's how to run the schema:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Click "Open in Supabase" button** (top right of your database page)
   - This opens your database in the Supabase Dashboard

2. **In Supabase Dashboard:**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"** button (or the "+ New" button)

3. **Paste the SQL:**
   - Copy the entire SQL from `database/vercel-postgres-schema.sql`
   - Paste it into the SQL Editor

4. **Run the SQL:**
   - Click **"Run"** button (or press Cmd/Ctrl + Enter)
   - You should see: ✅ "Success" or "Success. No rows returned"

5. **Verify Tables Created:**
   - Click **"Table Editor"** in the left sidebar
   - You should see **3 new tables:**
     - ✅ `users`
     - ✅ `workroom_data`
     - ✅ `historical_data`

### Method 2: Using Vercel's SQL Editor (If Available)

If Vercel provides a direct SQL Editor:

1. In your Vercel database page, look for **"SQL Editor"** tab
2. Paste the SQL from `database/vercel-postgres-schema.sql`
3. Click **"Run"** or press Cmd/Ctrl + Enter
4. Verify tables in the **"Tables"** tab

## 📋 The SQL to Run:

The complete SQL is in `database/vercel-postgres-schema.sql` in your project.

---

**Quick Tip:** The SQL will create 3 tables and indexes. It's safe to run multiple times (uses `IF NOT EXISTS`).

