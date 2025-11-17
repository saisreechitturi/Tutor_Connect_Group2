-- Migration to remove max sessions and buffer minutes fields
-- Run Date: 2025-11-13
-- Description: Remove max_sessions_per_slot and buffer_time_minutes columns from tutor_availability_slots table

-- Drop columns from tutor_availability_slots table
ALTER TABLE tutor_availability_slots DROP COLUMN IF EXISTS max_sessions_per_slot;
ALTER TABLE tutor_availability_slots DROP COLUMN IF EXISTS buffer_time_minutes;

-- Note: These columns are no longer needed as we've simplified the availability system
-- Sessions will be booked without considering max sessions per slot or buffer times