# Separate Visual and Survey Data Tables Setup

## Overview
This creates separate database tables for visual data and survey data to avoid conflicts and ensure proper data separation.

## Tables Created

### 1. `visual_data`
- Stores visual/operational data (sales, labor PO, vendor debits, cycle times)
- Each record has a `data_jsonb` column with complete workroom data

### 2. `survey_data`
- Stores survey data (LTR, Craft, Prof scores, survey details)
- Each record has a `data_jsonb` column with complete survey data

### 3. `dashboard_metadata`
- Stores DashboardData-level metadata (raw arrays, Excel file info)
- One record per user

## How It Works

### When Data is Uploaded:
1. **Visual Data Upload** → Saved to `visual_data` table
2. **Survey Data Upload** → Saved to `survey_data` table
3. **Metadata** → Saved to `dashboard_metadata` table
4. **Old data is deleted** before new data is inserted (per table)

### When Data is Loaded:
1. Load from `visual_data` table → Returns visual workrooms
2. Load from `survey_data` table → Returns survey workrooms
3. Load from `dashboard_metadata` table → Returns metadata
4. Combine in frontend (but keep separate in database)

### Key Benefits:
- ✅ **No Merging** - Visual and survey data stay completely separate
- ✅ **No Conflicts** - Each type has its own table
- ✅ **Clean Separation** - Easy to manage and query
- ✅ **Smooth Replacement** - Old data deleted, new data inserted

## Setup Instructions

1. **Run the SQL migration:**
   ```sql
   -- Copy and paste the contents of database/separate-visual-survey-tables.sql
   -- into your Supabase SQL Editor and run it
   ```

2. **Verify tables were created:**
   - Go to Supabase Dashboard → Table Editor
   - You should see:
     - `visual_data`
     - `survey_data`
     - `dashboard_metadata`

3. **Test the API:**
   - Upload visual data → Check `visual_data` table
   - Upload survey data → Check `survey_data` table
   - Refresh page → Data should load from both tables

## Migration Notes

- The old `workroom_data` table is not deleted (for safety)
- New uploads will use the new separate tables
- Old data in `workroom_data` will not be automatically migrated
- You can manually migrate old data if needed

## Data Flow

```
Upload Visual Data → DELETE old from visual_data → INSERT new to visual_data
Upload Survey Data → DELETE old from survey_data → INSERT new to survey_data

Page Load → GET from visual_data + survey_data → Combine in frontend → Display
```



