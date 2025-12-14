-- Easy Test Insert - Uses first user in database
-- Run this entire block at once

-- Insert test record using the first user's ID
INSERT INTO visual_data (
  user_id,
  workroom_name,
  store,
  sales,
  labor_po,
  vendor_debit,
  data_jsonb
)
SELECT 
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),  -- Uses most recent user
  'TEST_WORKROOM',
  '123',
  1000.00,
  500.00,
  200.00,
  '{"name": "TEST_WORKROOM", "store": "123", "sales": 1000, "laborPO": 500, "vendorDebit": 200}'::jsonb
RETURNING id, user_id, workroom_name, created_at;

-- Check if it was inserted
SELECT * FROM visual_data WHERE workroom_name = 'TEST_WORKROOM';

-- Clean up (run this after testing)
-- DELETE FROM visual_data WHERE workroom_name = 'TEST_WORKROOM';

