-- Clean up tutoring_sessions table by removing unused columns
-- Migration: cleanup_tutoring_sessions_table.sql
-- Date: 2025-11-18

BEGIN;

-- Drop unused columns from tutoring_sessions table
ALTER TABLE tutoring_sessions 
DROP COLUMN IF EXISTS actual_start,
DROP COLUMN IF EXISTS actual_end,
DROP COLUMN IF EXISTS homework_assigned,
DROP COLUMN IF EXISTS materials_used,
DROP COLUMN IF EXISTS cancellation_reason,
DROP COLUMN IF EXISTS cancelled_by,
DROP COLUMN IF EXISTS session_date;

-- Note: We keep duration_minutes as it's a computed column that's useful
-- Note: We keep all other columns as they are being used in the API

COMMIT;