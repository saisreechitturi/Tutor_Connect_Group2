-- Migration: Clean up tutor_availability_slots table
-- Remove unused columns to simplify the table structure

-- First, let's create a backup table (optional, for safety)
-- CREATE TABLE tutor_availability_slots_backup AS SELECT * FROM tutor_availability_slots;

-- Drop unused columns from tutor_availability_slots
ALTER TABLE tutor_availability_slots 
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS recurring_pattern,
DROP COLUMN IF EXISTS effective_from,
DROP COLUMN IF EXISTS effective_until,
DROP COLUMN IF EXISTS break_duration_minutes,
DROP COLUMN IF EXISTS max_sessions_per_slot,
DROP COLUMN IF EXISTS buffer_time_minutes;

-- Add is_recurring column if it doesn't exist (we'll use this to distinguish recurring vs one-time slots)
ALTER TABLE tutor_availability_slots 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true;

-- Update existing records to be recurring by default
UPDATE tutor_availability_slots SET is_recurring = true WHERE is_recurring IS NULL;

-- Add constraint to ensure end_time is after start_time
ALTER TABLE tutor_availability_slots 
ADD CONSTRAINT check_time_range CHECK (end_time > start_time);

-- Update the comment
COMMENT ON TABLE tutor_availability_slots IS 'Simplified tutor availability slots - recurring weekly slots by day of week';