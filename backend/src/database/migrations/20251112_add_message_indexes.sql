-- Add helpful indexes for messages performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair_created_at ON messages(sender_id, recipient_id, created_at DESC);
