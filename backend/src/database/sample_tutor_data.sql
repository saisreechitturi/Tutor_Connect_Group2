-- Sample data for testing tutor dashboard functionality
-- This script creates sample users, tutor profiles, sessions, and related data

-- Sample subjects
INSERT INTO subjects (id, name, description, category, is_active) VALUES
    (gen_random_uuid(), 'Mathematics', 'General Mathematics including Algebra, Geometry, and Calculus', 'STEM', true),
    (gen_random_uuid(), 'Physics', 'General Physics including Mechanics, Thermodynamics, and Electromagnetism', 'STEM', true),
    (gen_random_uuid(), 'Chemistry', 'General Chemistry including Organic, Inorganic, and Physical Chemistry', 'STEM', true),
    (gen_random_uuid(), 'English Literature', 'English Literature and Language Arts', 'Humanities', true),
    (gen_random_uuid(), 'History', 'World History and Social Studies', 'Humanities', true),
    (gen_random_uuid(), 'Computer Science', 'Programming, Data Structures, and Algorithms', 'STEM', true),
    (gen_random_uuid(), 'Biology', 'General Biology including Cell Biology, Genetics, and Ecology', 'STEM', true),
    (gen_random_uuid(), 'Spanish', 'Spanish Language and Culture', 'Languages', true)
ON CONFLICT (name) DO NOTHING;

-- Sample tutor user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, profile_picture_url, bio, is_active, email_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'tutor@demo.com', '$2b$10$example.hash.here', 'John', 'Smith', 'tutor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'Experienced mathematics and physics tutor with 8 years of teaching experience. Passionate about helping students understand complex concepts.', true, true)
ON CONFLICT (email) DO NOTHING;

-- Sample tutor profile
INSERT INTO tutor_profiles (user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, total_earnings, weekly_availability_hours, monthly_earnings, is_available_now) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 45.00, 8, 'M.S. in Mathematics from Stanford University, B.S. in Physics from UC Berkeley', '{"Mathematics Teaching Certification", "Physics Teaching License"}', 'I believe in making complex concepts simple and relatable through real-world examples and interactive problem-solving.', 4.8, 25, 156, true, 'English, Spanish', 'both', 7800.00, 20.00, 1950.00, true)
ON CONFLICT (user_id) DO NOTHING;

-- Sample student users for sessions
INSERT INTO users (id, email, password_hash, first_name, last_name, role, profile_picture_url, is_active, email_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'student1@demo.com', '$2b$10$example.hash.here', 'Alice', 'Johnson', 'student', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', true, true),
    ('550e8400-e29b-41d4-a716-446655440003', 'student2@demo.com', '$2b$10$example.hash.here', 'Bob', 'Davis', 'student', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face', true, true),
    ('550e8400-e29b-41d4-a716-446655440004', 'student3@demo.com', '$2b$10$example.hash.here', 'Carol', 'Wilson', 'student', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', true, true),
    ('550e8400-e29b-41d4-a716-446655440005', 'student4@demo.com', '$2b$10$example.hash.here', 'David', 'Brown', 'student', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', true, true)
ON CONFLICT (email) DO NOTHING;

-- Sample tutor subjects
INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level, years_taught) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    s.id,
    CASE 
        WHEN s.name IN ('Mathematics', 'Physics') THEN 'expert'
        WHEN s.name IN ('Chemistry', 'Computer Science') THEN 'advanced'
        ELSE 'intermediate'
    END,
    CASE 
        WHEN s.name IN ('Mathematics', 'Physics') THEN 8
        WHEN s.name IN ('Chemistry', 'Computer Science') THEN 5
        ELSE 3
    END
FROM subjects s 
WHERE s.name IN ('Mathematics', 'Physics', 'Chemistry', 'Computer Science')
ON CONFLICT (tutor_id, subject_id) DO NOTHING;

-- Sample tutoring sessions (mix of completed, scheduled, and upcoming)
WITH subject_ids AS (
    SELECT id, name FROM subjects WHERE name IN ('Mathematics', 'Physics', 'Chemistry', 'Computer Science')
),
student_ids AS (
    SELECT id, first_name, last_name FROM users WHERE role = 'student' AND email LIKE '%demo.com'
)
INSERT INTO tutoring_sessions (
    id, student_id, tutor_id, subject_id, title, description, session_type, 
    scheduled_start, scheduled_end, actual_start, actual_end, status, 
    hourly_rate, payment_amount, session_notes, created_at
)
SELECT 
    gen_random_uuid(),
    s.id,
    '550e8400-e29b-41d4-a716-446655440001',
    sub.id,
    sub.name || ' Session with ' || s.first_name,
    'Regular tutoring session focusing on ' || sub.name || ' concepts and problem solving.',
    'online',
    -- Past completed sessions (last 2 months)
    NOW() - INTERVAL '1 month' + (random() * INTERVAL '30 days'),
    NOW() - INTERVAL '1 month' + (random() * INTERVAL '30 days') + INTERVAL '1 hour',
    NOW() - INTERVAL '1 month' + (random() * INTERVAL '30 days'),
    NOW() - INTERVAL '1 month' + (random() * INTERVAL '30 days') + INTERVAL '1 hour',
    'completed',
    45.00,
    45.00,
    'Great session! Student showed good understanding of the concepts.',
    NOW() - INTERVAL '1 month' + (random() * INTERVAL '30 days')
FROM 
    student_ids s,
    subject_ids sub
WHERE 
    random() < 0.3 -- 30% chance for each student-subject combination
LIMIT 20;

-- Add some upcoming sessions
INSERT INTO tutoring_sessions (
    id, student_id, tutor_id, subject_id, title, description, session_type, 
    scheduled_start, scheduled_end, status, hourly_rate, created_at
)
VALUES 
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 
     'Calculus Review Session', 'Review calculus concepts and solve practice problems', 'online',
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'scheduled', 45.00, NOW()),
    
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1), 
     'Physics Problem Solving', 'Work on mechanics and kinematics problems', 'online',
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'scheduled', 45.00, NOW()),
    
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 
     'Algebra Fundamentals', 'Cover basic algebra concepts and equations', 'online',
     NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '1 hour', 'scheduled', 45.00, NOW());

-- Sample session reviews
INSERT INTO session_reviews (session_id, reviewer_id, reviewer_type, rating, comment, would_recommend, reviewee_id)
SELECT 
    ts.id,
    ts.student_id,
    'student',
    4 + (random())::int, -- Random rating between 4-5
    CASE 
        WHEN random() < 0.5 THEN 'Excellent tutor! Very patient and explains concepts clearly.'
        WHEN random() < 0.7 THEN 'Great session, helped me understand the material much better.'
        ELSE 'Very knowledgeable and helpful. Would definitely recommend!'
    END,
    true,
    ts.tutor_id
FROM tutoring_sessions ts
WHERE ts.status = 'completed' AND ts.tutor_id = '550e8400-e29b-41d4-a716-446655440001'
AND random() < 0.8 -- 80% of completed sessions get reviews
ON CONFLICT (session_id, reviewer_id) DO NOTHING;

-- Sample tutor availability (weekly recurring slots)
INSERT INTO tutor_availability_slots (tutor_id, day_of_week, start_time, end_time, is_available, is_recurring)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 1, '09:00:00', '12:00:00', true, true), -- Monday morning
    ('550e8400-e29b-41d4-a716-446655440001', 1, '14:00:00', '17:00:00', true, true), -- Monday afternoon
    ('550e8400-e29b-41d4-a716-446655440001', 2, '09:00:00', '12:00:00', true, true), -- Tuesday morning
    ('550e8400-e29b-41d4-a716-446655440001', 3, '14:00:00', '18:00:00', true, true), -- Wednesday afternoon
    ('550e8400-e29b-41d4-a716-446655440001', 4, '09:00:00', '12:00:00', true, true), -- Thursday morning
    ('550e8400-e29b-41d4-a716-446655440001', 4, '14:00:00', '17:00:00', true, true), -- Thursday afternoon
    ('550e8400-e29b-41d4-a716-446655440001', 5, '10:00:00', '16:00:00', true, true)  -- Friday
ON CONFLICT DO NOTHING;

-- Update tutor profile statistics based on actual session data
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

-- Create performance metrics for current month
INSERT INTO tutor_performance_metrics (
    tutor_id, year, month, total_sessions, completed_sessions, 
    total_earnings, total_hours, average_rating, total_reviews
)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    EXTRACT(YEAR FROM NOW()),
    EXTRACT(MONTH FROM NOW()),
    COUNT(*) FILTER (WHERE status IN ('completed', 'scheduled', 'in_progress')),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COALESCE(SUM(payment_amount) FILTER (WHERE status = 'completed'), 0),
    COALESCE(SUM(EXTRACT(EPOCH FROM (scheduled_end - scheduled_start))/3600) FILTER (WHERE status = 'completed'), 0),
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
    total_earnings = EXCLUDED.total_earnings,
    total_hours = EXCLUDED.total_hours,
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    updated_at = NOW();

COMMIT;