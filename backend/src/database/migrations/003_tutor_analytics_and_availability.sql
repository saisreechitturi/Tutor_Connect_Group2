-- Migration: Add tutor availability slots and analytics tables
-- This migration adds tables to support tutor availability management and analytics

-- Tutor availability slots
CREATE TABLE tutor_availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL, -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    specific_date DATE, -- For one-time availability overrides
    is_available BOOLEAN DEFAULT true,
    max_sessions INTEGER DEFAULT 1, -- How many sessions can be booked in this slot
    buffer_minutes INTEGER DEFAULT 15, -- Buffer time between sessions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Index for efficient availability queries
CREATE INDEX idx_tutor_availability_tutor_day ON tutor_availability_slots(tutor_id, day_of_week);
CREATE INDEX idx_tutor_availability_date ON tutor_availability_slots(specific_date) WHERE specific_date IS NOT NULL;

-- Tutor earnings tracking (for analytics)
CREATE TABLE tutor_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    earning_type VARCHAR(50) CHECK (earning_type IN ('session', 'bonus', 'adjustment')) DEFAULT 'session',
    status VARCHAR(20) CHECK (status IN ('pending', 'available', 'withdrawn')) DEFAULT 'pending',
    earned_date DATE NOT NULL,
    available_date DATE, -- When funds become available for withdrawal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for earnings queries
CREATE INDEX idx_tutor_earnings_tutor_date ON tutor_earnings(tutor_id, earned_date);
CREATE INDEX idx_tutor_earnings_status ON tutor_earnings(status);

-- Tutor performance metrics (monthly aggregates)
CREATE TABLE tutor_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12) NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    no_show_sessions INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    new_students INTEGER DEFAULT 0,
    repeat_students INTEGER DEFAULT 0,
    total_hours DECIMAL(5,2) DEFAULT 0,
    response_time_avg_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, year, month)
);

-- Index for performance metrics
CREATE INDEX idx_tutor_performance_tutor_period ON tutor_performance_metrics(tutor_id, year, month);

-- Student performance tracking (for tutor analytics)
CREATE TABLE student_progress_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- Progress metrics
    comprehension_level INTEGER CHECK (comprehension_level >= 1 AND comprehension_level <= 5),
    engagement_level INTEGER CHECK (engagement_level >= 1 AND engagement_level <= 5),
    homework_completion_rate INTEGER CHECK (homework_completion_rate >= 0 AND homework_completion_rate <= 100),
    
    -- Goals and improvements
    goals_achieved TEXT[],
    areas_of_improvement TEXT[],
    next_session_focus TEXT,
    
    -- Tutor notes
    tutor_notes TEXT,
    recommended_resources TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for student progress queries
CREATE INDEX idx_student_progress_tutor_student ON student_progress_tracking(tutor_id, student_id);
CREATE INDEX idx_student_progress_session ON student_progress_tracking(session_id);

-- Update tutor_profiles table to add analytics fields
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS available_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS withdrawn_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS avg_response_time_minutes INTEGER DEFAULT 0;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2) DEFAULT 100.00;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS repeat_student_rate DECIMAL(5,2) DEFAULT 0;

-- Add payment reference to sessions
ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic performance metrics updates
DROP TRIGGER IF EXISTS trigger_update_tutor_performance ON tutoring_sessions;
CREATE TRIGGER trigger_update_tutor_performance
    AFTER UPDATE ON tutoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_performance_metrics();

-- Function to update tutor profile statistics
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
$$ LANGUAGE plpgsql;

-- Create trigger for tutor profile stats
DROP TRIGGER IF EXISTS trigger_update_tutor_profile_stats ON tutoring_sessions;
CREATE TRIGGER trigger_update_tutor_profile_stats
    AFTER UPDATE ON tutoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_profile_stats();