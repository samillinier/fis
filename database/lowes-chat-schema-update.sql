-- Update schema to add separate district and store_number columns for filtering
-- Run this SQL in Supabase SQL Editor

-- Add new columns for district and store_number
ALTER TABLE lowes_chat_conversations 
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS store_number TEXT;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_conversations_district_store ON lowes_chat_conversations(district, store_number);

-- Update existing rows to parse district_store (if any exist)
-- This extracts district and store number from the combined district_store field
UPDATE lowes_chat_conversations
SET 
  district = SPLIT_PART(district_store, ' / Store ', 1),
  store_number = SPLIT_PART(district_store, ' / Store ', 2)
WHERE district IS NULL OR store_number IS NULL;
