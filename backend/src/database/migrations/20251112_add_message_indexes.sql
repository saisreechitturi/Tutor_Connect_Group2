-- Add helpful indexes for messages performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_pair_created_at ON messages(sender_id, recipient_id, created_at DESC);
