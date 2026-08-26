-- Allow the Lowe's tracker tables to store Q2 fiscal weeks (14-26).
-- Run this once in Supabase SQL Editor before uploading the Q2 goals file.

DO $$
DECLARE
  target_table TEXT;
  constraint_row RECORD;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'lowes_q1_goals',
    'lowes_weekly_job_counts',
    'lowes_store_weekly_forecasts'
  ]
  LOOP
    IF to_regclass(target_table) IS NULL THEN
      RAISE NOTICE 'Skipping %, table does not exist', target_table;
      CONTINUE;
    END IF;

    FOR constraint_row IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = target_table::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%week_number%'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', target_table, constraint_row.conname);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I CHECK (week_number >= 1 AND week_number <= 52)',
      target_table,
      target_table || '_week_number_range_check'
    );
  END LOOP;
END $$;
