-- Additional sample data for current month to make tutor dashboard more realistic
-- This adds recent sessions, earnings, and activities for the current month

BEGIN;

-- Add some current month sessions
INSERT INTO tutoring_sessions (
    id, student_id, tutor_id, subject_id, title, description, session_type, 
    scheduled_start, scheduled_end, actual_start, actual_end, status, 
    hourly_rate, payment_amount, session_notes, created_at
) VALUES 
    -- Completed sessions this month
    (gen_random_uuid(), 
     '550e8400-e29b-41d4-a716-446655440002', 
     '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1),
     'Calculus Problem Solving',
     'Working on integration and differentiation problems',
     'online',
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '5 days' + INTERVAL '1 hour',
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '5 days' + INTERVAL '1 hour',
     'completed',
     45.00,
     45.00,
     'Excellent progress on calculus concepts. Student is ready for advanced topics.',
     NOW() - INTERVAL '5 days'),
     
    (gen_random_uuid(), 
     '550e8400-e29b-41d4-a716-446655440003', 
     '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1),
     'Mechanics Review',
     'Review of force, motion, and energy concepts',
     'online',
     NOW() - INTERVAL '8 days',
     NOW() - INTERVAL '8 days' + INTERVAL '1.5 hours',
     NOW() - INTERVAL '8 days',
     NOW() - INTERVAL '8 days' + INTERVAL '1.5 hours',
     'completed',
     45.00,
     67.50,
     'Great understanding of mechanics principles. Extended session was very productive.',
     NOW() - INTERVAL '8 days'),
     
    (gen_random_uuid(), 
     '550e8400-e29b-41d4-a716-446655440004', 
     '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1),
     'Algebra Basics',
     'Fundamentals of algebraic equations',
     'online',
     NOW() - INTERVAL '3 days',
     NOW() - INTERVAL '3 days' + INTERVAL '1 hour',
     NOW() - INTERVAL '3 days',
     NOW() - INTERVAL '3 days' + INTERVAL '1 hour',
     'completed',
     45.00,
     45.00,
     'Student is making good progress with algebra fundamentals.',
     NOW() - INTERVAL '3 days'),
     
    -- More upcoming sessions this week
    (gen_random_uuid(), 
     '550e8400-e29b-41d4-a716-446655440002', 
     '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1),
     'Thermodynamics Intro',
     'Introduction to heat, temperature, and energy transfer',
     'online',
     NOW() + INTERVAL '1 day',
     NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
     'scheduled',
     45.00,
     NULL,
     NOW()),
     
    (gen_random_uuid(), 
     '550e8400-e29b-41d4-a716-446655440005', 
     '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Chemistry' LIMIT 1),
     'Organic Chemistry Basics',
     'Introduction to organic compounds and reactions',
     'online',
     NOW() + INTERVAL '4 days',
     NOW() + INTERVAL '4 days' + INTERVAL '1 hour',
     'scheduled',
     45.00,
     NULL,
     NOW());

-- Add reviews for the recent completed sessions
INSERT INTO session_reviews (session_id, reviewer_id, reviewer_type, rating, comment, would_recommend, reviewee_id)
SELECT 
    ts.id,
    ts.student_id,
    'student',
    CASE 
        WHEN ts.title LIKE '%Calculus%' THEN 5
        WHEN ts.title LIKE '%Mechanics%' THEN 5
        WHEN ts.title LIKE '%Algebra%' THEN 4
        ELSE 4
    END,
    CASE 
        WHEN ts.title LIKE '%Calculus%' THEN 'Amazing tutor! Really helped me understand calculus concepts clearly.'
        WHEN ts.title LIKE '%Mechanics%' THEN 'Very knowledgeable and patient. Extended the session to make sure I understood everything.'
        WHEN ts.title LIKE '%Algebra%' THEN 'Good explanation of algebra basics. Looking forward to more sessions.'
        ELSE 'Great session overall!'
    END,
    true,
    ts.tutor_id
FROM tutoring_sessions ts
WHERE ts.status = 'completed' 
AND ts.tutor_id = '550e8400-e29b-41d4-a716-446655440001'
AND ts.scheduled_start >= NOW() - INTERVAL '10 days'
ON CONFLICT (session_id, reviewer_id) DO NOTHING;

-- Update tutor profile with current statistics
UPDATE tutor_profiles SET 
    total_sessions = (
        SELECT COUNT(*) FROM tutoring_sessions 
        WHERE tutor_id = '550e8400-e29b-41d4-a716-446655440001' AND status = 'completed'
    ),
    total_students = (
        SELECT COUNT(DISTINCT student_id) FROM tutoring_sessions 
        WHERE tutor_id = '550e8400-e29b-41d4-a716-446655440001'
    ),
    rating = (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
        FROM session_reviews sr
        JOIN tutoring_sessions ts ON sr.session_id = ts.id
        WHERE ts.tutor_id = '550e8400-e29b-41d4-a716-446655440001'
    ),
    total_earnings = (
        SELECT COALESCE(SUM(payment_amount), 0) FROM tutoring_sessions 
        WHERE tutor_id = '550e8400-e29b-41d4-a716-446655440001' AND status = 'completed'
    ),
    monthly_earnings = (
        SELECT COALESCE(SUM(payment_amount), 0) FROM tutoring_sessions 
        WHERE tutor_id = '550e8400-e29b-41d4-a716-446655440001' 
        AND status = 'completed'
        AND EXTRACT(MONTH FROM scheduled_start) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR FROM scheduled_start) = EXTRACT(YEAR FROM NOW())
    )
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';

-- Update/create performance metrics for current month
INSERT INTO tutor_performance_metrics (
    tutor_id, year, month, total_sessions, completed_sessions, cancelled_sessions,
    total_earnings, total_hours, average_rating, total_reviews
)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    EXTRACT(YEAR FROM NOW()),
    EXTRACT(MONTH FROM NOW()),
    COUNT(*) FILTER (WHERE status IN ('completed', 'scheduled', 'in_progress')),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COALESCE(SUM(payment_amount) FILTER (WHERE status = 'completed'), 0),
    COALESCE(SUM(EXTRACT(EPOCH FROM (
        CASE 
            WHEN actual_end IS NOT NULL AND actual_start IS NOT NULL 
            THEN actual_end - actual_start
            ELSE scheduled_end - scheduled_start
        END
    ))/3600) FILTER (WHERE status = 'completed'), 0),
    (SELECT COALESCE(AVG(rating), 0) FROM session_reviews sr 
     JOIN tutoring_sessions ts ON sr.session_id = ts.id 
     WHERE ts.tutor_id = '550e8400-e29b-41d4-a716-446655440001'
     AND EXTRACT(MONTH FROM ts.scheduled_start) = EXTRACT(MONTH FROM NOW())
     AND EXTRACT(YEAR FROM ts.scheduled_start) = EXTRACT(YEAR FROM NOW())),
    (SELECT COUNT(*) FROM session_reviews sr 
     JOIN tutoring_sessions ts ON sr.session_id = ts.id 
     WHERE ts.tutor_id = '550e8400-e29b-41d4-a716-446655440001'
     AND EXTRACT(MONTH FROM ts.scheduled_start) = EXTRACT(MONTH FROM NOW())
     AND EXTRACT(YEAR FROM ts.scheduled_start) = EXTRACT(YEAR FROM NOW()))
FROM tutoring_sessions
WHERE tutor_id = '550e8400-e29b-41d4-a716-446655440001'
AND EXTRACT(MONTH FROM scheduled_start) = EXTRACT(MONTH FROM NOW())
AND EXTRACT(YEAR FROM scheduled_start) = EXTRACT(YEAR FROM NOW())
ON CONFLICT (tutor_id, year, month) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    completed_sessions = EXCLUDED.completed_sessions,
    cancelled_sessions = EXCLUDED.cancelled_sessions,
    total_earnings = EXCLUDED.total_earnings,
    total_hours = EXCLUDED.total_hours,
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    updated_at = NOW();

COMMIT;