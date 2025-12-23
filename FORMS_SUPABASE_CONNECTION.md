# Forms Supabase Connection Guide

All performance forms are connected to Supabase through the `/api/performance-forms` endpoint.

## Forms Connected

1. **Reschedule Rate Form** (`/reschedule-rate-form`)
   - Metric Type: `reschedule_rate`
   - Component: `RescheduleRateForm.tsx`
   - Table: `performance_forms`

2. **LTR Form** (`/ltr-form`)
   - Metric Type: `ltr`
   - Component: `LTRForm.tsx`
   - Table: `performance_forms`

3. **Work Cycle Time Form** (`/work-cycle-time-form`)
   - Metric Type: `cycle_time`
   - Component: `WorkCycleTimeForm.tsx`
   - Table: `performance_forms`

4. **Vendor Debit Form** (`/vendor-debit-form`)
   - Metric Type: `vendor_debit`
   - Component: `VendorDebitForm.tsx`
   - Table: `performance_forms`

## Database Setup

### Table: `performance_forms`

The table must be created in Supabase. Run this SQL:

```sql
-- File: database/add-performance-forms.sql
CREATE TABLE IF NOT EXISTS performance_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workroom TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('vendor_debit', 'ltr', 'cycle_time', 'reschedule_rate', 'job_cycle_time', 'details_cycle_time')),
  week_start_date DATE NOT NULL,
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workroom, metric_type, week_start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_forms_user_id ON performance_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_forms_workroom ON performance_forms(workroom);
CREATE INDEX IF NOT EXISTS idx_performance_forms_metric_type ON performance_forms(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_forms_week_start ON performance_forms(week_start_date);

-- RLS Policy
ALTER TABLE performance_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access performance_forms" ON performance_forms;
CREATE POLICY "Service role full access performance_forms" ON performance_forms
  FOR ALL USING (true) WITH CHECK (true);
```

## API Endpoint

**Route**: `/api/performance-forms`

**Methods**:
- `POST` - Submit a form
- `GET` - Check if form has been submitted for current week

**POST Request Body**:
```json
{
  "workroom": "Workroom Name",
  "metric_type": "reschedule_rate" | "ltr" | "cycle_time" | "vendor_debit",
  "form_data": { /* All form fields as JSON */ }
}
```

**Response**:
```json
{
  "success": true,
  "submission": { /* Saved form data */ }
}
```

## How It Works

1. User fills out a form (Reschedule Rate, LTR, Cycle Time, or Vendor Debit)
2. Form submits to `/api/performance-forms` with:
   - `workroom`: The workroom name
   - `metric_type`: The type of metric/form
   - `form_data`: All form fields as JSON
3. API endpoint:
   - Checks if form already exists for this user/workroom/metric/week
   - Updates if exists, inserts if new
   - Saves to `performance_forms` table in Supabase
4. User receives success/error notification

## Data Storage

All form data is stored in the `form_data` JSONB column, which contains:
- All form fields (workroom info, checkboxes, text areas, signatures, etc.)
- Complete form state at time of submission
- Accessible for reporting and review

## Verification

To verify forms are connected:

1. Check browser console for API calls to `/api/performance-forms`
2. Check Supabase `performance_forms` table for saved submissions
3. Verify success notifications appear after form submission
4. Check server logs for any errors

## Troubleshooting

If forms fail to save:

1. **Check if table exists**: Run the SQL above in Supabase SQL Editor
2. **Check RLS policies**: Ensure the service role policy is active
3. **Check error messages**: Forms now show detailed error messages
4. **Check browser console**: Look for API errors
5. **Check server logs**: Look for database errors

All forms use the same API endpoint and database table, ensuring consistency across all form types.





