-- =========================================
-- TutorConnect Database Schema Creation
-- =========================================
-- This script creates the complete database schema for the TutorConnect platform
-- WITHOUT any demo data - just the clean database structure

-- =========================================
-- Database Setup and Extensions
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

-- =========================================
-- Database Functions
-- =========================================

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

-- =========================================
-- Core Tables
-- =========================================

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

-- =========================================
-- Profile Tables
-- =========================================

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

-- =========================================
-- Relationship Tables
-- =========================================

CREATE TABLE tutor_subjects (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    tutor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    proficiency_level character varying(50),
    years_taught integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_subjects_proficiency_level_check CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
);

-- =========================================
-- Session Management Tables
-- =========================================

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

-- =========================================
-- Communication Tables
-- =========================================

CREATE TABLE messages (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- Payment Tables
-- =========================================

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

-- =========================================
-- Security Tables
-- =========================================

CREATE TABLE password_reset_tokens (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token_hash character varying(64) NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- Configuration Tables
-- =========================================

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

-- =========================================
-- Task Management Tables
-- =========================================

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

-- =========================================
-- Scheduling Tables
-- =========================================

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

-- =========================================
-- Financial Tracking Tables
-- =========================================

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

-- =========================================
-- Analytics Tables
-- =========================================

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

-- =========================================
-- AI Chat Tables
-- =========================================

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

-- =========================================
-- Database Triggers
-- =========================================

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
-- Database Creation Complete
-- =========================================

SELECT 'TutorConnect database schema created successfully! Ready for use.' as status;