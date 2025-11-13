const express = require('express');
const { query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Get calendar events for a user (sessions + tasks)
 * Combines sessions and tasks into a unified calendar view
 */
router.get('/events', [
    authenticateToken,
    expressQuery('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    expressQuery('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
    expressQuery('type').optional().isIn(['session', 'task', 'all']).withMessage('Type must be session, task, or all'),
    expressQuery('status').optional().isString(),
    expressQuery('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
    expressQuery('view').optional().isIn(['month', 'week', 'day']).withMessage('View must be month, week, or day')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const { startDate, endDate, type = 'all', status, limit = 100, view = 'month' } = req.query;

    let events = [];

    try {
        // Get sessions if requested
        if (type === 'all' || type === 'session') {
            let sessionQuery = `
                SELECT 
                    s.id,
                    s.title,
                    s.description,
                    s.scheduled_start,
                    s.scheduled_end,
                    CAST(s.scheduled_start AS DATE) as session_date,
                    CAST(s.scheduled_start AS TIME) as start_time,
                    CAST(s.scheduled_end AS TIME) as end_time,
                    s.duration_minutes,
                    s.status,
                    s.session_type,
                    s.meeting_link,
                    s.meeting_room as location,
                    s.hourly_rate,
                    s.payment_amount,
                    s.created_at,
                    s.updated_at,
                    student.first_name as student_first_name, 
                    student.last_name as student_last_name,
                    student.profile_picture_url as student_avatar,
                    tutor.first_name as tutor_first_name, 
                    tutor.last_name as tutor_last_name,
                    tutor.profile_picture_url as tutor_avatar,
                    sub.name as subject_name,
                    'session' as event_type
                FROM tutoring_sessions s
                JOIN users student ON s.student_id = student.id
                JOIN users tutor ON s.tutor_id = tutor.id
                LEFT JOIN subjects sub ON s.subject_id = sub.id
                WHERE s.scheduled_start IS NOT NULL
            `;

            const sessionParams = [];
            let paramCount = 0;

            // Filter by user for students and tutors, show all for admins
            if (userRole !== 'admin') {
                paramCount++;
                sessionQuery += ` AND (s.student_id = $${paramCount} OR s.tutor_id = $${paramCount})`;
                sessionParams.push(userId);
            }

            // Add date filters for sessions
            if (startDate) {
                paramCount++;
                sessionQuery += ` AND DATE(s.scheduled_start) >= $${paramCount}::date`;
                sessionParams.push(new Date(startDate).toISOString().split('T')[0]);
            }

            if (endDate) {
                paramCount++;
                sessionQuery += ` AND DATE(s.scheduled_start) <= $${paramCount}::date`;
                sessionParams.push(new Date(endDate).toISOString().split('T')[0]);
            }

            // Add status filter for sessions
            if (status) {
                paramCount++;
                sessionQuery += ` AND s.status = $${paramCount}`;
                sessionParams.push(status);
            }

            sessionQuery += ` ORDER BY s.scheduled_start ASC`;

            const sessionResult = await query(sessionQuery, sessionParams);

            // Format session events
            sessionResult.rows.forEach(session => {
                const startDateTime = new Date(session.scheduled_start);
                const endDateTime = new Date(session.scheduled_end);

                events.push({
                    id: `session-${session.id}`,
                    title: session.title || `${session.subject_name || 'Tutoring'} Session`,
                    description: session.description,
                    start: startDateTime.toISOString(),
                    end: endDateTime.toISOString(),
                    date: startDateTime.toISOString().split('T')[0],
                    session_date: startDateTime.toISOString(),
                    scheduled_start: startDateTime.toISOString(),
                    time: startDateTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    duration: session.duration_minutes,
                    type: 'session',
                    status: session.status,
                    location: session.session_type === 'online' ? 'Online' : (session.location || 'In-person'),
                    sessionType: session.session_type,
                    session_type: session.session_type,
                    meetingLink: session.meeting_link,
                    hourlyRate: session.hourly_rate,
                    subject: session.subject_name,
                    student: {
                        name: `${session.student_first_name} ${session.student_last_name}`,
                        avatar: session.student_avatar
                    },
                    tutor: {
                        name: `${session.tutor_first_name} ${session.tutor_last_name}`,
                        avatar: session.tutor_avatar
                    },
                    createdAt: session.created_at,
                    updatedAt: session.updated_at
                });
            });
        }

        // Get tasks if requested (only for students and tutors, not admins)
        if ((type === 'all' || type === 'task') && userRole !== 'admin') {
            let taskQuery = `
                SELECT 
                    t.id,
                    t.title,
                    t.description,
                    t.due_date,
                    t.status,
                    t.priority,
                    t.estimated_hours,
                    t.completed_at,
                    t.created_at,
                    t.updated_at,
                    'task' as event_type
                FROM tasks t
                WHERE t.user_id = $1
                AND t.due_date IS NOT NULL
            `;

            const taskParams = [userId];
            let paramCount = 1;

            // Add date filters for tasks
            if (startDate) {
                paramCount++;
                taskQuery += ` AND DATE(t.due_date) >= $${paramCount}::date`;
                taskParams.push(new Date(startDate).toISOString().split('T')[0]);
            }

            if (endDate) {
                paramCount++;
                taskQuery += ` AND DATE(t.due_date) <= $${paramCount}::date`;
                taskParams.push(new Date(endDate).toISOString().split('T')[0]);
            }

            // Add status filter for tasks
            if (status) {
                paramCount++;
                taskQuery += ` AND t.status = $${paramCount}`;
                taskParams.push(status);
            }

            taskQuery += ` ORDER BY t.due_date ASC`;

            const taskResult = await query(taskQuery, taskParams);

            // Format task events
            taskResult.rows.forEach(task => {
                const eventDate = new Date(task.due_date);

                events.push({
                    id: `task-${task.id}`,
                    taskId: task.id,
                    title: task.title,
                    description: task.description,
                    start: task.due_date,
                    end: null,
                    date: eventDate.toISOString().split('T')[0],
                    due_date: task.due_date,
                    dueDate: task.due_date,
                    time: 'Due',
                    type: 'task',
                    status: task.status,
                    priority: task.priority,
                    progress: task.progress_percentage,
                    progressPercentage: task.progress_percentage,
                    estimatedDuration: task.estimated_hours ? Math.round(task.estimated_hours * 60) : null, // Convert hours to minutes
                    estimatedHours: task.estimated_hours,
                    tags: task.tags,
                    completedAt: task.completed_at,
                    createdAt: task.created_at,
                    updatedAt: task.updated_at
                });
            });
        }

        // Sort events by date/time (earliest first)
        events.sort((a, b) => {
            const dateA = new Date(a.start || a.date);
            const dateB = new Date(b.start || b.date);
            return dateA - dateB;
        });

        // Apply limit
        if (events.length > limit) {
            events = events.slice(0, limit);
        }

        // Group events by date for easier frontend consumption
        const eventsByDate = {};
        events.forEach(event => {
            if (!eventsByDate[event.date]) {
                eventsByDate[event.date] = [];
            }
            eventsByDate[event.date].push(event);
        });

        res.json({
            success: true,
            events,
            eventsByDate,
            total: events.length,
            filters: {
                startDate,
                endDate,
                type,
                status,
                view
            }
        });

    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar events',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

/**
 * Get events for a specific date
 */
router.get('/events/date/:date', [
    authenticateToken,
    expressQuery('type').optional().isIn(['session', 'task', 'all'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { date } = req.params;
    const { type = 'all' } = req.query;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid date format. Use YYYY-MM-DD format.'
        });
    }

    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // Reuse the events endpoint logic with specific date range
    req.query = {
        ...req.query,
        startDate: startOfDay,
        endDate: endOfDay,
        type
    };

    // Call the events endpoint logic
    return router.stack[0].route.stack[0].handle(req, res);
}));

/**
 * Get calendar statistics for dashboard
 */
router.get('/stats', [
    authenticateToken,
    expressQuery('period').optional().isIn(['week', 'month', 'year'])
], asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = 'month' } = req.query;

    let dateFilter;
    const now = new Date();

    switch (period) {
        case 'week':
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default: // month
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    try {
        let sessionStats;

        // Get session statistics - admin sees all, others see only their sessions
        if (userRole === 'admin') {
            sessionStats = await query(`
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
                    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as upcoming_sessions,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions
                FROM tutoring_sessions 
                WHERE session_date >= $1::date
            `, [dateFilter.toISOString().split('T')[0]]);
        } else {
            sessionStats = await query(`
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
                    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as upcoming_sessions,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions
                FROM tutoring_sessions 
                WHERE (student_id = $1 OR tutor_id = $1)
                AND session_date >= $2::date
            `, [userId, dateFilter.toISOString().split('T')[0]]);
        }

        let taskStats = { rows: [{ total_tasks: 0, completed_tasks: 0, pending_tasks: 0, overdue_tasks: 0 }] };

        // Get task statistics (only for students and tutors)
        if (userRole !== 'admin') {
            taskStats = await query(`
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
                    COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks
                FROM tasks 
                WHERE user_id = $1
                AND created_at >= $2
            `, [userId, dateFilter]);
        }

        let upcomingEvents;

        // Get upcoming events (next 7 days)
        if (userRole === 'admin') {
            upcomingEvents = await query(`
                SELECT COUNT(*) as upcoming_events
                FROM tutoring_sessions 
                WHERE session_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                AND status = 'scheduled'
            `);
        } else {
            upcomingEvents = await query(`
                SELECT COUNT(*) as upcoming_events
                FROM (
                    SELECT session_date as event_date FROM tutoring_sessions 
                    WHERE (student_id = $1 OR tutor_id = $1) 
                    AND session_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                    AND status = 'scheduled'
                    UNION ALL
                    SELECT DATE(due_date) as event_date FROM tasks 
                    WHERE user_id = $1 
                    AND DATE(due_date) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                    AND status != 'completed'
                ) combined_events
            `, [userId]);
        }

        res.json({
            success: true,
            period,
            stats: {
                sessions: sessionStats.rows[0],
                tasks: taskStats.rows[0],
                upcomingEvents: parseInt(upcomingEvents.rows[0].upcoming_events)
            }
        });

    } catch (error) {
        console.error('Error fetching calendar stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

module.exports = router;