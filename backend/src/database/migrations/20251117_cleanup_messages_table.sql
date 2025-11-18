-- Migration: Remove is_read, parent_message_id, and subject columns from messages table
-- Date: 2024-11-17
-- Description: Clean up messages table by removing unused or redundant columns

-- Remove the columns from messages table
ALTER TABLE messages DROP COLUMN IF EXISTS is_read;
ALTER TABLE messages DROP COLUMN IF EXISTS parent_message_id;
ALTER TABLE messages DROP COLUMN IF EXISTS subject;

-- Add index on sender_id and recipient_id for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Update any existing indexes if needed
-- Note: Check if there are any existing indexes on the dropped columns and they will be automatically dropped