-- Create some test sessions to test conflict detection
-- This will create sessions for different tutors on different dates/times

INSERT INTO tutoring_sessions (
    student_id, tutor_id, subject_id, title, description,
    session_type, scheduled_start, scheduled_end, hourly_rate,
    status, meeting_link
)
SELECT 
    (SELECT id FROM users WHERE role = 'student' LIMIT 1),
    u.id,
    (SELECT id FROM subjects LIMIT 1),
    'Test Session - ' || u.first_name,
    'This is a test session to check availability conflicts',
    'online',
    '2025-11-20 10:00:00'::timestamp,
    '2025-11-20 11:00:00'::timestamp,
    COALESCE(tp.hourly_rate, 50.00),
    'scheduled',
    'https://zoom.us/test123'
FROM users u
LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
WHERE u.role = 'tutor' AND u.is_active = true
LIMIT 2;

-- Add another session on a different time for the same tutors
INSERT INTO tutoring_sessions (
    student_id, tutor_id, subject_id, title, description,
    session_type, scheduled_start, scheduled_end, hourly_rate,
    status, meeting_link
)
SELECT 
    (SELECT id FROM users WHERE role = 'student' LIMIT 1),
    u.id,
    (SELECT id FROM subjects LIMIT 1),
    'Test Session 2 - ' || u.first_name,
    'Another test session to check availability conflicts',
    'online',
    '2025-11-21 14:00:00'::timestamp,
    '2025-11-21 15:30:00'::timestamp,
    COALESCE(tp.hourly_rate, 50.00),
    'scheduled',
    'https://zoom.us/test456'
FROM users u
LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
WHERE u.role = 'tutor' AND u.is_active = true
LIMIT 1;