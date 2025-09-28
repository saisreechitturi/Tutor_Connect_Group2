-- Add demo accounts to TutorConnect database
-- Password hash for "demo" generated with bcrypt
-- Password: demo
-- Hash: $2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK

-- INSERT demo student
INSERT INTO users (email, password_hash, first_name, last_name, role, profile_image_url, created_at)
VALUES (
    'student@demo.com',
    '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK',
    'Demo',
    'Student', 
    'student',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- INSERT demo tutor
INSERT INTO users (email, password_hash, first_name, last_name, role, profile_image_url, created_at)
VALUES (
    'tutor@demo.com',
    '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK',
    'Demo',
    'Tutor',
    'tutor', 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- INSERT demo admin
INSERT INTO users (email, password_hash, first_name, last_name, role, profile_image_url, created_at)
VALUES (
    'admin@demo.com',
    '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK',
    'Demo',
    'Admin',
    'admin',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Add tutor profile for demo tutor (only with existing columns)
INSERT INTO tutor_profiles (user_id, hourly_rate, experience_years, rating, total_sessions, created_at)
SELECT 
    u.id,
    25.00,
    3,
    4.5,
    12,
    NOW()
FROM users u 
WHERE u.email = 'tutor@demo.com' 
AND NOT EXISTS (SELECT 1 FROM tutor_profiles WHERE user_id = u.id);

-- Add some sample subjects if they don't exist
INSERT INTO subjects (name, description, category) VALUES 
('Mathematics', 'General mathematics including algebra, geometry, calculus', 'Math'),
('Computer Science', 'Programming, algorithms, data structures', 'Technology')
ON CONFLICT (name) DO NOTHING;

-- Link demo tutor to subjects
INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level)
SELECT tp.user_id, s.id, 'advanced'
FROM tutor_profiles tp, subjects s 
WHERE tp.user_id = (SELECT id FROM users WHERE email = 'tutor@demo.com')
AND s.name IN ('Mathematics', 'Computer Science')
AND NOT EXISTS (
    SELECT 1 FROM tutor_subjects ts 
    WHERE ts.tutor_id = tp.user_id AND ts.subject_id = s.id
);

-- Verify the accounts were created
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    created_at 
FROM users 
WHERE email IN ('student@demo.com', 'tutor@demo.com', 'admin@demo.com')
ORDER BY role, email;