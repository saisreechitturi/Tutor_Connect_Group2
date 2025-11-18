-- Migration: Complete removal of user_preferences table
-- This migration completely removes the user_preferences table
-- Profile preferences should be stored directly in the users table if needed

-- Drop any indexes related to user_preferences
DROP INDEX IF EXISTS idx_user_preferences_user_id;

-- Drop any triggers on user_preferences
DROP TRIGGER IF EXISTS update_preferences_updated_at ON user_preferences;

-- Drop the user_preferences table completely
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Clean up any foreign key constraints that might reference this table
-- (This is handled by CASCADE but added for completeness)