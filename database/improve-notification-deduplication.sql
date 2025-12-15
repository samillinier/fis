-- Improve notification deduplication and monitoring
-- Run this SQL in your Supabase SQL Editor

-- Add index for faster duplicate detection queries (checking by workroom and created_at)
CREATE INDEX IF NOT EXISTS idx_notifications_user_workroom_created 
  ON notifications(user_id, workroom, created_at DESC);

-- Add index for message-based duplicate detection
CREATE INDEX IF NOT EXISTS idx_notifications_user_workroom_message 
  ON notifications(user_id, workroom, message);

-- Optional: Add a notification_fingerprint column for better deduplication
-- This would allow us to create a hash of workroom + metric type for faster lookups
-- ALTER TABLE notifications ADD COLUMN IF NOT EXISTS fingerprint TEXT;
-- CREATE INDEX IF NOT EXISTS idx_notifications_fingerprint ON notifications(fingerprint);

-- Add a function to clean up old read notifications (optional, for maintenance)
-- This keeps the table size manageable
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- You can run this function periodically (e.g., via a cron job or scheduled task)
-- SELECT cleanup_old_notifications();
