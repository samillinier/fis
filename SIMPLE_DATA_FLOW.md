# Simple Data Flow

## How It Works:

### 1. **On Page Load / Refresh**
   - Load data from Supabase `workroom_data` table
   - If data exists → Show it
   - If no data → Show empty dashboard

### 2. **When User Uploads Data**
   - Delete old data from Supabase `workroom_data` table
   - Save new data to Supabase `workroom_data` table
   - Show new data in dashboard

### 3. **That's It!**
   - No complex merging
   - No localStorage priority
   - Just: Supabase → Dashboard

## Database Table:
- **Table**: `workroom_data`
- **Columns**: All workroom fields + `data_jsonb` (complete data as JSON)

## Flow Diagram:
```
Page Load → GET /api/data → Supabase workroom_data → Dashboard

Upload File → DELETE old → INSERT new → Supabase workroom_data → Dashboard
```



