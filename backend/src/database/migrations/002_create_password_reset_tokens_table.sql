-- Migration: Create password_reset_tokens table
-- Created: 2025-11-07
-- Description: Table to store password reset tokens for secure password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the reset token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL, -- When the token was used (if used)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id), -- Only one active reset token per user
    UNIQUE(token_hash) -- Ensure token uniqueness
);

-- Index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Trigger to update updated_at timestamp (reuse existing function)
CREATE TRIGGER trigger_password_reset_tokens_updated_at
    BEFORE UPDATE ON password_reset_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for secure password reset functionality';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'Reference to the user requesting password reset';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA-256 hash of the password reset token (never store plain token)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'When the reset token expires (typically 15 minutes from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when the token was used to reset password (NULL if unused)';