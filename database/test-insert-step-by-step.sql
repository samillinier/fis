-- Test Insert - Step by Step
-- Run each step separately

-- STEP 1: Get your user_id (replace with YOUR email)
SELECT id, email 
FROM users 
WHERE email = 'YOUR_EMAIL@example.com';
-- Copy the 'id' value from the result

-- STEP 2: Insert test record (replace 'PASTE_YOUR_USER_ID_HERE' with the id from step 1)
-- Example: if your id is '74b57bab-2d37-442f-bdb4-7bd685f93560', use that
INSERT INTO visual_data (
  user_id,
  workroom_name,
  store,
  sales,
  labor_po,
  vendor_debit,
  data_jsonb
) VALUES (
  'PASTE_YOUR_USER_ID_HERE',  -- Replace this with your actual user_id from step 1
  'TEST_WORKROOM',
  '123',
  1000.00,
  500.00,
  200.00,
  '{"name": "TEST_WORKROOM", "store": "123", "sales": 1000, "laborPO": 500, "vendorDebit": 200}'::jsonb
)
RETURNING id, user_id, workroom_name, created_at;

-- STEP 3: Check if it was inserted
SELECT * FROM visual_data WHERE workroom_name = 'TEST_WORKROOM';

-- STEP 4: If it worked, clean up
DELETE FROM visual_data WHERE workroom_name = 'TEST_WORKROOM';





