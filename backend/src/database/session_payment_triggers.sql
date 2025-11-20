-- Database trigger to automatically create payment records when sessions are completed
-- This ensures consistency across all session completion methods

-- Function to create payment when session is completed
CREATE OR REPLACE FUNCTION create_payment_on_session_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if session status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Check if payment already exists for this session
        IF NOT EXISTS (SELECT 1 FROM payments WHERE session_id = NEW.id) THEN
            -- Create payment record
            INSERT INTO payments (
                session_id, 
                payer_id, 
                recipient_id, 
                amount, 
                payment_method, 
                status, 
                currency, 
                description,
                created_at
            ) VALUES (
                NEW.id,
                NEW.student_id,
                NEW.tutor_id,
                NEW.hourly_rate,
                'platform',
                'completed',
                'USD',
                'Payment for ' || COALESCE(NEW.title, 'tutoring session'),
                CURRENT_TIMESTAMP
            );
            
            -- Log the payment creation
            RAISE NOTICE 'Payment created for completed session %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS session_completion_payment_trigger ON tutoring_sessions;
CREATE TRIGGER session_completion_payment_trigger
    AFTER UPDATE ON tutoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_on_session_completion();

-- Also create a trigger for INSERT (in case sessions are created with completed status)
DROP TRIGGER IF EXISTS session_creation_payment_trigger ON tutoring_sessions;
CREATE TRIGGER session_creation_payment_trigger
    AFTER INSERT ON tutoring_sessions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION create_payment_on_session_completion();

-- Function to update tutor profile statistics when payments are created
CREATE OR REPLACE FUNCTION update_tutor_stats_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    current_month INT;
    current_year INT;
BEGIN
    -- Only process completed payments
    IF NEW.status = 'completed' THEN
        current_month := EXTRACT(MONTH FROM CURRENT_DATE);
        current_year := EXTRACT(YEAR FROM CURRENT_DATE);
        
        -- Update tutor profile statistics
        UPDATE tutor_profiles 
        SET 
            total_earnings = (
                SELECT COALESCE(SUM(p.amount), 0) 
                FROM payments p
                WHERE p.recipient_id = NEW.recipient_id AND p.status = 'completed'
            ),
            monthly_earnings = (
                SELECT COALESCE(SUM(p.amount), 0) 
                FROM payments p
                WHERE p.recipient_id = NEW.recipient_id 
                AND p.status = 'completed'
                AND EXTRACT(MONTH FROM p.created_at) = current_month
                AND EXTRACT(YEAR FROM p.created_at) = current_year
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.recipient_id;
        
        -- Update or create performance metrics for current month
        INSERT INTO tutor_performance_metrics (
            tutor_id, year, month, total_sessions, completed_sessions, 
            total_earnings, total_hours, average_rating, total_reviews
        )
        SELECT 
            NEW.recipient_id,
            current_year,
            current_month,
            COUNT(*) FILTER (WHERE ts.status IN ('completed', 'scheduled', 'in_progress')),
            COUNT(*) FILTER (WHERE ts.status = 'completed'),
            COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0),
            COALESCE(SUM(EXTRACT(EPOCH FROM (
                CASE 
                    WHEN ts.actual_end IS NOT NULL AND ts.actual_start IS NOT NULL 
                    THEN ts.actual_end - ts.actual_start
                    ELSE ts.scheduled_end - ts.scheduled_start
                END
            ))/3600) FILTER (WHERE ts.status = 'completed'), 0),
            (SELECT COALESCE(AVG(rating), 0) FROM session_reviews sr 
             JOIN tutoring_sessions ts2 ON sr.session_id = ts2.id 
             WHERE ts2.tutor_id = NEW.recipient_id
             AND EXTRACT(MONTH FROM ts2.scheduled_start) = current_month
             AND EXTRACT(YEAR FROM ts2.scheduled_start) = current_year),
            (SELECT COUNT(*) FROM session_reviews sr 
             JOIN tutoring_sessions ts2 ON sr.session_id = ts2.id 
             WHERE ts2.tutor_id = NEW.recipient_id
             AND EXTRACT(MONTH FROM ts2.scheduled_start) = current_month
             AND EXTRACT(YEAR FROM ts2.scheduled_start) = current_year)
        FROM tutoring_sessions ts
        LEFT JOIN payments p ON ts.id = p.session_id AND p.recipient_id = NEW.recipient_id
        WHERE ts.tutor_id = NEW.recipient_id
        AND EXTRACT(MONTH FROM ts.scheduled_start) = current_month
        AND EXTRACT(YEAR FROM ts.scheduled_start) = current_year
        ON CONFLICT (tutor_id, year, month) DO UPDATE SET
            total_sessions = EXCLUDED.total_sessions,
            completed_sessions = EXCLUDED.completed_sessions,
            total_earnings = EXCLUDED.total_earnings,
            total_hours = EXCLUDED.total_hours,
            average_rating = EXCLUDED.average_rating,
            total_reviews = EXCLUDED.total_reviews,
            updated_at = CURRENT_TIMESTAMP;
            
        RAISE NOTICE 'Updated tutor stats for tutor % after payment completion', NEW.recipient_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment statistics updates
DROP TRIGGER IF EXISTS payment_completion_stats_trigger ON payments;
CREATE TRIGGER payment_completion_stats_trigger
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_tutor_stats_on_payment();

-- Comments for documentation
COMMENT ON FUNCTION create_payment_on_session_completion() IS 'Automatically creates payment records when tutoring sessions are marked as completed';
COMMENT ON FUNCTION update_tutor_stats_on_payment() IS 'Updates tutor profile statistics and performance metrics when payments are completed';
COMMENT ON TRIGGER session_completion_payment_trigger ON tutoring_sessions IS 'Creates payment record when session status changes to completed';
COMMENT ON TRIGGER payment_completion_stats_trigger ON payments IS 'Updates tutor statistics when payment is completed';