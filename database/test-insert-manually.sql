-- Test Manual Insert to Verify Tables Work
-- Run this to test if you can manually insert data

-- Step 1: Get your user_id (replace with your email)
-- Run this first to get your user_id:
SELECT id, email FROM users WHERE email = 'YOUR_EMAIL@example.com';

-- Step 2: Test insert into visual_data (replace USER_ID_HERE with the id from step 1)
INSERT INTO visual_data (
  user_id,
  workroom_name,
  store,
  sales,
  labor_po,
  vendor_debit,
  data_jsonb
) VALUES (
  'USER_ID_HERE'::uuid,
  'TEST_WORKROOM',
  '123',
  1000.00,
  500.00,
  200.00,
  '{"name": "TEST_WORKROOM", "store": "123", "sales": 1000, "laborPO": 500, "vendorDebit": 200}'::jsonb
)
RETURNING id, user_id, workroom_name, created_at;

-- Step 3: Check if it was inserted
SELECT * FROM visual_data WHERE workroom_name = 'TEST_WORKROOM';

-- Step 4: Test insert into survey_data
INSERT INTO survey_data (
  user_id,
  workroom_name,
  store,
  ltr_score,
  craft_score,
  prof_score,
  data_jsonb
) VALUES (
  'USER_ID_HERE'::uuid,
  'TEST_SURVEY',
  '456',
  85.5,
  90.0,
  88.0,
  '{"name": "TEST_SURVEY", "store": "456", "ltrScore": 85.5, "craftScore": 90, "profScore": 88}'::jsonb
)
RETURNING id, user_id, workroom_name, created_at;

-- Step 5: Check if it was inserted
SELECT * FROM survey_data WHERE workroom_name = 'TEST_SURVEY';

-- Step 6: Clean up test data
DELETE FROM visual_data WHERE workroom_name = 'TEST_WORKROOM';
DELETE FROM survey_data WHERE workroom_name = 'TEST_SURVEY';

