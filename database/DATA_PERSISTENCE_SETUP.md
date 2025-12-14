# Data Persistence Setup Guide

## How to Execute the SQL Migration

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration
1. Open the file: `database/add-jsonb-data-column.sql`
2. Copy the entire SQL code
3. Paste it into the Supabase SQL Editor
4. Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Step 3: Verify
After running, you should see a success message. The `data_jsonb` column has been added to the `workroom_data` table.

## How Data Persistence Works

### Current Flow:
1. **Upload Data** → Data is saved to Supabase `workroom_data` table
2. **Page Refresh** → Data is automatically loaded from Supabase
3. **New Upload** → Old data is replaced with new data
4. **Data Stays** → Data persists in Supabase until you upload new files

### What Gets Saved:
- All workroom records (visual + survey data)
- File names (visual and survey)
- All fields including: company, installerName, poNumber, scores, cycle times, etc.

### Troubleshooting:
If data disappears on refresh:
1. Check browser console for error messages
2. Verify you're logged in (data is user-specific)
3. Check Supabase dashboard to see if data exists in `workroom_data` table
4. Verify the migration was run successfully

