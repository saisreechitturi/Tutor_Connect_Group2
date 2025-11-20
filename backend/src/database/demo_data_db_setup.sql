-- =========================================
-- TutorConnect Complete Database Setup and Demo Data Script
-- =========================================
-- This script creates the complete database schema and inserts comprehensive demo data
-- for testing the TutorConnect platform

-- =========================================
-- STEP 0: Database Schema Creation
-- =========================================

-- Create the database (run this separately if needed)
-- CREATE DATABASE "TutorConnect" WITH TEMPLATE = template0 ENCODING = 'UTF8';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop all tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_sessions CASCADE;
DROP TABLE IF EXISTS student_progress_tracking CASCADE;
DROP TABLE IF EXISTS tutor_performance_metrics CASCADE;
DROP TABLE IF EXISTS tutor_earnings CASCADE;
DROP TABLE IF EXISTS session_reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS tutoring_sessions CASCADE;
DROP TABLE IF EXISTS tutor_subjects CASCADE;
DROP TABLE IF EXISTS tutor_availability_slots CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS tutor_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_ai_chat_session_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_tutor_performance_metrics() CASCADE;
DROP FUNCTION IF EXISTS update_tutor_profile_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_tutor_profile_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update total_sessions and rating when session is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE tutor_profiles 
        SET total_sessions = total_sessions + 1,
            rating = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM session_reviews sr
                JOIN tutoring_sessions ts ON sr.session_id = ts.id
                WHERE ts.tutor_id = NEW.tutor_id
            ), rating)
        WHERE user_id = NEW.tutor_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_tutor_performance_metrics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This function will be called when sessions are completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO tutor_performance_metrics (
            tutor_id, year, month, total_sessions, completed_sessions, 
            total_earnings, total_hours
        )
        VALUES (
            NEW.tutor_id,
            EXTRACT(YEAR FROM NEW.scheduled_start),
            EXTRACT(MONTH FROM NEW.scheduled_start),
            1, 1,
            COALESCE(NEW.payment_amount, 0),
            NEW.duration_minutes / 60.0
        )
        ON CONFLICT (tutor_id, year, month) 
        DO UPDATE SET
            total_sessions = tutor_performance_metrics.total_sessions + 1,
            completed_sessions = tutor_performance_metrics.completed_sessions + 1,
            total_earnings = tutor_performance_metrics.total_earnings + COALESCE(NEW.payment_amount, 0),
            total_hours = tutor_performance_metrics.total_hours + (NEW.duration_minutes / 60.0),
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_ai_chat_session_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE ai_chat_sessions 
    SET updated_at = NOW(),
        total_messages = total_messages + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$;

-- Create all tables
CREATE TABLE users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    email character varying(255) NOT NULL UNIQUE,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    date_of_birth date,
    role character varying(20) NOT NULL,
    profile_picture_url text,
    bio text,
    email_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    address text,
    pincode character varying(20),
    CONSTRAINT users_role_check CHECK (role IN ('student', 'tutor', 'admin'))
);

CREATE TABLE subjects (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name character varying(100) NOT NULL UNIQUE,
    description text,
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    grade_level character varying(50),
    school_name character varying(255),
    learning_goals text,
    preferred_learning_style character varying(50),
    subjects_of_interest text[],
    availability_schedule jsonb,
    emergency_contact jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_profiles_preferred_learning_style_check CHECK (preferred_learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'both'))
);

CREATE TABLE tutor_profiles (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hourly_rate numeric(10,2) NOT NULL,
    years_of_experience integer NOT NULL,
    education_background text,
    certifications text[],
    teaching_philosophy text,
    rating numeric(3,2) DEFAULT 0.00,
    total_students integer DEFAULT 0,
    total_sessions integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    languages_spoken character varying(255),
    preferred_teaching_method character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_earnings numeric(10,2) DEFAULT 0.00,
    weekly_availability_hours numeric(5,2) DEFAULT 0.00,
    monthly_earnings numeric(10,2) DEFAULT 0.00,
    is_available_now boolean DEFAULT true,
    CONSTRAINT tutor_profiles_preferred_teaching_method_check CHECK (preferred_teaching_method IN ('online', 'in_person', 'both')),
    CONSTRAINT tutor_profiles_rating_check CHECK (rating >= 0 AND rating <= 5)
);

CREATE TABLE tutor_subjects (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    tutor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    proficiency_level character varying(50),
    years_taught integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_subjects_proficiency_level_check CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
);

CREATE TABLE tutoring_sessions (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title character varying(255) NOT NULL,
    description text,
    session_type character varying(20) NOT NULL,
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    status character varying(20) DEFAULT 'scheduled',
    hourly_rate numeric(10,2) NOT NULL,
    payment_amount numeric(10,2),
    session_notes text,
    homework_assigned text,
    materials_used text[],
    meeting_link character varying(500),
    meeting_room character varying(255),
    cancellation_reason text,
    cancelled_by uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    session_date timestamp with time zone,
    duration_minutes integer GENERATED ALWAYS AS (EXTRACT(epoch FROM (scheduled_end - scheduled_start)) / 60) STORED,
    CONSTRAINT tutoring_sessions_session_type_check CHECK (session_type IN ('online', 'in_person')),
    CONSTRAINT tutoring_sessions_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'))
);

CREATE TABLE session_reviews (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_type character varying(20) NOT NULL,
    rating integer NOT NULL,
    comment text,
    would_recommend boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reviewee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT session_reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT session_reviews_reviewer_type_check CHECK (reviewer_type IN ('student', 'tutor')),
    UNIQUE(session_id, reviewer_id)
);

CREATE TABLE messages (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    session_id uuid REFERENCES tutoring_sessions(id) ON DELETE SET NULL,
    payer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'mock' NOT NULL,
    status character varying(20) DEFAULT 'completed',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
    currency character varying(3) DEFAULT 'USD',
    description text DEFAULT 'Mock payment',
    CONSTRAINT payments_status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE TABLE password_reset_tokens (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token_hash character varying(64) NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    key character varying(100) NOT NULL UNIQUE,
    value text NOT NULL,
    description text,
    category character varying(50) DEFAULT 'general',
    data_type character varying(20) DEFAULT 'string',
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT settings_data_type_check CHECK (data_type IN ('string', 'number', 'boolean', 'json'))
);

CREATE TABLE tasks (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title character varying(255) NOT NULL,
    description text,
    priority character varying(20) DEFAULT 'medium',
    status character varying(20) DEFAULT 'pending',
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    estimated_hours numeric(5,2),
    tags text[],
    progress_percentage integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    subject character varying(100),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT tasks_progress_percentage_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE tutor_availability_slots (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    tutor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_recurring boolean DEFAULT true NOT NULL,
    specific_date date,
    CONSTRAINT check_time_range CHECK (end_time > start_time),
    CONSTRAINT tutor_availability_slots_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

CREATE TABLE tutor_earnings (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    tutor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    gross_amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    net_amount numeric(10,2) NOT NULL,
    payment_status character varying(20) DEFAULT 'pending',
    payout_date timestamp with time zone,
    tax_year integer,
    currency character varying(3) DEFAULT 'USD',
    exchange_rate numeric(10,4) DEFAULT 1.0000,
    payment_method character varying(50),
    transaction_reference character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_earnings_payment_status_check CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled'))
);

CREATE TABLE tutor_performance_metrics (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    tutor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year integer NOT NULL,
    month integer NOT NULL,
    total_sessions integer DEFAULT 0,
    completed_sessions integer DEFAULT 0,
    cancelled_sessions integer DEFAULT 0,
    no_show_sessions integer DEFAULT 0,
    total_earnings numeric(10,2) DEFAULT 0.00,
    total_hours numeric(8,2) DEFAULT 0.00,
    average_rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    response_time_hours numeric(5,2) DEFAULT 0.00,
    new_students integer DEFAULT 0,
    returning_students integer DEFAULT 0,
    satisfaction_score numeric(3,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_performance_metrics_month_check CHECK (month >= 1 AND month <= 12),
    UNIQUE(tutor_id, year, month)
);

CREATE TABLE student_progress_tracking (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tutor_id uuid REFERENCES users(id) ON DELETE SET NULL,
    skill_name character varying(255) NOT NULL,
    proficiency_level character varying(50) NOT NULL,
    progress_percentage integer DEFAULT 0,
    last_assessment_date timestamp with time zone,
    next_milestone character varying(255),
    strengths text[],
    areas_for_improvement text[],
    learning_resources jsonb,
    parent_feedback text,
    tutor_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_progress_tracking_proficiency_level_check CHECK (proficiency_level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'expert')),
    CONSTRAINT student_progress_tracking_progress_percentage_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

CREATE TABLE ai_chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title character varying(255) DEFAULT 'New Chat',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    total_messages integer DEFAULT 0
);

CREATE TABLE ai_chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type character varying(20) NOT NULL,
    content text NOT NULL,
    model_used character varying(100),
    tokens_used integer,
    response_time_ms integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_chat_messages_message_type_check CHECK (message_type IN ('user', 'assistant'))
);

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_profiles_updated_at BEFORE UPDATE ON tutor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutoring_sessions_updated_at BEFORE UPDATE ON tutoring_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_reviews_updated_at BEFORE UPDATE ON session_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_password_reset_tokens_updated_at BEFORE UPDATE ON password_reset_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_availability_slots_updated_at BEFORE UPDATE ON tutor_availability_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_earnings_updated_at BEFORE UPDATE ON tutor_earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_performance_metrics_updated_at BEFORE UPDATE ON tutor_performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_progress_tracking_updated_at BEFORE UPDATE ON student_progress_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business logic triggers
CREATE TRIGGER update_tutor_profile_stats_trigger AFTER UPDATE ON tutoring_sessions FOR EACH ROW EXECUTE FUNCTION update_tutor_profile_stats();
CREATE TRIGGER update_tutor_performance_metrics_trigger AFTER UPDATE ON tutoring_sessions FOR EACH ROW EXECUTE FUNCTION update_tutor_performance_metrics();
CREATE TRIGGER update_ai_chat_session_trigger AFTER INSERT ON ai_chat_messages FOR EACH ROW EXECUTE FUNCTION update_ai_chat_session_timestamp();

-- =========================================
-- STEP 1: Clear all existing data (if any)
-- =========================================

-- Delete all data in proper order (respecting foreign key constraints)
DELETE FROM ai_chat_messages;
DELETE FROM ai_chat_sessions;
DELETE FROM student_progress_tracking;
DELETE FROM tutor_performance_metrics;
DELETE FROM tutor_earnings;
DELETE FROM session_reviews;
DELETE FROM payments;
DELETE FROM messages;
DELETE FROM tutoring_sessions;
DELETE FROM tutor_subjects;
DELETE FROM tutor_availability_slots;
DELETE FROM tasks;
DELETE FROM password_reset_tokens;
DELETE FROM settings;
DELETE FROM tutor_profiles;
DELETE FROM student_profiles;
DELETE FROM subjects;
DELETE FROM users;

-- Reset all sequences to start from 1
ALTER SEQUENCE IF EXISTS ai_chat_messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ai_chat_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS student_progress_tracking_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tutor_performance_metrics_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tutor_earnings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS session_reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tutoring_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tutor_subjects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tutor_availability_slots_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS password_reset_tokens_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS settings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tutor_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS student_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS subjects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- =========================================
-- STEP 2: Insert Demo Data
-- =========================================

-- Insert Subjects first (referenced by other tables)
INSERT INTO subjects (id, name, description, category, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Mathematics', 'Comprehensive mathematics tutoring from basic arithmetic to advanced calculus', 'STEM', true),
('550e8400-e29b-41d4-a716-446655440002', 'Physics', 'Physics concepts from high school to university level', 'STEM', true),
('550e8400-e29b-41d4-a716-446655440003', 'Chemistry', 'General chemistry, organic chemistry, and biochemistry', 'STEM', true),
('550e8400-e29b-41d4-a716-446655440004', 'English Literature', 'English literature, writing, and language arts', 'Language Arts', true),
('550e8400-e29b-41d4-a716-446655440005', 'Computer Science', 'Programming, algorithms, data structures, and software development', 'STEM', true),
('550e8400-e29b-41d4-a716-446655440006', 'History', 'World history, US history, and social studies', 'Social Studies', true),
('550e8400-e29b-41d4-a716-446655440007', 'Spanish', 'Spanish language learning from beginner to advanced', 'Languages', true),
('550e8400-e29b-41d4-a716-446655440008', 'Biology', 'General biology, anatomy, and life sciences', 'STEM', true);

-- Insert Users (1 Admin, 2 Tutors, 2 Students)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, bio, email_verified, is_active, address, pincode) VALUES
-- Admin Account
('550e8400-e29b-41d4-a716-446655440100', 'admin@demo.com', '$2b$12$zqR4dOeTuvEAWvrfoUDvj.VYU7ecBuI5Wy2FYbH09QJ.jh/0akYYa', 'Sarah', 'Johnson', '+1-555-0101', '1985-03-15', 'admin', 'Platform administrator with 8+ years experience in educational technology and student success.', true, true, '123 Admin Street, Tech City, CA', '90210'),

-- Tutor Accounts
('550e8400-e29b-41d4-a716-446655440101', 't1@demo.com', '$2b$12$zqR4dOeTuvEAWvrfoUDvj.VYU7ecBuI5Wy2FYbH09QJ.jh/0akYYa', 'John', 'Smith', '+1-555-0102', '1988-07-22', 'tutor', 'Experienced mathematics and physics tutor with PhD in Applied Mathematics. Passionate about helping students understand complex concepts through practical examples.', true, true, '456 Tutor Lane, Education City, NY', '10001'),

('550e8400-e29b-41d4-a716-446655440102', 't2@demo.com', '$2b$12$zqR4dOeTuvEAWvrfoUDvj.VYU7ecBuI5Wy2FYbH09QJ.jh/0akYYa', 'Emily', 'Davis', '+1-555-0103', '1990-11-08', 'tutor', 'Computer Science and English Literature tutor with 6 years of teaching experience. Specializes in programming fundamentals and creative writing.', true, true, '789 Knowledge Ave, Study Town, TX', '75001'),

-- Student Accounts
('550e8400-e29b-41d4-a716-446655440201', 's1@demo.com', '$2b$12$zqR4dOeTuvEAWvrfoUDvj.VYU7ecBuI5Wy2FYbH09QJ.jh/0akYYa', 'Alex', 'Wilson', '+1-555-0201', '2005-09-12', 'student', 'High school junior interested in STEM fields, particularly mathematics and computer science. Goal is to pursue engineering in college.', true, true, '321 Student St, Learning City, FL', '33101'),

('550e8400-e29b-41d4-a716-446655440202', 's2@demo.com', '$2b$12$zqR4dOeTuvEAWvrfoUDvj.VYU7ecBuI5Wy2FYbH09QJ.jh/0akYYa', 'Sophia', 'Brown', '+1-555-0202', '2006-04-25', 'student', 'High school sophomore focusing on literature and languages. Enjoys creative writing and plans to study journalism or communications.', true, true, '654 Learner Blvd, Study Valley, WA', '98101');

-- Insert Student Profiles
INSERT INTO student_profiles (id, user_id, grade_level, school_name, learning_goals, preferred_learning_style, subjects_of_interest, availability_schedule, emergency_contact) VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '11th Grade', 'Lincoln High School', 'Improve math grades, prepare for SAT, learn programming basics', 'visual', ARRAY['Mathematics', 'Computer Science', 'Physics'], 
 '{"monday": ["16:00-18:00"], "tuesday": ["16:00-18:00"], "wednesday": ["16:00-18:00"], "thursday": ["16:00-18:00"], "friday": ["16:00-17:00"], "saturday": ["10:00-14:00"], "sunday": ["13:00-16:00"]}',
 '{"name": "Robert Wilson", "relationship": "Father", "phone": "+1-555-0301", "email": "robert.wilson@email.com"}'),

('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440202', '10th Grade', 'Washington High School', 'Improve writing skills, learn Spanish, enhance reading comprehension', 'auditory', ARRAY['English Literature', 'Spanish', 'History'],
 '{"monday": ["15:30-17:30"], "tuesday": ["15:30-17:30"], "wednesday": ["15:30-17:30"], "thursday": ["15:30-17:30"], "friday": ["15:30-16:30"], "saturday": ["09:00-12:00"], "sunday": ["14:00-17:00"]}',
 '{"name": "Maria Brown", "relationship": "Mother", "phone": "+1-555-0302", "email": "maria.brown@email.com"}');

-- Insert Tutor Profiles
INSERT INTO tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, total_earnings, weekly_availability_hours, monthly_earnings, is_available_now) VALUES
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440101', 75.00, 8, 'PhD in Applied Mathematics from MIT, MS in Physics from Stanford University', ARRAY['Certified Mathematics Teacher', 'Physics Education Specialist', 'Online Teaching Certificate'], 'I believe in making complex concepts accessible through real-world applications and interactive problem-solving. Every student learns differently, and my approach adapts to individual learning styles.', 4.85, 45, 123, true, 'English, Spanish', 'both', 9225.00, 25.0, 3075.00, true),

('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440102', 65.00, 6, 'MS in Computer Science from UC Berkeley, BA in English Literature from UCLA', ARRAY['Google Cloud Certified', 'Creative Writing Certificate', 'ESL Teaching Qualification'], 'Learning should be engaging and practical. I combine technical skills with creative thinking to help students develop both analytical and communication abilities.', 4.92, 38, 98, true, 'English, French', 'both', 6370.00, 22.0, 2423.33, true);

-- Insert Tutor Subjects (linking tutors to subjects they teach)
INSERT INTO tutor_subjects (id, tutor_id, subject_id, proficiency_level, years_taught) VALUES
-- John Smith (Mathematics & Physics)
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'expert', 8),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440002', 'expert', 6),
('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', 'advanced', 4),

-- Emily Davis (Computer Science & English Literature)
('550e8400-e29b-41d4-a716-446655440504', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440005', 'expert', 6),
('550e8400-e29b-41d4-a716-446655440505', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440004', 'expert', 5),
('550e8400-e29b-41d4-a716-446655440506', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440007', 'intermediate', 3);

-- Insert Tutor Availability Slots
INSERT INTO tutor_availability_slots (id, tutor_id, day_of_week, start_time, end_time, is_available, is_recurring, specific_date) VALUES
-- John Smith availability (Monday=1, Tuesday=2, etc.)
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440101', 1, '09:00:00', '17:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440101', 2, '09:00:00', '17:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440101', 3, '09:00:00', '17:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440101', 4, '09:00:00', '17:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440605', '550e8400-e29b-41d4-a716-446655440101', 5, '09:00:00', '15:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440606', '550e8400-e29b-41d4-a716-446655440101', 6, '10:00:00', '14:00:00', true, true, NULL),

-- Emily Davis availability
('550e8400-e29b-41d4-a716-446655440607', '550e8400-e29b-41d4-a716-446655440102', 1, '10:00:00', '18:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440608', '550e8400-e29b-41d4-a716-446655440102', 2, '10:00:00', '18:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440609', '550e8400-e29b-41d4-a716-446655440102', 3, '10:00:00', '18:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440610', '550e8400-e29b-41d4-a716-446655440102', 4, '10:00:00', '18:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440611', '550e8400-e29b-41d4-a716-446655440102', 5, '10:00:00', '16:00:00', true, true, NULL),
('550e8400-e29b-41d4-a716-446655440612', '550e8400-e29b-41d4-a716-446655440102', 0, '11:00:00', '15:00:00', true, true, NULL);

-- Insert Tutoring Sessions (mix of completed, scheduled, and cancelled)
INSERT INTO tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, payment_amount, session_notes, homework_assigned, materials_used, meeting_link, cancellation_reason, cancelled_by) VALUES
-- Completed sessions
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Algebra II - Quadratic Equations', 'Focus on solving quadratic equations using multiple methods', 'online', '2024-11-15 16:00:00+00', '2024-11-15 17:00:00+00', '2024-11-15 16:02:00+00', '2024-11-15 17:05:00+00', 'completed', 75.00, 75.00, 'Alex showed great improvement in understanding quadratic formula. Worked through 8 practice problems successfully.', 'Practice problems 1-15 from Chapter 9, review factoring methods', ARRAY['Whiteboard', 'Algebra textbook', 'Graphing calculator'], 'https://zoom.us/j/123456789', NULL, NULL),

('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440004', 'Essay Writing Techniques', 'Improving essay structure and argumentation skills', 'online', '2024-11-14 15:30:00+00', '2024-11-14 16:30:00+00', '2024-11-14 15:30:00+00', '2024-11-14 16:32:00+00', 'completed', 65.00, 65.00, 'Sophia demonstrated excellent understanding of thesis statements. We worked on paragraph transitions and evidence integration.', 'Write a 5-paragraph essay on chosen topic from list provided', ARRAY['Writing guide', 'Sample essays', 'Grammar checklist'], 'https://zoom.us/j/987654321', NULL, NULL),

('550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440005', 'Python Programming Basics', 'Introduction to Python syntax and basic programming concepts', 'online', '2024-11-13 17:00:00+00', '2024-11-13 18:00:00+00', '2024-11-13 17:00:00+00', '2024-11-13 18:00:00+00', 'completed', 65.00, 65.00, 'Great first session! Alex quickly grasped variables, data types, and basic input/output. Very enthusiastic learner.', 'Complete Python basics exercises 1-20, install Python IDE', ARRAY['Python tutorial', 'Code editor', 'Programming exercises'], 'https://zoom.us/j/456789123', NULL, NULL),

-- Scheduled upcoming sessions
('550e8400-e29b-41d4-a716-446655440704', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440002', 'Physics - Motion and Forces', 'Newtonian mechanics and force analysis', 'online', '2024-11-22 16:00:00+00', '2024-11-22 17:00:00+00', NULL, NULL, 'scheduled', 75.00, NULL, NULL, NULL, NULL, 'https://zoom.us/j/321654987', NULL, NULL),

('550e8400-e29b-41d4-a716-446655440705', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440007', 'Spanish Conversation Practice', 'Practice speaking and listening skills', 'online', '2024-11-23 15:30:00+00', '2024-11-23 16:30:00+00', NULL, NULL, 'scheduled', 65.00, NULL, NULL, NULL, NULL, 'https://zoom.us/j/654987321', NULL, NULL),

-- One cancelled session
('550e8400-e29b-41d4-a716-446655440706', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Calculus Review', 'Review of derivatives and integrals', 'online', '2024-11-16 16:00:00+00', '2024-11-16 17:00:00+00', NULL, NULL, 'cancelled', 75.00, NULL, NULL, NULL, NULL, NULL, 'Student had family emergency', '550e8400-e29b-41d4-a716-446655440201');

-- Insert Session Reviews
INSERT INTO session_reviews (id, session_id, reviewer_id, reviewer_type, rating, comment, would_recommend, reviewee_id) VALUES
('550e8400-e29b-41d4-a716-446655440801', '550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440201', 'student', 5, 'John is an amazing tutor! He explained quadratic equations in a way that finally made sense to me. Very patient and encouraging.', true, '550e8400-e29b-41d4-a716-446655440101'),

('550e8400-e29b-41d4-a716-446655440802', '550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440101', 'tutor', 4, 'Alex is a dedicated student who comes prepared to every session. Shows great improvement and asks thoughtful questions.', true, '550e8400-e29b-41d4-a716-446655440201'),

('550e8400-e29b-41d4-a716-446655440803', '550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440202', 'student', 5, 'Emily helped me understand essay structure so much better. My writing has improved significantly since our sessions started.', true, '550e8400-e29b-41d4-a716-446655440102'),

('550e8400-e29b-41d4-a716-446655440804', '550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440102', 'tutor', 5, 'Sophia is an excellent student with natural writing talent. She implements feedback quickly and shows creativity in her work.', true, '550e8400-e29b-41d4-a716-446655440202'),

('550e8400-e29b-41d4-a716-446655440805', '550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440201', 'student', 4, 'Emily made programming fun and easy to understand. Looking forward to learning more advanced concepts!', true, '550e8400-e29b-41d4-a716-446655440102');

-- Insert Payments
INSERT INTO payments (id, session_id, payer_id, recipient_id, amount, payment_method, status, currency, description) VALUES
('550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 75.00, 'mock_payment', 'completed', 'USD', 'Payment for Algebra II tutoring session'),
('550e8400-e29b-41d4-a716-446655440902', '550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 65.00, 'mock_payment', 'completed', 'USD', 'Payment for Essay Writing session'),
('550e8400-e29b-41d4-a716-446655440903', '550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440102', 65.00, 'mock_payment', 'completed', 'USD', 'Payment for Python Programming session');

-- Insert Tutor Earnings
INSERT INTO tutor_earnings (id, tutor_id, session_id, gross_amount, platform_fee, net_amount, payment_status, payout_date, tax_year, currency) VALUES
('550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440701', 75.00, 7.50, 67.50, 'paid', '2024-11-16 10:00:00+00', 2024, 'USD'),
('550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440702', 65.00, 6.50, 58.50, 'paid', '2024-11-15 10:00:00+00', 2024, 'USD'),
('550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440703', 65.00, 6.50, 58.50, 'paid', '2024-11-14 10:00:00+00', 2024, 'USD');

-- Insert Tutor Performance Metrics
INSERT INTO tutor_performance_metrics (id, tutor_id, year, month, total_sessions, completed_sessions, cancelled_sessions, total_earnings, total_hours, average_rating, total_reviews) VALUES
('550e8400-e29b-41d4-a716-446655441101', '550e8400-e29b-41d4-a716-446655440101', 2024, 11, 2, 1, 1, 75.00, 1.08, 4.50, 2),
('550e8400-e29b-41d4-a716-446655441102', '550e8400-e29b-41d4-a716-446655440102', 2024, 11, 2, 2, 0, 130.00, 2.05, 4.67, 3);

-- Insert Messages (conversations between users)
INSERT INTO messages (id, sender_id, recipient_id, content) VALUES
-- Conversation between Alex (student) and John (tutor)
('550e8400-e29b-41d4-a716-446655441201', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 'Hi John! I have a question about the quadratic equations homework you assigned. Could you help me with problem #12?'),
('550e8400-e29b-41d4-a716-446655441202', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', 'Of course, Alex! Problem #12 is a bit tricky. Let me walk you through it. First, try to identify the coefficients a, b, and c in the equation.'),
('550e8400-e29b-41d4-a716-446655441203', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 'I think a=2, b=-7, and c=3. Is that correct?'),
('550e8400-e29b-41d4-a716-446655441204', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', 'Perfect! Now use the quadratic formula. Remember: x = (-b ± √(b²-4ac)) / 2a'),

-- Conversation between Sophia (student) and Emily (tutor)
('550e8400-e29b-41d4-a716-446655441205', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 'Hi Emily! I finished my essay draft. Could you review it before our next session?'),
('550e8400-e29b-41d4-a716-446655441206', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440202', 'Hi Sophia! I''d be happy to review it. Please send it as a Google Doc so I can add comments.'),
('550e8400-e29b-41d4-a716-446655441207', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 'Just shared the document with you. The topic is about climate change impacts on coastal communities.'),
('550e8400-e29b-41d4-a716-446655441208', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440202', 'Great topic choice! I''ll review it tonight and we can discuss my feedback in tomorrow''s session.');

-- Insert Tasks (study tasks for students)
INSERT INTO tasks (id, user_id, title, description, priority, status, due_date, estimated_hours, tags, progress_percentage, subject) VALUES
-- Alex's tasks
('550e8400-e29b-41d4-a716-446655441301', '550e8400-e29b-41d4-a716-446655440201', 'Complete Algebra II Homework', 'Finish problems 1-20 from Chapter 9 on quadratic equations', 'high', 'in_progress', '2024-11-23 23:59:00+00', 2.0, ARRAY['homework', 'math', 'quadratic'], 75, 'Mathematics'),
('550e8400-e29b-41d4-a716-446655441302', '550e8400-e29b-41d4-a716-446655440201', 'Python Practice Exercises', 'Complete exercises 1-20 from Python basics tutorial', 'medium', 'pending', '2024-11-25 23:59:00+00', 3.0, ARRAY['programming', 'python', 'practice'], 0, 'Computer Science'),
('550e8400-e29b-41d4-a716-446655441303', '550e8400-e29b-41d4-a716-446655440201', 'Prepare for Physics Test', 'Study motion and forces chapter, review practice problems', 'urgent', 'in_progress', '2024-11-24 08:00:00+00', 4.0, ARRAY['test', 'physics', 'study'], 40, 'Physics'),
('550e8400-e29b-41d4-a716-446655441304', '550e8400-e29b-41d4-a716-446655440201', 'SAT Math Practice', 'Complete one full SAT math section practice test', 'medium', 'completed', '2024-11-20 23:59:00+00', 1.5, ARRAY['SAT', 'test-prep', 'math'], 100, 'Mathematics'),

-- Sophia's tasks
('550e8400-e29b-41d4-a716-446655441305', '550e8400-e29b-41d4-a716-446655440202', 'Write Climate Change Essay', 'Write 5-paragraph essay on climate change impacts', 'high', 'completed', '2024-11-21 23:59:00+00', 3.0, ARRAY['essay', 'writing', 'climate'], 100, 'English Literature'),
('550e8400-e29b-41d4-a716-446655441306', '550e8400-e29b-41d4-a716-446655440202', 'Spanish Vocabulary Study', 'Learn 50 new vocabulary words from Chapter 8', 'medium', 'in_progress', '2024-11-26 23:59:00+00', 2.0, ARRAY['vocabulary', 'spanish', 'language'], 60, 'Spanish'),
('550e8400-e29b-41d4-a716-446655441307', '550e8400-e29b-41d4-a716-446655440202', 'Read Pride and Prejudice', 'Read chapters 10-15 and take notes on character development', 'low', 'pending', '2024-11-28 23:59:00+00', 4.0, ARRAY['reading', 'literature', 'classic'], 0, 'English Literature'),
('550e8400-e29b-41d4-a716-446655441308', '550e8400-e29b-41d4-a716-446655440202', 'History Research Project', 'Research and outline project on World War II impacts', 'medium', 'pending', '2024-12-01 23:59:00+00', 6.0, ARRAY['research', 'history', 'project'], 10, 'History');

-- Insert AI Chat Sessions
INSERT INTO ai_chat_sessions (id, user_id, title, total_messages, is_active) VALUES
('550e8400-e29b-41d4-a716-446655441401', '550e8400-e29b-41d4-a716-446655440201', 'Math Help - Quadratic Equations', 8, true),
('550e8400-e29b-41d4-a716-446655441402', '550e8400-e29b-41d4-a716-446655440202', 'Essay Writing Tips', 6, true),
('550e8400-e29b-41d4-a716-446655441403', '550e8400-e29b-41d4-a716-446655440201', 'Python Programming Questions', 4, false),
('550e8400-e29b-41d4-a716-446655441404', '550e8400-e29b-41d4-a716-446655440202', 'Spanish Grammar Help', 10, true);

-- Insert AI Chat Messages
INSERT INTO ai_chat_messages (id, session_id, user_id, message_type, content, model_used, tokens_used, response_time_ms) VALUES
-- Alex's math help session
('550e8400-e29b-41d4-a716-446655441501', '550e8400-e29b-41d4-a716-446655441401', '550e8400-e29b-41d4-a716-446655440201', 'user', 'I''m struggling with quadratic equations. Can you help me understand the quadratic formula?', NULL, NULL, NULL),
('550e8400-e29b-41d4-a716-446655441502', '550e8400-e29b-41d4-a716-446655441401', '550e8400-e29b-41d4-a716-446655440201', 'assistant', 'I''d be happy to help you with quadratic equations! The quadratic formula is: x = (-b ± √(b²-4ac)) / 2a\n\nThis formula helps you find the solutions (roots) of any quadratic equation in the form ax² + bx + c = 0.\n\nLet me break it down:\n- a, b, and c are the coefficients from your equation\n- The ± symbol means you''ll get two solutions\n- The discriminant (b²-4ac) tells you about the nature of the roots\n\nWould you like me to walk through an example?', 'llama-3.1-8b-instant', 156, 1250),
('550e8400-e29b-41d4-a716-446655441503', '550e8400-e29b-41d4-a716-446655441401', '550e8400-e29b-41d4-a716-446655440201', 'user', 'Yes, please! Can you solve x² - 5x + 6 = 0?', NULL, NULL, NULL),
('550e8400-e29b-41d4-a716-446655441504', '550e8400-e29b-41d4-a716-446655441401', '550e8400-e29b-41d4-a716-446655440201', 'assistant', 'Great example! Let''s solve x² - 5x + 6 = 0 step by step.\n\nFirst, identify the coefficients:\n- a = 1 (coefficient of x²)\n- b = -5 (coefficient of x)\n- c = 6 (constant term)\n\nNow apply the quadratic formula:\nx = (-(-5) ± √((-5)² - 4(1)(6))) / 2(1)\nx = (5 ± √(25 - 24)) / 2\nx = (5 ± √1) / 2\nx = (5 ± 1) / 2\n\nSo we get two solutions:\nx₁ = (5 + 1) / 2 = 6/2 = 3\nx₂ = (5 - 1) / 2 = 4/2 = 2\n\nTherefore, x = 3 or x = 2. You can verify: 3² - 5(3) + 6 = 9 - 15 + 6 = 0 ✓', 'llama-3.1-8b-instant', 201, 1450),

-- Sophia's essay writing session
('550e8400-e29b-41d4-a716-446655441505', '550e8400-e29b-41d4-a716-446655441402', '550e8400-e29b-41d4-a716-446655440202', 'user', 'I need help writing a strong thesis statement for my climate change essay. Any tips?', NULL, NULL, NULL),
('550e8400-e29b-41d4-a716-446655441506', '550e8400-e29b-41d4-a716-446655441402', '550e8400-e29b-41d4-a716-446655440202', 'assistant', 'Absolutely! A strong thesis statement is crucial for a compelling essay. Here are key tips for writing an effective thesis:\n\n**What makes a strong thesis:**\n1. **Specific and focused** - Avoid vague statements\n2. **Arguable** - Present a position that can be debated\n3. **Clear and concise** - Usually 1-2 sentences\n4. **Roadmap** - Preview your main points\n\n**For your climate change essay, consider:**\n- What specific aspect are you focusing on? (sea level rise, extreme weather, economic impacts?)\n- What''s your main argument or position?\n- What evidence will you present?\n\n**Example thesis:**\n"Climate change poses an immediate threat to coastal communities through accelerated sea level rise, increased storm intensity, and economic displacement, requiring urgent adaptation strategies to protect vulnerable populations."\n\nWhat specific angle are you taking in your essay?', 'llama-3.1-8b-instant', 178, 1320);

-- Insert Student Progress Tracking
INSERT INTO student_progress_tracking (id, student_id, subject_id, tutor_id, skill_name, proficiency_level, progress_percentage, last_assessment_date, next_milestone, strengths, areas_for_improvement, tutor_notes) VALUES
('550e8400-e29b-41d4-a716-446655441601', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'Quadratic Equations', 'intermediate', 75, '2024-11-15 17:00:00+00', 'Master complex quadratic word problems', ARRAY['Strong algebraic manipulation', 'Good problem-solving approach', 'Persistent when challenged'], ARRAY['Speed in calculations', 'Confidence in word problems'], 'Alex shows excellent understanding of the quadratic formula and can solve most standard problems. Need to work on application problems and building speed.'),

('550e8400-e29b-41d4-a716-446655441602', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440102', 'Python Basics', 'beginner', 30, '2024-11-13 18:00:00+00', 'Complete basic syntax and control structures', ARRAY['Quick learner', 'Good logical thinking', 'Enthusiastic about programming'], ARRAY['Syntax memorization', 'Debugging skills'], 'Alex is very motivated to learn programming. Grasps concepts quickly but needs more practice with syntax and debugging simple errors.'),

('550e8400-e29b-41d4-a716-446655441603', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440102', 'Essay Writing', 'intermediate', 80, '2024-11-14 16:30:00+00', 'Advanced argumentation and research integration', ARRAY['Excellent creativity', 'Strong vocabulary', 'Good thesis development'], ARRAY['Paragraph transitions', 'Citation formatting'], 'Sophia has natural writing talent. Her ideas are creative and well-developed. Working on technical aspects like transitions and proper citation methods.'),

('550e8400-e29b-41d4-a716-446655441604', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440102', 'Spanish Conversation', 'elementary', 45, '2024-11-10 16:00:00+00', 'Improve fluency in basic conversations', ARRAY['Good pronunciation', 'Eager to practice', 'Strong vocabulary retention'], ARRAY['Verb conjugations', 'Speaking confidence'], 'Sophia is making steady progress in Spanish. Her pronunciation is excellent, but she needs more practice with verb conjugations and building confidence in speaking.');

-- Insert Settings (platform configuration)
INSERT INTO settings (id, key, value, description, category, data_type, is_public) VALUES
('550e8400-e29b-41d4-a716-446655441701', 'platform_name', 'TutorConnect', 'Name of the tutoring platform', 'general', 'string', true),
('550e8400-e29b-41d4-a716-446655441702', 'default_session_duration', '60', 'Default tutoring session duration in minutes', 'sessions', 'number', false),
('550e8400-e29b-41d4-a716-446655441703', 'platform_fee_percentage', '10', 'Platform fee percentage for completed sessions', 'payments', 'number', false),
('550e8400-e29b-41d4-a716-446655441704', 'max_cancellation_hours', '24', 'Maximum hours before session for free cancellation', 'sessions', 'number', true),
('550e8400-e29b-41d4-a716-446655441705', 'ai_model_name', 'llama-3.1-8b-instant', 'AI model used for chat assistance', 'ai', 'string', false),
('550e8400-e29b-41d4-a716-446655441706', 'enable_ai_chat', 'true', 'Enable AI chat assistant feature', 'ai', 'boolean', false),
('550e8400-e29b-41d4-a716-446655441707', 'support_email', 'support@tutorconnect.com', 'Platform support email address', 'general', 'string', true),
('550e8400-e29b-41d4-a716-446655441708', 'min_tutor_hourly_rate', '25', 'Minimum hourly rate for tutors in USD', 'payments', 'number', true),
('550e8400-e29b-41d4-a716-446655441709', 'max_tutor_hourly_rate', '200', 'Maximum hourly rate for tutors in USD', 'payments', 'number', true);

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
-- Run these to verify the data was inserted correctly

-- Check user counts by role
-- SELECT role, COUNT(*) as user_count FROM users GROUP BY role;

-- Check tutoring sessions by status
-- SELECT status, COUNT(*) as session_count FROM tutoring_sessions GROUP BY status;

-- Check total earnings and sessions for tutors
-- SELECT 
--     u.first_name, u.last_name,
--     tp.total_sessions, tp.total_earnings, tp.rating
-- FROM users u 
-- JOIN tutor_profiles tp ON u.id = tp.user_id 
-- WHERE u.role = 'tutor';

-- Check AI chat activity
-- SELECT 
--     u.first_name, u.last_name,
--     COUNT(acs.id) as chat_sessions,
--     SUM(acs.total_messages) as total_messages
-- FROM users u 
-- LEFT JOIN ai_chat_sessions acs ON u.id = acs.user_id
-- WHERE u.role IN ('student', 'tutor')
-- GROUP BY u.id, u.first_name, u.last_name;

-- =========================================
-- Demo Data Summary
-- =========================================
-- 
-- USERS CREATED:
-- • 1 Admin: Sarah Johnson (admin@tutorconnect.com)
-- • 2 Tutors: John Smith (Math/Physics), Emily Davis (CS/English)  
-- • 2 Students: Alex Wilson (STEM focus), Sophia Brown (Literature focus)
--
-- SESSIONS & ACTIVITY:
-- • 6 tutoring sessions (3 completed, 2 scheduled, 1 cancelled)
-- • 5 session reviews with ratings 4-5 stars
-- • 3 completed payments processed
-- • 8 messages exchanged between students and tutors
-- • 8 student tasks (mix of pending, in-progress, completed)
-- • 4 AI chat sessions with realistic conversations
-- • Comprehensive tutor availability schedules
-- • Student progress tracking with detailed assessments
--
-- All demo accounts use password: Demo1234
-- (Password hash: $2b$12$zqR4dOeTuvEAWvrfoUDvj.VYU7ecBuI5Wy2FYbH09QJ.jh/0akYYa)
--
-- DEMO ACCOUNT EMAILS:
-- Admin: admin@demo.com
-- Tutors: t1@demo.com, t2@demo.com
-- Students: s1@demo.com, s2@demo.com
--
-- =========================================

SELECT 'Demo data insertion completed successfully!' as status;