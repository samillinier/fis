# Performance Forms Database Setup Instructions

## Quick Setup

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Click "New Query"

2. **Run the Setup Script**
   - Copy the entire contents of `setup-performance-forms-complete.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify Setup**
   - Run `verify-performance-forms.sql` to check everything is set up correctly
   - You should see:
     - ✅ Table exists
     - ✅ RLS Enabled
     - Table structure with all columns
     - Indexes created
     - Policies active

## What Gets Created

### Table: `performance_forms`

Stores all form submissions with:
- **id**: UUID primary key
- **user_id**: References users table
- **workroom**: Workroom name
- **metric_type**: Type of form (reschedule_rate, ltr, cycle_time, vendor_debit)
- **week_start_date**: Week the form is for
- **form_data**: Complete form data as JSONB
- **submitted_at**: When form was submitted
- **created_at**: When record was created
- **updated_at**: When record was last updated

### Indexes

Created for fast queries:
- By user_id
- By workroom
- By metric_type
- By week_start_date
- Composite index for unique constraint
- By submitted_at (for sorting)

### Security

- Row Level Security (RLS) enabled
- Service role policy allows API access
- API routes handle authentication

## Files

- **setup-performance-forms-complete.sql** - Main setup script (run this)
- **verify-performance-forms.sql** - Verification script (check after setup)
- **add-performance-forms.sql** - Original setup file (same as complete version)

## Troubleshooting

### Error: "relation users does not exist"
- Make sure the `users` table exists first
- Run your main database schema setup first

### Error: "permission denied"
- Make sure you're using the service role key in your API routes
- Check that RLS policies are created correctly

### Table already exists
- The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times
- If you need to recreate, drop the table first:
  ```sql
  DROP TABLE IF EXISTS performance_forms CASCADE;
  ```

## Testing

After setup, test by:
1. Submitting a form through the UI
2. Checking the `performance_forms` table in Supabase
3. Verifying the data was saved correctly

## Support

If you encounter issues:
1. Check the verification script output
2. Check Supabase logs
3. Check browser console for API errors
4. Verify environment variables are set correctly



