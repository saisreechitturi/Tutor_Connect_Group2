--
-- TutorConnect Complete Database Restore File
-- Generated: 2025-11-11
-- 
-- This file contains both schema and data for complete database restoration
-- Compatible with pgAdmin4 restore functionality
--

-- =====================================================
-- DATABASE CONFIGURATION
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Set search path to public schema
SET search_path = public;

-- =====================================================
-- EXTENSIONS AND FUNCTIONS
-- =====================================================

-- Ensure public schema exists and is owned correctly
CREATE SCHEMA IF NOT EXISTS public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Function to update tutor performance metrics
CREATE OR REPLACE FUNCTION public.update_tutor_performance_metrics() RETURNS trigger
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
            EXTRACT(YEAR FROM NEW.session_date),
            EXTRACT(MONTH FROM NEW.session_date),
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

-- Function to update tutor profile stats
CREATE OR REPLACE FUNCTION public.update_tutor_profile_stats() RETURNS trigger
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

-- =====================================================
-- TABLES CREATION
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
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
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'tutor'::character varying, 'admin'::character varying])::text[])))
);

-- User addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    country character varying(100) NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_addresses_pkey PRIMARY KEY (id)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subjects_pkey PRIMARY KEY (id),
    CONSTRAINT subjects_name_key UNIQUE (name)
);

-- Student profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    grade_level character varying(50),
    school_name character varying(255),
    learning_goals text,
    preferred_learning_style character varying(50),
    subjects_of_interest text[],
    availability_schedule jsonb,
    emergency_contact jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT student_profiles_user_id_key UNIQUE (user_id),
    CONSTRAINT student_profiles_preferred_learning_style_check CHECK (((preferred_learning_style)::text = ANY ((ARRAY['visual'::character varying, 'auditory'::character varying, 'kinesthetic'::character varying, 'reading'::character varying, 'both'::character varying])::text[])))
);

-- Tutor profiles table
CREATE TABLE IF NOT EXISTS public.tutor_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
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
    average_session_duration numeric(5,2) DEFAULT 0.00,
    cancellation_rate integer DEFAULT 0,
    response_rate numeric(5,2) DEFAULT 100.00,
    weekly_availability_hours numeric(5,2) DEFAULT 0.00,
    monthly_earnings numeric(10,2) DEFAULT 0.00,
    CONSTRAINT tutor_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT tutor_profiles_user_id_key UNIQUE (user_id),
    CONSTRAINT tutor_profiles_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric))),
    CONSTRAINT tutor_profiles_preferred_teaching_method_check CHECK (((preferred_teaching_method)::text = ANY ((ARRAY['online'::character varying, 'in_person'::character varying, 'both'::character varying])::text[])))
);

-- Tutor subjects table
CREATE TABLE IF NOT EXISTS public.tutor_subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    proficiency_level character varying(50),
    years_taught integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_subjects_pkey PRIMARY KEY (id),
    CONSTRAINT tutor_subjects_tutor_id_subject_id_key UNIQUE (tutor_id, subject_id),
    CONSTRAINT tutor_subjects_proficiency_level_check CHECK (((proficiency_level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[])))
);

-- Tutoring sessions table
CREATE TABLE IF NOT EXISTS public.tutoring_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    tutor_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    session_type character varying(20) NOT NULL,
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    hourly_rate numeric(10,2) NOT NULL,
    payment_amount numeric(10,2),
    session_notes text,
    homework_assigned text,
    materials_used text[],
    meeting_link character varying(500),
    meeting_room character varying(255),
    cancellation_reason text,
    cancelled_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    session_date timestamp with time zone,
    duration_minutes integer GENERATED ALWAYS AS (EXTRACT(epoch FROM (scheduled_end - scheduled_start)) / 60) STORED,
    CONSTRAINT tutoring_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT tutoring_sessions_session_type_check CHECK (((session_type)::text = ANY ((ARRAY['online'::character varying, 'in_person'::character varying])::text[]))),
    CONSTRAINT tutoring_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'no_show'::character varying])::text[])))
);

-- Session reviews table
CREATE TABLE IF NOT EXISTS public.session_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewer_type character varying(20) NOT NULL,
    rating integer NOT NULL,
    comment text,
    would_recommend boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT session_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT session_reviews_session_id_reviewer_id_key UNIQUE (session_id, reviewer_id),
    CONSTRAINT session_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT session_reviews_reviewer_type_check CHECK (((reviewer_type)::text = ANY ((ARRAY['student'::character varying, 'tutor'::character varying])::text[])))
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    subject character varying(255),
    content text NOT NULL,
    is_read boolean DEFAULT false,
    parent_message_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    payer_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    transaction_id character varying(255),
    processed_at timestamp with time zone,
    refunded_at timestamp with time zone,
    refund_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_pkey PRIMARY KEY (id),
    CONSTRAINT payments_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    is_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    preference_key character varying(100) NOT NULL,
    preference_value text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
    CONSTRAINT user_preferences_user_id_preference_key_key UNIQUE (user_id, preference_key)
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    description text,
    category character varying(50) DEFAULT 'general'::character varying,
    data_type character varying(20) DEFAULT 'string'::character varying,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT settings_pkey PRIMARY KEY (id),
    CONSTRAINT settings_key_key UNIQUE (key),
    CONSTRAINT settings_data_type_check CHECK (((data_type)::text = ANY ((ARRAY['string'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying])::text[])))
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    tutor_id uuid,
    subject_id uuid,
    title character varying(255) NOT NULL,
    description text,
    priority character varying(20) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    estimated_hours numeric(5,2),
    actual_hours numeric(5,2),
    difficulty_level character varying(20),
    tags text[],
    attachments jsonb,
    progress_percentage integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_difficulty_level_check CHECK (((difficulty_level)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[]))),
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT tasks_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);

-- Tutor availability slots table
CREATE TABLE IF NOT EXISTS public.tutor_availability_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    recurring_pattern character varying(20) DEFAULT 'weekly'::character varying,
    effective_from date DEFAULT CURRENT_DATE,
    effective_until date,
    break_duration_minutes integer DEFAULT 0,
    max_sessions_per_slot integer DEFAULT 1,
    buffer_time_minutes integer DEFAULT 15,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_availability_slots_pkey PRIMARY KEY (id),
    CONSTRAINT tutor_availability_slots_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT tutor_availability_slots_recurring_pattern_check CHECK (((recurring_pattern)::text = ANY ((ARRAY['weekly'::character varying, 'biweekly'::character varying, 'monthly'::character varying])::text[])))
);

-- Tutor earnings table
CREATE TABLE IF NOT EXISTS public.tutor_earnings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
    session_id uuid NOT NULL,
    gross_amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    net_amount numeric(10,2) NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    payout_date timestamp with time zone,
    tax_year integer,
    currency character varying(3) DEFAULT 'USD'::character varying,
    exchange_rate numeric(10,4) DEFAULT 1.0000,
    payment_method character varying(50),
    transaction_reference character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_earnings_pkey PRIMARY KEY (id),
    CONSTRAINT tutor_earnings_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'paid'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);

-- Tutor performance metrics table
CREATE TABLE IF NOT EXISTS public.tutor_performance_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
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
    CONSTRAINT tutor_performance_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT tutor_performance_metrics_tutor_id_year_month_key UNIQUE (tutor_id, year, month),
    CONSTRAINT tutor_performance_metrics_month_check CHECK (((month >= 1) AND (month <= 12)))
);

-- Student progress tracking table
CREATE TABLE IF NOT EXISTS public.student_progress_tracking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    tutor_id uuid,
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
    CONSTRAINT student_progress_tracking_pkey PRIMARY KEY (id),
    CONSTRAINT student_progress_tracking_proficiency_level_check CHECK (((proficiency_level)::text = ANY ((ARRAY['beginner'::character varying, 'elementary'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[]))),
    CONSTRAINT student_progress_tracking_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100)))
);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- User addresses constraints
ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Student profiles constraints
ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Tutor profiles constraints
ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Tutor subjects constraints
ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Tutoring sessions constraints
ALTER TABLE ONLY public.tutoring_sessions
    ADD CONSTRAINT tutoring_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tutoring_sessions
    ADD CONSTRAINT tutoring_sessions_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tutoring_sessions
    ADD CONSTRAINT tutoring_sessions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Session reviews constraints
ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT session_reviews_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT session_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Messages constraints
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Payments constraints
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Notifications constraints
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- User preferences constraints
ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Password reset tokens constraints
ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Tasks constraints
ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Tutor availability slots constraints
ALTER TABLE ONLY public.tutor_availability_slots
    ADD CONSTRAINT tutor_availability_slots_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Tutor earnings constraints
ALTER TABLE ONLY public.tutor_earnings
    ADD CONSTRAINT tutor_earnings_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tutor_earnings
    ADD CONSTRAINT tutor_earnings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE;

-- Tutor performance metrics constraints
ALTER TABLE ONLY public.tutor_performance_metrics
    ADD CONSTRAINT tutor_performance_metrics_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Student progress tracking constraints
ALTER TABLE ONLY public.student_progress_tracking
    ADD CONSTRAINT student_progress_tracking_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.student_progress_tracking
    ADD CONSTRAINT student_progress_tracking_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.student_progress_tracking
    ADD CONSTRAINT student_progress_tracking_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for updating tutor performance metrics
CREATE TRIGGER update_tutor_performance_trigger
    AFTER UPDATE ON public.tutoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tutor_performance_metrics();

-- Trigger for updating tutor profile stats
CREATE TRIGGER update_tutor_profile_stats_trigger
    AFTER UPDATE ON public.tutoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tutor_profile_stats();

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert subjects
INSERT INTO public.subjects (id, name, description, category, is_active, created_at, updated_at) VALUES 
('5300be37-5643-4372-98c7-3c468655c838', 'Mathematics', 'Basic to advanced mathematics including algebra, calculus, and statistics', 'academics', true, '2025-09-25 14:33:18.609739-05', '2025-09-25 14:33:18.609739-05'),
('886240f2-186d-4f7c-8a6a-89b41d11adca', 'Physics', 'Physics concepts from basic mechanics to advanced quantum physics', 'science', true, '2025-09-25 14:33:18.611069-05', '2025-09-25 14:33:18.611069-05'),
('95b21b45-c123-4d56-8e9f-a1b2c3d4e5f6', 'Spanish', 'Spanish language learning from beginner to advanced levels', 'language', true, '2025-09-25 14:33:18.612289-05', '2025-09-25 14:33:18.612289-05'),
('b59cf17e-6bdf-4de9-b775-7a55609eb1c6', 'Computer Science', 'Programming, algorithms, data structures, and software development', 'technology', true, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05');

-- Insert users (passwords are hashed for 'demo123')
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES 
('1b760852-694e-41a9-afd6-37f0d42216d7', 'student@demo.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Demo', 'Student', NULL, NULL, 'student', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', NULL, false, true, '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05'),
('2cebaa54-380c-4e71-8455-66cfb40fdb40', 'tutor@demo.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Demo', 'Tutor', NULL, NULL, 'tutor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NULL, false, true, '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05'),
('025efe1f-c8bd-4f8e-9282-6bcdb27db0d7', 'admin@demo.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Demo', 'Admin', NULL, NULL, 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', NULL, false, true, '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05'),
('80812a35-7730-4408-978b-6778c5c8135e', 'sarah.math@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Sarah', 'Johnson', '+1234567891', NULL, 'tutor', NULL, 'Experienced mathematics tutor with 5+ years of teaching experience', true, true, '2025-09-25 14:33:18.611429-05', '2025-09-29 15:56:50.015432-05'),
('9d5c540b-e76c-4511-ad1b-615b98b54cae', 'david.physics@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'David', 'Chen', '+1234567892', NULL, 'tutor', NULL, 'Physics PhD with passion for making complex concepts simple', true, true, '2025-09-25 14:33:18.615982-05', '2025-09-29 15:56:50.015432-05'),
('9035f001-56a5-4ec4-9b51-b412193ed125', 'maria.spanish@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Maria', 'Rodriguez', '+1234567893', NULL, 'tutor', NULL, 'Native Spanish speaker with teaching certification', true, true, '2025-09-25 14:33:18.618913-05', '2025-09-29 15:56:50.015432-05'),
('7b80fc04-d7c0-4123-8c73-c8c33310a817', 'john.student@example.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'John', 'Smith', '+1234567894', NULL, 'student', NULL, 'High school student looking to improve in math and science', true, true, '2025-09-25 14:33:18.621316-05', '2025-09-29 15:56:50.015432-05'),
('e42db01c-739b-4b03-a288-e8ead8c5f8e7', 'emma.student@example.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Emma', 'Wilson', '+1234567895', NULL, 'student', NULL, 'College freshman seeking help with organic chemistry', true, true, '2025-09-25 14:33:18.624785-05', '2025-09-29 15:56:50.015432-05'),
('ef910e0b-1654-489e-b3f4-d647a22bff84', 'admin@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Admin', 'User', '+1234567890', NULL, 'admin', NULL, 'System administrator for TutorConnect platform', true, true, '2025-09-25 14:33:18.607808-05', '2025-09-29 15:56:50.015432-05'),
('27bd24b5-2677-4320-a1b1-8adf09ef7464', 'alex.student@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Alex', 'Thompson', '+1-555-0201', NULL, 'student', NULL, 'High school senior preparing for college entrance exams. Needs help with calculus and physics.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05'),
('919affe9-c8f0-45b5-aaf4-0cbe1f213c65', 'mike.science@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Michael', 'Chen', '+1-555-0102', NULL, 'tutor', NULL, 'PhD in Physics with passion for teaching. I help students understand complex scientific concepts through practical examples.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05'),
('6f28afdd-9211-49cf-9bef-18216f5a667f', 'david.cs@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'David', 'Kim', '+1-555-0104', NULL, 'tutor', NULL, 'Software engineer and computer science tutor. Helps students with programming, web development, and algorithms.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05'),
('7088f167-1cd0-48db-8f36-26e6cf16417c', 'jamie.learner@tutorconnect.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Jamie', 'Wilson', '+1-555-0202', NULL, 'student', NULL, 'College sophomore studying computer science. Looking for help with advanced programming concepts.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05');

-- Insert tutor profiles
INSERT INTO public.tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, created_at, updated_at, total_earnings, average_session_duration, cancellation_rate, response_rate, weekly_availability_hours, monthly_earnings) VALUES 
('35dc308a-1b0d-495c-9c8c-da06eca755e5', '80812a35-7730-4408-978b-6778c5c8135e', 45.00, 5, 'M.S. in Mathematics, Stanford University', NULL, NULL, 0.00, 0, 0, true, 'English, Spanish', 'both', '2025-09-25 14:33:18.613108-05', '2025-09-25 14:33:18.613108-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00),
('55dc9ea6-b90e-452f-96fe-5efc90da4e68', '9d5c540b-e76c-4511-ad1b-615b98b54cae', 50.00, 7, 'Ph.D. in Physics, MIT', NULL, NULL, 0.00, 0, 0, true, 'English, Mandarin', 'both', '2025-09-25 14:33:18.617585-05', '2025-09-25 14:33:18.617585-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00),
('77b252e0-9356-446e-85ad-2f29d6b2a5ed', '9035f001-56a5-4ec4-9b51-b412193ed125', 35.00, 3, 'B.A. in Spanish Literature, UC Berkeley', NULL, NULL, 0.00, 0, 0, true, 'Spanish, English', 'both', '2025-09-25 14:33:18.620003-05', '2025-09-25 14:33:18.620003-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00),
('8959b340-63ab-4fd2-a8f3-401e0f607da3', '2cebaa54-380c-4e71-8455-66cfb40fdb40', 25.00, 3, NULL, NULL, NULL, 4.50, 0, 12, true, 'English', 'both', '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00),
('91efc493-28da-46c7-9b2b-ddae7f2be745', '919affe9-c8f0-45b5-aaf4-0cbe1f213c65', 55.00, 12, 'PhD Physics, MIT', NULL, NULL, 4.90, 0, 203, true, 'English, Mandarin', 'both', '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00),
('a16ff69b-2b76-438c-b35b-d0a81be6b895', '6f28afdd-9211-49cf-9bef-18216f5a667f', 50.00, 6, 'B.S. Computer Science, Carnegie Mellon', NULL, NULL, 4.80, 0, 134, true, 'English, Korean', 'both', '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00);

-- Insert student profiles
INSERT INTO public.student_profiles (id, user_id, grade_level, school_name, learning_goals, preferred_learning_style, subjects_of_interest, availability_schedule, emergency_contact, created_at, updated_at) VALUES 
('133b7060-a776-4b95-89dd-b1b6fc541028', '7b80fc04-d7c0-4123-8c73-c8c33310a817', '11th Grade', 'Lincoln High School', 'Improve SAT scores and prepare for AP Calculus', 'both', NULL, NULL, NULL, '2025-09-25 14:33:18.622678-05', '2025-09-25 14:33:18.622678-05'),
('b736f650-252b-45e0-8940-991378fcf47b', 'e42db01c-739b-4b03-a288-e8ead8c5f8e7', 'College Freshman', 'State University', 'Pass organic chemistry and maintain GPA', 'both', NULL, NULL, NULL, '2025-09-25 14:33:18.625949-05', '2025-09-25 14:33:18.625949-05');

-- Insert tutoring sessions
INSERT INTO public.tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, payment_amount, session_notes, homework_assigned, materials_used, meeting_link, meeting_room, cancellation_reason, cancelled_by, created_at, updated_at, session_date) VALUES 
('d393f36b-866b-484c-9307-85ad9c8aa0f0', '1b760852-694e-41a9-afd6-37f0d42216d7', '2cebaa54-380c-4e71-8455-66cfb40fdb40', '5300be37-5643-4372-98c7-3c468655c838', 'JavaScript Fundamentals', NULL, 'online', '2025-01-05 10:00:00-06', '2025-01-05 11:00:00-06', NULL, NULL, 'scheduled', 50.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 18:00:42.160461-05', '2025-09-28 18:00:42.160461-05', NULL),
('47e95bea-b70c-492f-8cc0-59210068d511', '1b760852-694e-41a9-afd6-37f0d42216d7', '2cebaa54-380c-4e71-8455-66cfb40fdb40', '5300be37-5643-4372-98c7-3c468655c838', 'React Components', NULL, 'online', '2025-01-03 14:00:00-06', '2025-01-03 15:30:00-06', NULL, NULL, 'completed', 50.00, 75.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 18:00:42.166763-05', '2025-09-28 18:00:42.166763-05', NULL),
('aa4a0465-0805-4927-882c-e87c23b0cba6', '27bd24b5-2677-4320-a1b1-8adf09ef7464', '80812a35-7730-4408-978b-6778c5c8135e', '5300be37-5643-4372-98c7-3c468655c838', 'Calculus Practice Session', 'Review of derivatives and integrals, practice problems for upcoming exam', 'online', '2025-10-01 12:58:03.769849-05', '2025-10-01 13:58:03.769849-05', NULL, NULL, 'scheduled', 45.00, 45.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', NULL),
('1215610e-35a0-43f1-850c-403657018918', '27bd24b5-2677-4320-a1b1-8adf09ef7464', '919affe9-c8f0-45b5-aaf4-0cbe1f213c65', '886240f2-186d-4f7c-8a6a-89b41d11adca', 'Physics Problem Solving', 'Work through mechanics problems, focus on forces and motion', 'online', '2025-10-02 12:58:03.769849-05', '2025-10-02 14:28:03.769849-05', NULL, NULL, 'scheduled', 55.00, 82.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', NULL),
('ec3ecda2-b570-49f1-9fa6-dc41dfc7c78f', '7088f167-1cd0-48db-8f36-26e6cf16417c', '6f28afdd-9211-49cf-9bef-18216f5a667f', 'b59cf17e-6bdf-4de9-b775-7a55609eb1c6', 'JavaScript Fundamentals', 'Introduction to JavaScript, variables, functions, and DOM manipulation', 'online', '2025-09-28 12:58:03.769849-05', '2025-09-28 13:58:03.769849-05', '2025-09-28 12:58:03.769849-05', '2025-09-28 13:58:03.769849-05', 'completed', 50.00, 50.00, 'Great progress! Student understood concepts well. Recommended practicing DOM manipulation exercises.', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', NULL);

-- Insert settings
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES 
('1e50dcf8-22e1-4f7e-9d37-12475fb39230', 'language', 'en', 'Default language', 'general', 'string', false, '2025-09-29 11:07:37.486707-05', '2025-09-30 13:03:21.727336-05'),
('c0de0539-f193-4dd7-8366-bd76e536f0f9', 'contact_email', 'admin@tutorconnect.com', 'Contact email', 'general', 'string', false, '2025-09-29 11:07:37.48323-05', '2025-09-30 13:03:21.607573-05'),
('0fc63ddb-329b-4e46-9fa2-dd434c66245c', 'site_description', 'Connect with expert tutors for personalized learning', 'Platform description', 'general', 'string', false, '2025-09-29 11:07:37.482231-05', '2025-09-30 13:03:21.632116-05'),
('d14203d2-e6ef-4d7e-98ec-2d8b08a777fa', 'site_name', 'TutorConnect', 'Platform name', 'general', 'string', false, '2025-09-29 11:07:37.477251-05', '2025-09-30 13:03:21.652737-05'),
('32718288-ed24-4ca0-8530-c0d65516b2a2', 'commission_rate', '15', 'Platform commission rate in percentage', 'payment', 'number', false, '2025-09-29 11:07:37.495938-05', '2025-09-30 13:03:21.661759-05'),
('53cff740-e313-40e1-a87d-39ec2bde9532', 'enable_two_factor', 'false', 'Enable two-factor authentication', 'security', 'boolean', false, '2025-09-29 11:07:37.488629-05', '2025-09-30 13:03:21.680726-05'),
('39efe29e-5c0d-46e5-9bb2-fa77c64a1a6c', 'session_timeout', '24', 'Session timeout in hours', 'security', 'number', false, '2025-09-29 11:07:37.489834-05', '2025-09-30 13:03:21.693933-05'),
('964f75aa-4bb4-4039-9e58-5aca0e69495f', 'auto_approval_tutors', 'false', 'Auto-approve new tutors', 'user_management', 'boolean', false, '2025-09-29 11:07:37.499233-05', '2025-09-30 13:03:21.700292-05');

-- =====================================================
-- END OF RESTORE FILE
-- =====================================================

-- Display completion message
SELECT 'TutorConnect database restoration completed successfully!' as message;