# Complete Data Replacement Logic

## Overview

**Every upload completely replaces ALL previous data for that user. NO data is preserved.**

This ensures:
- ✅ No data collisions
- ✅ Clean, up-to-date data
- ✅ No duplicate records
- ✅ No orphaned data

## How It Works

### Step 1: Count Existing Records
Before deleting, the system counts how many records exist:
- Visual data records
- Survey data records  
- Dashboard metadata records

### Step 2: Delete ALL Previous Data
The system deletes **EVERY** record for the user:
```typescript
// Delete ALL visual_data for this user
DELETE FROM visual_data WHERE user_id = userId

// Delete ALL survey_data for this user
DELETE FROM survey_data WHERE user_id = userId

// Delete ALL dashboard_metadata for this user
DELETE FROM dashboard_metadata WHERE user_id = userId
```

### Step 3: Verify Delete Succeeded
After delete, the system verifies that **ZERO records remain**:
- If any records still exist → **Upload is ABORTED**
- If delete failed → **Upload is ABORTED**
- Only if count = 0 → Proceed to insert

### Step 4: Insert New Data
Only after successful delete and verification:
- Insert new visual data
- Insert new survey data
- Insert new metadata

## Safety Features

1. **Delete errors stop the upload** - If delete fails, no new data is inserted
2. **Verification prevents data accumulation** - If records remain after delete, upload is aborted
3. **Complete replacement** - Old data is completely removed before new data is added
4. **No partial updates** - It's all or nothing - either complete replacement or no change

## Database Requirements

For this to work properly, RLS (Row Level Security) must be **DISABLED** on these tables:
- `visual_data`
- `survey_data`
- `dashboard_metadata`

Run this SQL to ensure deletes work:
```sql
ALTER TABLE visual_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metadata DISABLE ROW LEVEL SECURITY;
```

See: `database/ensure-delete-works.sql`

## Log Messages

You'll see these log messages during upload:

```
🗑️ [DELETE ALL] Starting complete data deletion for user_id: ...
📊 [DELETE ALL] Records to delete: X visual, Y survey, Z metadata
🗑️ [DELETE ALL] Executing delete operations...
🔍 [DELETE ALL] Verifying all records were deleted...
📊 [DELETE ALL] Records after delete: 0 visual, 0 survey, 0 metadata
✅ [DELETE ALL] SUCCESS: All previous data completely removed
✅ [DELETE ALL] Ready to insert fresh data.
```

If delete fails, you'll see:
```
❌ [DELETE ALL] CRITICAL ERROR: Failed to delete...
❌ [DELETE ALL] VERIFICATION FAILED: X records STILL EXIST after delete!
```

## Important Notes

- **This is intentional** - Every upload is a complete replacement
- **No history is kept** - Previous uploads are completely removed
- **No merging** - Old data is not merged with new data
- **No partial updates** - All data for the user is replaced



