-- Fix All Data to Use Your User ID
-- Your email: sbiru@fiscorponline.com
-- Your user_id: 3c0db76c-1db4-4232-b259-883fbd7ad177

-- Step 1: Update all visual_data to use your user_id
UPDATE visual_data 
SET user_id = '3c0db76c-1db4-4232-b259-883fbd7ad177'
WHERE user_id IS NOT NULL;

-- Step 2: Update all survey_data to use your user_id
UPDATE survey_data 
SET user_id = '3c0db76c-1db4-4232-b259-883fbd7ad177'
WHERE user_id IS NOT NULL;

-- Step 3: Update dashboard_metadata to use your user_id
UPDATE dashboard_metadata 
SET user_id = '3c0db76c-1db4-4232-b259-883fbd7ad177'
WHERE user_id IS NOT NULL;

-- Step 4: Verify the update
SELECT 'visual_data' as table_name, COUNT(*) as records 
FROM visual_data 
WHERE user_id = '3c0db76c-1db4-4232-b259-883fbd7ad177'
UNION ALL
SELECT 'survey_data' as table_name, COUNT(*) as records 
FROM survey_data 
WHERE user_id = '3c0db76c-1db4-4232-b259-883fbd7ad177';

-- Step 5: See your data
SELECT 'visual' as type, workroom_name, store, sales, created_at
FROM visual_data 
WHERE user_id = '3c0db76c-1db4-4232-b259-883fbd7ad177'
ORDER BY created_at DESC
LIMIT 10;

SELECT 'survey' as type, workroom_name, store, ltr_score, created_at
FROM survey_data 
WHERE user_id = '3c0db76c-1db4-4232-b259-883fbd7ad177'
ORDER BY created_at DESC
LIMIT 10;

