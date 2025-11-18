-- Insert sample availability data for tutors
-- This will help with testing the booking system

-- Sample availability for tutor with ID 1 (assuming we have tutors in the system)
-- Monday: 9 AM - 5 PM
INSERT INTO tutor_availability_slots (tutor_id, day_of_week, start_time, end_time, is_available, is_recurring)
SELECT 
    u.id,
    1, -- Monday
    '09:00'::time,
    '17:00'::time,
    true,
    true
FROM users u 
WHERE u.role = 'tutor' AND u.is_active = true
ON CONFLICT DO NOTHING;

-- Tuesday: 10 AM - 6 PM
INSERT INTO tutor_availability_slots (tutor_id, day_of_week, start_time, end_time, is_available, is_recurring)
SELECT 
    u.id,
    2, -- Tuesday
    '10:00'::time,
    '18:00'::time,
    true,
    true
FROM users u 
WHERE u.role = 'tutor' AND u.is_active = true
ON CONFLICT DO NOTHING;

-- Wednesday: 9 AM - 5 PM
INSERT INTO tutor_availability_slots (tutor_id, day_of_week, start_time, end_time, is_available, is_recurring)
SELECT 
    u.id,
    3, -- Wednesday
    '09:00'::time,
    '17:00'::time,
    true,
    true
FROM users u 
WHERE u.role = 'tutor' AND u.is_active = true
ON CONFLICT DO NOTHING;

-- Thursday: 11 AM - 7 PM
INSERT INTO tutor_availability_slots (tutor_id, day_of_week, start_time, end_time, is_available, is_recurring)
SELECT 
    u.id,
    4, -- Thursday
    '11:00'::time,
    '19:00'::time,
    true,
    true
FROM users u 
WHERE u.role = 'tutor' AND u.is_active = true
ON CONFLICT DO NOTHING;

-- Friday: 9 AM - 4 PM
INSERT INTO tutor_availability_slots (tutor_id, day_of_week, start_time, end_time, is_available, is_recurring)
SELECT 
    u.id,
    5, -- Friday
    '09:00'::time,
    '16:00'::time,
    true,
    true
FROM users u 
WHERE u.role = 'tutor' AND u.is_active = true
ON CONFLICT DO NOTHING;

-- Saturday: 10 AM - 2 PM (limited weekend availability)
INSERT INTO tutor_availability_slots (tutor_id, day_of_week, start_time, end_time, is_available, is_recurring)
SELECT 
    u.id,
    6, -- Saturday
    '10:00'::time,
    '14:00'::time,
    true,
    true
FROM users u 
WHERE u.role = 'tutor' AND u.is_active = true
LIMIT 5 -- Only some tutors available on weekends
ON CONFLICT DO NOTHING;