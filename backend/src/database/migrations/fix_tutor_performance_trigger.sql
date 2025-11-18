-- Migration: Fix tutor performance metrics trigger to use correct column names
-- This fixes the issue where the trigger references non-existent columns

-- Drop the old trigger first
DROP TRIGGER IF EXISTS update_tutor_performance_trigger ON tutoring_sessions;

-- Drop the old function  
DROP FUNCTION IF EXISTS update_tutor_performance_metrics();