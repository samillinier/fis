-- Add stored Microsoft profile photo (base64 data URL) for FIS POD authorized users
-- Safe to rerun

ALTER TABLE authorized_users
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Optional: index to quickly find users who have photos
CREATE INDEX IF NOT EXISTS authorized_users_photo_url_idx
ON authorized_users (email)
WHERE photo_url IS NOT NULL;

