# Step 3: Set Up Database Schema - Detailed Guide

## What You're Doing
You're creating the database tables that will store your workroom data. This is like creating the structure/folders where your data will live.

## Step-by-Step Instructions

### 1. Open SQL Editor in Supabase

1. Log into your Supabase project at [supabase.com](https://supabase.com)
2. In the left sidebar, click on **"SQL Editor"** (it has a database icon)
3. You should see a code editor appear

### 2. Create a New Query

1. Click the **"New Query"** button (usually at the top of the SQL Editor)
2. A new blank query window will open

### 3. Copy the Schema File

1. Open the file `database/schema.sql` from your project
2. **Select ALL** the text in that file (Cmd/Ctrl + A)
3. **Copy** it (Cmd/Ctrl + C)

The file contains SQL commands that create:
- Users table
- Workroom data table  
- Historical data table
- Indexes for performance
- Security policies

### 4. Paste into Supabase

1. Go back to Supabase SQL Editor
2. **Paste** the copied SQL into the query window (Cmd/Ctrl + V)
3. You should see all the SQL code appear

### 5. Run the Query

1. Click the **"Run"** button (or press **Cmd + Enter** on Mac, **Ctrl + Enter** on Windows)
2. Wait a few seconds
3. You should see: **"Success. No rows returned"** ✅

### 6. Verify Tables Were Created

1. In the left sidebar, click **"Table Editor"**
2. You should see 3 new tables:
   - ✅ `users`
   - ✅ `workroom_data`
   - ✅ `historical_data`

## What If Something Goes Wrong?

### Error: "relation already exists"
- This means tables already exist - that's okay! 
- You can continue to the next step

### Error: "permission denied"
- Make sure you're logged into the correct Supabase project
- Check that you have owner/admin access

### Error: "syntax error"
- Make sure you copied the ENTIRE file (including all lines)
- Try copying again from `database/schema.sql`

## Visual Guide

```
Supabase Dashboard
  ├── SQL Editor (click here)
  │   ├── New Query (click)
  │   ├── Paste schema.sql content
  │   └── Run button (click)
  │
  └── Table Editor (verify tables created)
      ├── users ✅
      ├── workroom_data ✅
      └── historical_data ✅
```

## Quick Checklist

- [ ] Opened Supabase dashboard
- [ ] Clicked "SQL Editor" 
- [ ] Clicked "New Query"
- [ ] Copied entire `database/schema.sql` file
- [ ] Pasted into Supabase query window
- [ ] Clicked "Run" 
- [ ] Saw "Success. No rows returned"
- [ ] Verified tables exist in "Table Editor"

## Next Step

Once you see the 3 tables in "Table Editor", move to **Step 4: Configure Environment Variables**!

