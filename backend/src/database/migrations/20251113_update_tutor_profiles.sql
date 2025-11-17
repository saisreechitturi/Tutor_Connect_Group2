-- Migration: Update tutor_profiles table structure
-- Date: 2025-11-13
-- Description: Remove unnecessary columns and update availability fields

-- Remove columns that are not needed
ALTER TABLE tutor_profiles DROP COLUMN IF EXISTS average_session_duration;
ALTER TABLE tutor_profiles DROP COLUMN IF EXISTS cancellation_rate;
ALTER TABLE tutor_profiles DROP COLUMN IF EXISTS response_rate;

-- Update weekly_availability_hours to be managed by availability slots
-- Keep the column but it will be calculated from tutor_availability_slots
ALTER TABLE tutor_profiles ALTER COLUMN weekly_availability_hours SET DEFAULT 0.00;

-- Add a computed field for availability status
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS is_available_now BOOLEAN DEFAULT true;

-- Update tutor_availability_slots to match current availability system
ALTER TABLE tutor_availability_slots ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true;
ALTER TABLE tutor_availability_slots ADD COLUMN IF NOT EXISTS specific_date DATE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_day ON tutor_availability_slots(tutor_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_specific_date ON tutor_availability_slots(tutor_id, specific_date);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_tutor ON tutor_subjects(tutor_id);