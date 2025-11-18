-- Migration: Add date_of_birth and address to users table, remove user_addresses table
-- This migration consolidates address information into the users table

-- First, migrate any existing address data to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Update users table with primary address from user_addresses table
UPDATE users 
SET address = CONCAT(
    ua.address_line1,
    CASE WHEN ua.address_line2 IS NOT NULL AND ua.address_line2 != '' 
         THEN ', ' || ua.address_line2 
         ELSE '' END,
    ', ', ua.city,
    ', ', ua.state,
    ' ', ua.postal_code,
    ', ', ua.country
)
FROM user_addresses ua
WHERE users.id = ua.user_id 
AND ua.is_primary = true;

-- For users who don't have a primary address but have addresses, use the first one
UPDATE users 
SET address = CONCAT(
    ua.address_line1,
    CASE WHEN ua.address_line2 IS NOT NULL AND ua.address_line2 != '' 
         THEN ', ' || ua.address_line2 
         ELSE '' END,
    ', ', ua.city,
    ', ', ua.state,
    ' ', ua.postal_code,
    ', ', ua.country
)
FROM (
    SELECT DISTINCT ON (user_id) *
    FROM user_addresses 
    ORDER BY user_id, created_at ASC
) ua
WHERE users.id = ua.user_id 
AND users.address IS NULL;

-- Drop the user_addresses table
DROP TABLE IF EXISTS user_addresses CASCADE;

-- Add date_of_birth column if it doesn't exist (it might already exist based on the schema)
-- The date_of_birth column already exists in the users table according to the schema