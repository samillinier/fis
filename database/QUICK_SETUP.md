# Quick Setup - Separate Visual and Survey Tables

## Step 1: Run the SQL Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click **"SQL Editor"** in the left sidebar

2. **Copy and Run the Migration**
   - Open the file: `database/separate-visual-survey-tables.sql`
   - Copy ALL the SQL code
   - Paste it into the Supabase SQL Editor
   - Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify Tables Were Created**
   - Go to **"Table Editor"** in Supabase
   - You should see these new tables:
     - ✅ `visual_data`
     - ✅ `survey_data`
     - ✅ `dashboard_metadata`
     - ✅ `users` (if it didn't exist)

## Step 2: Test It

1. **Upload Visual Data**
   - Upload a visual data file
   - Check `visual_data` table → Should see your data

2. **Upload Survey Data**
   - Upload a survey data file
   - Check `survey_data` table → Should see your data

3. **Refresh Page**
   - Data should load from both tables
   - No conflicts, clean separation!

## If You Get Errors

### Error: "relation 'visual_data' does not exist"
- **Solution**: Run the SQL migration first (Step 1)

### Error: "relation 'users' does not exist"
- **Solution**: The migration now creates the `users` table automatically

### Error: "relation 'workroom_data' does not exist"
- **Solution**: This is expected! The new system uses `visual_data` and `survey_data` instead of `workroom_data`

## What Changed

- ❌ **Old**: One table `workroom_data` (caused conflicts)
- ✅ **New**: Separate tables `visual_data` + `survey_data` (no conflicts)

The API routes are already updated to use the new tables. Just run the SQL migration and you're done!



