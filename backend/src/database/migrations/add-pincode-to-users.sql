-- Migration: Add pincode column to users table
-- This migration adds a pincode field for future use

-- Add pincode column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);

-- Add comment to document the column purpose
COMMENT ON COLUMN users.pincode IS 'Postal/ZIP code for user address - for future use';