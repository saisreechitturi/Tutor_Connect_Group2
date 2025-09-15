-- ============================================================================
-- TutorConnect Database Schema (PostgreSQL)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Users table (authentication and roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User profiles (personal information)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TUTOR-SPECIFIC TABLES
-- ============================================================================

-- Tutor profiles (tutoring-specific information)
CREATE TABLE tutor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hourly_rate NUMERIC(8,2) NOT NULL CHECK (hourly_rate > 0),
    experience TEXT,
    education TEXT,
    languages TEXT[], -- Array of languages spoken
    rating NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    response_time TEXT, -- e.g., "< 1 hour"
    verified BOOLEAN DEFAULT false,
    teaching_style TEXT,
    specializations TEXT[], -- Array of specialization areas
    is_accepting_students BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tutor subjects (many-to-many relationship)
CREATE TABLE tutor_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_profile_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    subject_rate NUMERIC(8,2), -- Subject-specific rate (optional override)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_profile_id, subject)
);

-- ============================================================================
-- SESSION MANAGEMENT
-- ============================================================================

-- Tutoring sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    tutor_id UUID NOT NULL REFERENCES users(id),
    subject TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
    scheduled_start TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(8,2) NOT NULL CHECK (price >= 0),
    meeting_link TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users CHECK (student_id != tutor_id),
    CONSTRAINT valid_cancellation CHECK (
        (status = 'cancelled' AND cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL) OR
        (status != 'cancelled' AND cancelled_by IS NULL AND cancelled_at IS NULL)
    )
);

-- Session feedback and reviews
CREATE TABLE session_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
    tutor_rating INTEGER CHECK (tutor_rating >= 1 AND tutor_rating <= 5),
    student_comment TEXT,
    tutor_comment TEXT,
    student_feedback_at TIMESTAMPTZ,
    tutor_feedback_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STUDENT TASK MANAGEMENT
-- ============================================================================

-- Student tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date DATE,
    tags TEXT[], -- Array of tags
    estimated_hours NUMERIC(5,2),
    actual_hours NUMERIC(5,2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CALENDAR SYSTEM
-- ============================================================================

-- Calendar events
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('session', 'exam', 'deadline', 'personal')),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    location TEXT,
    color TEXT DEFAULT '#3B82F6',
    all_day BOOLEAN DEFAULT false,
    reminders JSONB, -- [{type:'email', minutes:60}, {type:'push', minutes:15}]
    recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
    recurring_end_date DATE,
    related_task_id UUID REFERENCES tasks(id),
    related_session_id UUID REFERENCES sessions(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Conversations (1-to-1 only)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'session')),
    title TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants
CREATE TABLE conversation_members (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY(conversation_id, user_id)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'system')),
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    reply_to_id UUID REFERENCES messages(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI INTERACTION LOGS (Optional)
-- ============================================================================

-- AI chatbot interaction logs
CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    helpful BOOLEAN,
    category TEXT,
    session_id TEXT, -- For tracking conversation sessions
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- Profile indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles(location) WHERE location IS NOT NULL;

-- Tutor indexes
CREATE INDEX idx_tutor_profiles_user_id ON tutor_profiles(user_id);
CREATE INDEX idx_tutor_profiles_verified_accepting ON tutor_profiles(verified, is_accepting_students);
CREATE INDEX idx_tutor_profiles_rating ON tutor_profiles(rating DESC);
CREATE INDEX idx_tutor_subjects_subject ON tutor_subjects(subject);
CREATE INDEX idx_tutor_subjects_active ON tutor_subjects(subject, is_active);

-- Session indexes
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_tutor_id ON sessions(tutor_id);
CREATE INDEX idx_sessions_scheduled_start ON sessions(scheduled_start);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_student_status ON sessions(student_id, status);
CREATE INDEX idx_sessions_tutor_status ON sessions(tutor_id, status);

-- Task indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_priority_status ON tasks(priority, status);

-- Calendar indexes
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_user_start ON calendar_events(user_id, start_at);
CREATE INDEX idx_calendar_events_type ON calendar_events(type);

-- Message indexes
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- AI logs indexes
CREATE INDEX idx_ai_logs_user_created ON ai_logs(user_id, created_at);
CREATE INDEX idx_ai_logs_category ON ai_logs(category);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_profiles_updated_at BEFORE UPDATE ON tutor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_feedback_updated_at BEFORE UPDATE ON session_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to update tutor rating after feedback
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_rating IS NOT NULL THEN
        UPDATE tutor_profiles 
        SET 
            rating = (
                SELECT ROUND(AVG(student_rating)::numeric, 2)
                FROM session_feedback sf
                JOIN sessions s ON sf.session_id = s.id
                WHERE s.tutor_id = (SELECT tutor_id FROM sessions WHERE id = NEW.session_id)
                AND sf.student_rating IS NOT NULL
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM session_feedback sf
                JOIN sessions s ON sf.session_id = s.id
                WHERE s.tutor_id = (SELECT tutor_id FROM sessions WHERE id = NEW.session_id)
                AND sf.student_rating IS NOT NULL
            )
        WHERE user_id = (SELECT tutor_id FROM sessions WHERE id = NEW.session_id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tutor_rating_trigger 
    AFTER INSERT OR UPDATE ON session_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_tutor_rating();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger 
    AFTER INSERT ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- SAMPLE DATA INSERTION (Optional)
-- ============================================================================

-- Insert sample admin user
-- INSERT INTO users (email, password_hash, role, email_verified) 
-- VALUES ('admin@tutorconnect.com', '$2b$10$...', 'admin', true);

-- Insert sample student
-- INSERT INTO users (email, password_hash, role, email_verified) 
-- VALUES ('student@example.com', '$2b$10$...', 'student', true);

-- Insert sample tutor
-- INSERT INTO users (email, password_hash, role, email_verified) 
-- VALUES ('tutor@example.com', '$2b$10$...', 'tutor', true);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================