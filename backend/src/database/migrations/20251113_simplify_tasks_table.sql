-- Migration: Simplify tasks table
-- Date: 2025-11-13
-- Description: Remove unused columns (tutor_id, subject_id, actual_hours, difficulty_level, attachments)
--              and add subject as a text field

-- Add subject column as VARCHAR
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subject VARCHAR(100);

-- Drop unused columns
ALTER TABLE tasks DROP COLUMN IF EXISTS tutor_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS subject_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS difficulty_level;
ALTER TABLE tasks DROP COLUMN IF EXISTS attachments;

-- Update any existing tasks to set a default subject if needed
UPDATE tasks SET subject = 'General' WHERE subject IS NULL OR subject = '';

-- Fix completed tasks that have 0% progress
UPDATE tasks SET progress_percentage = 100 WHERE status = 'completed' AND (progress_percentage IS NULL OR progress_percentage = 0);
