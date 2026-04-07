-- Add password_hash column to lowes_team_members table if it doesn't exist
-- Run this SQL in Supabase SQL Editor

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lowes_team_members' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE lowes_team_members 
        ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
        
        -- Remove the default after adding (so future inserts require a password)
        ALTER TABLE lowes_team_members 
        ALTER COLUMN password_hash DROP DEFAULT;
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lowes_team_members' 
AND column_name = 'password_hash';
