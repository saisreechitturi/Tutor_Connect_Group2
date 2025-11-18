-- TutorConnect Database Creation Script (Structure Only)
-- This script creates an empty database with all tables and indexes
-- Use this if you want just the structure without any data

-- Connect to PostgreSQL and create database
-- Run this part in psql connected to postgres database:
-- CREATE DATABASE TutorConnect;
-- \c TutorConnect;

-- Or run this script after connecting to the TutorConnect database

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update tutor performance metrics
CREATE OR REPLACE FUNCTION update_tutor_performance_metrics()
RETURNS TRIGGER AS $$
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
$$ language 'plpgsql';

-- Function to update tutor profile stats
CREATE OR REPLACE FUNCTION update_tutor_profile_stats()
RETURNS TRIGGER AS $$
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
$$ language 'plpgsql';

-- Users table (for both students and tutors)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    pincode VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
    profile_picture_url TEXT,
    bio TEXT,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User addresses table removed - address is now stored directly in users table

-- Subjects table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor profiles table
CREATE TABLE tutor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10,2) NOT NULL,
    years_of_experience INTEGER NOT NULL,
    education_background TEXT,
    certifications TEXT[],
    teaching_philosophy TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_students INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    languages_spoken VARCHAR(255),
    preferred_teaching_method VARCHAR(50) CHECK (preferred_teaching_method IN ('online', 'in_person', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    average_session_duration DECIMAL(5,2) DEFAULT 0.00,
    cancellation_rate INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 100.00,
    weekly_availability_hours DECIMAL(5,2) DEFAULT 0.00,
    monthly_earnings DECIMAL(10,2) DEFAULT 0.00
);

-- Student profiles table
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grade_level VARCHAR(50),
    school_name VARCHAR(255),
    learning_goals TEXT,
    preferred_learning_style VARCHAR(50) CHECK (preferred_learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'both')),
    subjects_of_interest TEXT[],
    availability_schedule JSONB,
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor-Subject relationship table
CREATE TABLE tutor_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(50) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_of_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, subject_id)
);

-- Tutoring sessions table
CREATE TABLE tutoring_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('online', 'in-person')),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show')),
    hourly_rate DECIMAL(10,2) NOT NULL,
    payment_amount DECIMAL(10,2),
    session_notes TEXT,
    homework_assigned TEXT,
    materials_used TEXT[],
    meeting_link VARCHAR(500),
    meeting_room VARCHAR(255),
    cancellation_reason TEXT,
    cancelled_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(epoch FROM (scheduled_end - scheduled_start)) / 60) STORED
);

-- Session reviews table
CREATE TABLE session_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    is_public BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) CHECK (message_type IN ('direct', 'session', 'system', 'announcement')) DEFAULT 'direct',
    read_at TIMESTAMP WITH TIME ZONE,
    attachments TEXT[],
    priority VARCHAR(20) CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) DEFAULT 'mock',
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
    description TEXT DEFAULT 'Mock payment',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table removed - not needed for simplified profile-only settings
-- User preferences table removed - profile settings are now stored directly in users table

-- Settings table (for system configuration)
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    tags TEXT[],
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor availability slots table
CREATE TABLE tutor_availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC',
    recurring_pattern VARCHAR(20) DEFAULT 'weekly' CHECK (recurring_pattern IN ('weekly', 'biweekly', 'monthly')),
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    break_duration_minutes INTEGER DEFAULT 0,
    max_sessions_per_slot INTEGER DEFAULT 1,
    buffer_time_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor earnings table
CREATE TABLE tutor_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    gross_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    payout_date TIMESTAMP WITH TIME ZONE,
    tax_year INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor performance metrics table
CREATE TABLE tutor_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    no_show_sessions INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_hours DECIMAL(8,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    response_time_hours DECIMAL(5,2) DEFAULT 0.00,
    new_students INTEGER DEFAULT 0,
    returning_students INTEGER DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, year, month)
);

-- Student progress tracking table
CREATE TABLE student_progress_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50) NOT NULL CHECK (proficiency_level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'expert')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_assessment_date TIMESTAMP WITH TIME ZONE,
    next_milestone VARCHAR(255),
    strengths TEXT[],
    areas_for_improvement TEXT[],
    learning_resources JSONB,
    parent_feedback TEXT,
    tutor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_tutor_profiles_user_id ON tutor_profiles(user_id);
CREATE INDEX idx_tutor_profiles_is_available ON tutor_profiles(is_available);
CREATE INDEX idx_tutor_profiles_rating ON tutor_profiles(rating);

CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);

CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_subjects_category ON subjects(category);

CREATE INDEX idx_tutor_subjects_tutor_id ON tutor_subjects(tutor_id);
CREATE INDEX idx_tutor_subjects_subject_id ON tutor_subjects(subject_id);

CREATE INDEX idx_sessions_student_id ON tutoring_sessions(student_id);
CREATE INDEX idx_sessions_tutor_id ON tutoring_sessions(tutor_id);
CREATE INDEX idx_sessions_date ON tutoring_sessions(session_date);
CREATE INDEX idx_sessions_status ON tutoring_sessions(status);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_recipient ON messages(sender_id, recipient_id);

CREATE INDEX idx_payments_session_id ON payments(session_id);
CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_status ON payments(status);



CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_tutor_id ON tasks(tutor_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_tutor_availability_tutor_id ON tutor_availability_slots(tutor_id);
CREATE INDEX idx_tutor_availability_day_time ON tutor_availability_slots(day_of_week, start_time);

CREATE INDEX idx_tutor_earnings_tutor_id ON tutor_earnings(tutor_id);
CREATE INDEX idx_tutor_earnings_session_id ON tutor_earnings(session_id);
CREATE INDEX idx_tutor_earnings_payout_date ON tutor_earnings(payout_date);

CREATE INDEX idx_tutor_performance_tutor_id ON tutor_performance_metrics(tutor_id);
CREATE INDEX idx_tutor_performance_year_month ON tutor_performance_metrics(year, month);

CREATE INDEX idx_student_progress_student_id ON student_progress_tracking(student_id);
CREATE INDEX idx_student_progress_subject_id ON student_progress_tracking(subject_id);
CREATE INDEX idx_student_progress_tutor_id ON student_progress_tracking(tutor_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_profiles_updated_at 
    BEFORE UPDATE ON tutor_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON tutoring_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_reset_tokens_updated_at 
    BEFORE UPDATE ON password_reset_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_availability_updated_at 
    BEFORE UPDATE ON tutor_availability_slots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_earnings_updated_at 
    BEFORE UPDATE ON tutor_earnings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_performance_updated_at 
    BEFORE UPDATE ON tutor_performance_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at 
    BEFORE UPDATE ON student_progress_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating tutor performance metrics
CREATE TRIGGER update_tutor_performance_trigger
    AFTER UPDATE ON tutoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_performance_metrics();

-- Trigger for updating tutor profile stats
CREATE TRIGGER update_tutor_profile_stats_trigger
    AFTER UPDATE ON tutoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_profile_stats();

-- Add some helpful comments
COMMENT ON TABLE users IS 'Main users table for students, tutors, and admins';
COMMENT ON TABLE tutor_profiles IS 'Extended information for tutors';
COMMENT ON TABLE student_profiles IS 'Extended information for students';
COMMENT ON TABLE tutoring_sessions IS 'Scheduled and completed tutoring sessions';
COMMENT ON TABLE messages IS 'Internal messaging system';
COMMENT ON TABLE payments IS 'Payment processing and history';

COMMENT ON TABLE settings IS 'System configuration settings';
COMMENT ON TABLE password_reset_tokens IS 'Secure password reset tokens with expiration';
COMMENT ON TABLE tasks IS 'Student tasks and assignments with progress tracking';
COMMENT ON TABLE tutor_availability_slots IS 'Tutor availability scheduling and time slots';
COMMENT ON TABLE tutor_earnings IS 'Tutor payment tracking and earnings history';
COMMENT ON TABLE tutor_performance_metrics IS 'Monthly performance analytics for tutors';
COMMENT ON TABLE student_progress_tracking IS 'Student learning progress and skill assessment';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Database setup complete
SELECT 'TutorConnect database structure created successfully!' as status;