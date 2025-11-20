-- Dashboard optimization migration
-- This migration adds indexes and optimizations for better dashboard performance

-- Add indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor_status_date 
ON tutoring_sessions(tutor_id, status, scheduled_start);

CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor_month_year 
ON tutoring_sessions(tutor_id, EXTRACT(YEAR FROM scheduled_start), EXTRACT(MONTH FROM scheduled_start));

CREATE INDEX IF NOT EXISTS idx_session_reviews_reviewee_created 
ON session_reviews(reviewee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tutor_performance_metrics_tutor_date 
ON tutor_performance_metrics(tutor_id, year DESC, month DESC);

-- Create a materialized view for better dashboard performance (optional)
-- This can be refreshed periodically for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS tutor_dashboard_stats AS
SELECT 
    tp.user_id as tutor_id,
    tp.rating,
    tp.total_sessions,
    tp.total_students,
    tp.hourly_rate,
    tp.total_earnings,
    tp.monthly_earnings,
    
    -- Active students (students with sessions in last 30 days)
    COALESCE(active_students.count, 0) as active_students_count,
    
    -- Upcoming sessions this week
    COALESCE(upcoming_sessions.count, 0) as upcoming_sessions_count,
    
    -- Current month earnings
    COALESCE(current_month_earnings.total, 0) as current_month_earnings,
    
    -- Recent session count
    COALESCE(recent_sessions.count, 0) as recent_sessions_count
    
FROM tutor_profiles tp

LEFT JOIN (
    SELECT 
        tutor_id,
        COUNT(DISTINCT student_id) as count
    FROM tutoring_sessions
    WHERE scheduled_start >= NOW() - INTERVAL '30 days'
    GROUP BY tutor_id
) active_students ON tp.user_id = active_students.tutor_id

LEFT JOIN (
    SELECT 
        tutor_id,
        COUNT(*) as count
    FROM tutoring_sessions
    WHERE status = 'scheduled'
    AND scheduled_start >= NOW()
    AND scheduled_start <= NOW() + INTERVAL '7 days'
    GROUP BY tutor_id
) upcoming_sessions ON tp.user_id = upcoming_sessions.tutor_id

LEFT JOIN (
    SELECT 
        tutor_id,
        SUM(payment_amount) as total
    FROM tutoring_sessions
    WHERE status = 'completed'
    AND EXTRACT(MONTH FROM scheduled_start) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(YEAR FROM scheduled_start) = EXTRACT(YEAR FROM NOW())
    GROUP BY tutor_id
) current_month_earnings ON tp.user_id = current_month_earnings.tutor_id

LEFT JOIN (
    SELECT 
        tutor_id,
        COUNT(*) as count
    FROM tutoring_sessions
    WHERE scheduled_start >= NOW() - INTERVAL '7 days'
    GROUP BY tutor_id
) recent_sessions ON tp.user_id = recent_sessions.tutor_id;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_tutor_dashboard_stats_tutor_id 
ON tutor_dashboard_stats(tutor_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_tutor_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY tutor_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Add some additional helpful indexes
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student_tutor 
ON tutoring_sessions(student_id, tutor_id);

CREATE INDEX IF NOT EXISTS idx_payments_recipient_created 
ON payments(recipient_id, created_at DESC);

-- Optimize the tutor search view for better performance
DROP VIEW IF EXISTS tutor_search_view;
CREATE VIEW tutor_search_view AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.profile_picture_url,
    u.bio,
    tp.hourly_rate,
    tp.years_of_experience as experience_years,
    tp.education_background as education,
    tp.rating,
    (SELECT COUNT(*) FROM session_reviews sr 
     JOIN tutoring_sessions ts ON sr.session_id = ts.id 
     WHERE ts.tutor_id = u.id) as total_reviews,
    tp.total_sessions,
    tp.is_available_now as is_available,
    tp.languages_spoken as languages,
    tp.preferred_teaching_method as preferred_session_type,
    COALESCE(
        (SELECT ARRAY_AGG(s.name ORDER BY s.name)
         FROM tutor_subjects ts
         JOIN subjects s ON ts.subject_id = s.id
         WHERE ts.tutor_id = u.id AND s.is_active = true), 
        ARRAY[]::varchar[]
    ) as subjects,
    COALESCE(
        (SELECT ARRAY_AGG(DISTINCT s.category ORDER BY s.category)
         FROM tutor_subjects ts
         JOIN subjects s ON ts.subject_id = s.id
         WHERE ts.tutor_id = u.id AND s.is_active = true), 
        ARRAY[]::varchar[]
    ) as subject_categories
FROM users u
JOIN tutor_profiles tp ON u.id = tp.user_id
WHERE u.role = 'tutor' AND u.is_active = true;

COMMIT;