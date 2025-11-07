-- Migration: Add tasks table for TutorConnect
-- Date: 2025-11-07
-- Description: Creates tasks table to support task management and calendar functionality

-- Tasks table for student/tutor task management
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'General Studies',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes, filled when completed
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE SET NULL, -- optional connection to session
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL, -- optional subject categorization
    tags TEXT[], -- array of tags for better organization
    attachments JSONB, -- file attachments metadata
    notes TEXT, -- additional notes
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- daily, weekly, monthly, etc.
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- for subtasks
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Create trigger for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Student and tutor task management system';
COMMENT ON COLUMN tasks.user_id IS 'User who owns this task';
COMMENT ON COLUMN tasks.title IS 'Task title/name';
COMMENT ON COLUMN tasks.status IS 'Current task status';
COMMENT ON COLUMN tasks.priority IS 'Task priority level';
COMMENT ON COLUMN tasks.due_date IS 'When the task is due';
COMMENT ON COLUMN tasks.estimated_duration IS 'Estimated time to complete in minutes';
COMMENT ON COLUMN tasks.actual_duration IS 'Actual time taken to complete in minutes';
COMMENT ON COLUMN tasks.session_id IS 'Optional connection to a tutoring session';
COMMENT ON COLUMN tasks.subject_id IS 'Optional subject categorization';
COMMENT ON COLUMN tasks.tags IS 'Array of tags for organization';
COMMENT ON COLUMN tasks.attachments IS 'JSON metadata for file attachments';
COMMENT ON COLUMN tasks.is_recurring IS 'Whether this task repeats';
COMMENT ON COLUMN tasks.parent_task_id IS 'For creating subtasks';
COMMENT ON COLUMN tasks.progress_percentage IS 'Task completion percentage';

-- Insert some default sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample subjects (if they don't exist)
INSERT INTO subjects (name, description, category, is_active) 
VALUES 
    ('Mathematics', 'General Mathematics subjects', 'STEM', true),
    ('English', 'English language and literature', 'Language Arts', true),
    ('Science', 'General Science subjects', 'STEM', true),
    ('History', 'History and Social Studies', 'Social Studies', true),
    ('Computer Science', 'Programming and computer science', 'STEM', true)
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Tasks table migration completed successfully!';
    RAISE NOTICE 'Table created: tasks';
    RAISE NOTICE 'Indexes created: 8 indexes for optimal performance';
    RAISE NOTICE 'Triggers created: update_tasks_updated_at';
END
$$;