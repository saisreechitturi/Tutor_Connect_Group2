-- Migration: Add missing reviewee_id column to session_reviews table
-- This fixes the review submission error

-- First check if column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'session_reviews' 
        AND column_name = 'reviewee_id'
    ) THEN
        -- Add the column as nullable first
        ALTER TABLE session_reviews 
        ADD COLUMN reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE;
        
        -- Update existing rows to have a reviewee_id 
        -- For session reviews, the reviewee should be the other participant
        UPDATE session_reviews sr
        SET reviewee_id = (
            CASE 
                WHEN sr.reviewer_id = ts.student_id THEN ts.tutor_id
                ELSE ts.student_id
            END
        )
        FROM tutoring_sessions ts
        WHERE sr.session_id = ts.id AND sr.reviewee_id IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE session_reviews 
        ALTER COLUMN reviewee_id SET NOT NULL;
    END IF;
END
$$;