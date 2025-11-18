-- Migration: Cleanup notifications and completely remove user preferences
-- This migration removes notifications table and user_preferences table entirely
-- to simplify the application to only have profile settings stored in user table

-- Drop notifications table and its indexes
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop user_preferences table completely
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Keep system settings table as it's for platform configuration
-- Remove any notification-related system settings
DELETE FROM settings WHERE category = 'notifications' OR key LIKE '%notification%';