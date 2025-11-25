const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get all users with pagination and filtering
router.get('/users', [
    expressQuery('role').optional().isIn(['student', 'tutor', 'admin']),
    expressQuery('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']),
    expressQuery('search').optional().isString(),
    expressQuery('limit').optional().isInt({ min: 1, max: 100 }),
    expressQuery('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    logger.info(`[${requestId}] Admin request: Get all users`, {
        userId: req.user?.id,
        userRole: req.user?.role,
        filters: req.query
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(`[${requestId}] Validation failed:`, errors.array());
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const { role, status, search } = req.query;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        logger.debug(`[${requestId}] Query parameters:`, { role, status, search, limit, offset });

        let queryText = `
        SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
               tp.rating, tp.total_sessions, tp.is_verified,
               COALESCE(
                   (SELECT json_agg(json_build_object('id', s.id, 'name', s.name))
                    FROM tutor_subjects ts
                    JOIN subjects s ON ts.subject_id = s.id
                    WHERE ts.tutor_id = u.id), '[]'::json
               ) as subjects
        FROM users u
        LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
        WHERE 1=1
      `;

        const params = [];

        if (role) {
            queryText += ` AND u.role = $${params.length + 1}`;
            params.push(role);
        }

        if (status) {
            // Map status to is_active boolean
            if (status === 'active') {
                queryText += ` AND u.is_active = true`;
            } else if (status === 'inactive') {
                queryText += ` AND u.is_active = false`;
            }
        }

        if (search) {
            queryText += ` AND (u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        queryText += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        logger.debug(`[${requestId}] Executing users query with ${params.length} parameters`);
        const result = await query(queryText, params);
        logger.info(`[${requestId}] Users query successful: ${result.rows.length} rows returned`);

        const users = result.rows.map(row => ({
            id: row.id,
            email: row.email,
            role: row.role,
            firstName: row.first_name,
            lastName: row.last_name,
            phone: row.phone,
            status: row.is_active ? 'active' : 'inactive',
            isActive: row.is_active,
            createdAt: row.created_at,
            subjects: Array.isArray(row.subjects) ? row.subjects : [],
            ...(row.role === 'tutor' && {
                tutorStats: {
                    rating: row.rating || 0,
                    totalSessions: row.total_sessions || 0,
                    isVerified: row.is_verified || false
                }
            })
        }));

        // Get total count for pagination
        let countQueryText = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const countParams = [];

        if (role) {
            countQueryText += ` AND role = $${countParams.length + 1}`;
            countParams.push(role);
        }

        if (status) {
            if (status === 'active') {
                countQueryText += ` AND is_active = true`;
            } else if (status === 'inactive') {
                countQueryText += ` AND is_active = false`;
            }
        }

        if (search) {
            countQueryText += ` AND (first_name ILIKE $${countParams.length + 1} OR last_name ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1})`;
            countParams.push(`%${search}%`);
        }

        logger.debug(`[${requestId}] Executing count query`);
        const countResult = await query(countQueryText, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        logger.info(`[${requestId}] Admin users request completed successfully:`, {
            usersReturned: users.length,
            totalUsers: totalCount,
            hasMore: offset + limit < totalCount
        });

        res.json({
            users,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount
            }
        });
    } catch (error) {
        logger.error(`[${requestId}] Admin get users failed:`, {
            message: error.message,
            code: error.code,
            stack: error.stack,
            userId: req.user?.id
        });

        // Return a more informative error response
        res.status(500).json({
            message: 'Failed to load users. Please try again.',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code
            } : undefined
        });
    }
}));

// Update user status
router.patch('/users/:id/status', [
    body('status').isIn(['active', 'inactive', 'suspended', 'pending'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { status } = req.body;

    // Map status to is_active boolean (simplified for now)
    const isActive = status === 'active';

    const result = await query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_active',
        [isActive, req.params.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({
        message: 'User status updated successfully',
        user: {
            id: result.rows[0].id,
            email: result.rows[0].email,
            status: result.rows[0].is_active ? 'active' : 'inactive',
            isActive: result.rows[0].is_active
        }
    });
}));

// Get platform statistics
router.get('/stats', asyncHandler(async (req, res) => {
    // Get user counts by role and status
    const userStats = await query(`
    SELECT role, is_active, COUNT(*) as count
    FROM users
    GROUP BY role, is_active
    ORDER BY role, is_active
  `);

    // Get session statistics
    const sessionStats = await query(`
    SELECT 
      status,
      COUNT(*) as count,
      AVG(hourly_rate) as avg_rate,
      SUM(CASE WHEN status = 'completed' THEN payment_amount ELSE 0 END) as total_revenue
    FROM tutoring_sessions
    GROUP BY status
  `);

    // Get total sessions count
    const totalSessions = await query(`
    SELECT COUNT(*) as count
    FROM tutoring_sessions
  `);

    // Get recent activity
    const recentUsers = await query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

    const recentSessions = await query(`
    SELECT COUNT(*) as count
    FROM tutoring_sessions
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

    // Get top tutors
    const topTutors = await query(`
    SELECT u.first_name, u.last_name, tp.rating, tp.total_sessions
    FROM users u
    JOIN tutor_profiles tp ON u.id = tp.user_id
    WHERE u.role = 'tutor' AND u.is_active = true
    ORDER BY tp.rating DESC, tp.total_sessions DESC
    LIMIT 5
  `);

    res.json({
        userStats: userStats.rows,
        sessionStats: sessionStats.rows,
        totalSessions: parseInt(totalSessions.rows[0].count),
        recentActivity: {
            newUsers: parseInt(recentUsers.rows[0].count),
            newSessions: parseInt(recentSessions.rows[0].count)
        },
        topTutors: topTutors.rows.map(row => ({
            name: `${row.first_name} ${row.last_name}`,
            rating: row.rating,
            totalSessions: row.total_sessions
        }))
    });
}));

// Get all sessions with filtering
router.get('/sessions', [
    expressQuery('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
    expressQuery('startDate').optional().isISO8601(),
    expressQuery('endDate').optional().isISO8601(),
    expressQuery('limit').optional().isInt({ min: 1, max: 100 }),
    expressQuery('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { status, startDate, endDate } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = `
    SELECT s.*, 
           student.first_name as student_first_name, student.last_name as student_last_name,
           tutor.first_name as tutor_first_name, tutor.last_name as tutor_last_name,
           sub.name as subject_name
    FROM tutoring_sessions s
    JOIN users student ON s.student_id = student.id
    JOIN users tutor ON s.tutor_id = tutor.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    WHERE 1=1
  `;

    const params = [];

    if (status) {
        queryText += ` AND s.status = $${params.length + 1}`;
        params.push(status);
    }

    if (startDate) {
        queryText += ` AND s.scheduled_start >= $${params.length + 1}`;
        params.push(startDate);
    }

    if (endDate) {
        queryText += ` AND s.scheduled_start <= $${params.length + 1}`;
        params.push(endDate);
    }

    queryText += ` ORDER BY s.scheduled_start DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const sessions = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        scheduledAt: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        startedAt: row.actual_start,
        endedAt: row.actual_end,
        durationMinutes: row.duration_minutes,
        actualDuration: row.actual_start && row.actual_end
            ? Math.round((new Date(row.actual_end) - new Date(row.actual_start)) / (1000 * 60))
            : null,
        rate: row.hourly_rate,
        paymentAmount: row.payment_amount,
        status: row.status,
        sessionType: row.session_type,
        notes: row.session_notes,
        homeworkAssigned: row.homework_assigned,
        materialsUsed: row.materials_used,
        meetingLink: row.meeting_link,
        meetingRoom: row.meeting_room,
        cancellationReason: row.cancellation_reason,
        student: {
            id: row.student_id,
            name: `${row.student_first_name} ${row.student_last_name}`
        },
        tutor: {
            id: row.tutor_id,
            name: `${row.tutor_first_name} ${row.tutor_last_name}`
        },
        subject: row.subject_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));

    res.json({ sessions });
}));

// Delete user (soft delete by setting status to inactive)
router.delete('/users/:id', asyncHandler(async (req, res) => {
    const result = await query(
        'UPDATE users SET status = $1 WHERE id = $2 AND id != $3 RETURNING id',
        ['inactive', req.params.id, req.user.id] // Prevent admin from deleting themselves
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found or cannot be deleted' });
    }

    res.json({ message: 'User deactivated successfully' });
}));



// Get all settings (admin only)
router.get('/settings', [
    expressQuery('category').optional().isString(),
    expressQuery('key').optional().isString()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { category, key } = req.query;

    let queryText = 'SELECT * FROM settings WHERE 1=1';
    const params = [];

    if (category) {
        queryText += ` AND category = $${params.length + 1}`;
        params.push(category);
    }

    if (key) {
        queryText += ` AND key = $${params.length + 1}`;
        params.push(key);
    }

    queryText += ' ORDER BY category, key';

    const result = await query(queryText, params);

    // Group settings by category
    const settingsByCategory = result.rows.reduce((acc, setting) => {
        if (!acc[setting.category]) {
            acc[setting.category] = [];
        }
        acc[setting.category].push({
            id: setting.id,
            key: setting.key,
            value: setting.value,
            description: setting.description,
            dataType: setting.data_type,
            isPublic: setting.is_public,
            createdAt: setting.created_at,
            updatedAt: setting.updated_at
        });
        return acc;
    }, {});

    res.json({ settings: settingsByCategory });
}));

// Update setting (admin only)
router.put('/settings/:key', [
    body('value').notEmpty().withMessage('Value is required'),
    body('description').optional().isString()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { key } = req.params;
    const { value, description } = req.body;

    // Check if setting exists
    const existingSetting = await query('SELECT * FROM settings WHERE key = $1', [key]);

    if (existingSetting.rows.length === 0) {
        return res.status(404).json({ message: 'Setting not found' });
    }

    // Update the setting
    const result = await query(`
        UPDATE settings 
        SET value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP
        WHERE key = $3
        RETURNING *
    `, [value, description, key]);

    res.json({
        message: 'Setting updated successfully',
        setting: {
            id: result.rows[0].id,
            key: result.rows[0].key,
            value: result.rows[0].value,
            description: result.rows[0].description,
            category: result.rows[0].category,
            dataType: result.rows[0].data_type,
            isPublic: result.rows[0].is_public,
            updatedAt: result.rows[0].updated_at
        }
    });
}));

// Create new setting (admin only)
router.post('/settings', [
    body('key').trim().isLength({ min: 1, max: 100 }).withMessage('Key must be 1-100 characters'),
    body('value').notEmpty().withMessage('Value is required'),
    body('category').trim().isLength({ min: 1, max: 50 }).withMessage('Category must be 1-50 characters'),
    body('description').optional().isString(),
    body('dataType').optional().isIn(['string', 'number', 'boolean', 'json']),
    body('isPublic').optional().isBoolean()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { key, value, category, description, dataType, isPublic } = req.body;

    // Check if setting already exists
    const existingSetting = await query('SELECT * FROM settings WHERE key = $1', [key]);

    if (existingSetting.rows.length > 0) {
        return res.status(409).json({ message: 'Setting with this key already exists' });
    }

    // Create the setting
    const result = await query(`
        INSERT INTO settings (key, value, category, description, data_type, is_public)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `, [key, value, category, description || null, dataType || 'string', isPublic || false]);

    res.status(201).json({
        message: 'Setting created successfully',
        setting: {
            id: result.rows[0].id,
            key: result.rows[0].key,
            value: result.rows[0].value,
            description: result.rows[0].description,
            category: result.rows[0].category,
            dataType: result.rows[0].data_type,
            isPublic: result.rows[0].is_public,
            createdAt: result.rows[0].created_at
        }
    });
}));

// Delete setting (admin only)
router.delete('/settings/:key', asyncHandler(async (req, res) => {
    const { key } = req.params;

    const result = await query('DELETE FROM settings WHERE key = $1 RETURNING *', [key]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
}));

module.exports = router;

// Populate tutor-subject relationships for demo data
router.post('/populate-tutor-subjects', asyncHandler(async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    logger.info(`[${requestId}] Admin request: Populate tutor-subject relationships`, {
        userId: req.user?.id,
        userRole: req.user?.role
    });

    try {
        // First, clear existing relationships
        await query('DELETE FROM tutor_subjects');
        logger.info(`[${requestId}] Cleared existing tutor-subject relationships`);

        // Get tutor and subject data
        const tutors = await query('SELECT id, email, first_name, last_name FROM users WHERE role = $1', ['tutor']);
        const subjects = await query('SELECT id, name FROM subjects');

        logger.info(`[${requestId}] Found ${tutors.rows.length} tutors and ${subjects.rows.length} subjects`);

        // Log tutor emails for debugging
        tutors.rows.forEach(tutor => {
            logger.info(`[${requestId}] Tutor: ${tutor.email}`);
        });

        // Create subject name to ID mapping
        const subjectMap = {};
        subjects.rows.forEach(subject => {
            subjectMap[subject.name.toLowerCase()] = subject.id;
        });

        // Define tutor-subject mappings based on tutor names/background
        const getSubjectsForTutor = (email, firstName, lastName) => {
            // Check for specific seed file tutors first
            if (email === 'sarah.math@tutorconnect.com') return ['mathematics'];
            if (email === 'david.physics@tutorconnect.com') return ['physics', 'mathematics'];
            if (email === 'maria.spanish@tutorconnect.com') return ['spanish'];

            // Map based on names and reasonable assumptions
            const fullName = `${firstName} ${lastName}`.toLowerCase();
            const subjects = [];

            if (fullName.includes('sarah') && fullName.includes('johnson')) {
                subjects.push('mathematics', 'physics');
            } else if (fullName.includes('michael') && fullName.includes('chen')) {
                subjects.push('computer science', 'mathematics');
            } else if (fullName.includes('david') && fullName.includes('chen')) {
                subjects.push('physics', 'mathematics');
            } else if (fullName.includes('david') && fullName.includes('kim')) {
                subjects.push('computer science');
            } else if (fullName.includes('emma') && fullName.includes('rodriguez')) {
                subjects.push('spanish', 'english literature');
            } else if (fullName.includes('maria') && fullName.includes('rodriguez')) {
                subjects.push('spanish');
            } else if (fullName.includes('demo') && fullName.includes('tutor')) {
                subjects.push('mathematics');
            } else {
                // Default subjects for unrecognized tutors
                subjects.push('mathematics');
            }

            return subjects;
        };

        let insertedCount = 0;

        // Insert tutor-subject relationships
        for (const tutor of tutors.rows) {
            const subjectNames = getSubjectsForTutor(tutor.email, tutor.first_name, tutor.last_name);

            logger.info(`[${requestId}] Processing tutor: ${tutor.email} (${tutor.first_name} ${tutor.last_name}) -> ${subjectNames.join(', ')}`);

            for (const subjectName of subjectNames) {
                const subjectId = subjectMap[subjectName.toLowerCase()];
                if (subjectId) {
                    await query(
                        'INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [tutor.id, subjectId]
                    );
                    insertedCount++;
                    logger.debug(`[${requestId}] Added ${tutor.email} -> ${subjectName}`);
                } else {
                    logger.warn(`[${requestId}] Subject not found: ${subjectName} for tutor ${tutor.email}`);
                }
            }
        }

        logger.info(`[${requestId}] Successfully inserted ${insertedCount} tutor-subject relationships`);

        res.json({
            message: 'Tutor-subject relationships populated successfully',
            tutorsProcessed: tutors.rows.length,
            relationshipsCreated: insertedCount
        });

    } catch (error) {
        logger.error(`[${requestId}] Error populating tutor-subject relationships:`, error);
        throw error;
    }
}));

// Get all reviews with filtering and pagination
router.get('/reviews', [
    expressQuery('rating').optional().isInt({ min: 1, max: 5 }),
    expressQuery('reviewerType').optional().isIn(['student', 'tutor']),
    expressQuery('dateRange').optional().isIn(['all', 'week', 'month', 'quarter']),
    expressQuery('search').optional().isString(),
    expressQuery('limit').optional().isInt({ min: 1, max: 100 }),
    expressQuery('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    logger.info(`[${requestId}] Admin request: Get all reviews`, {
        userId: req.user?.id,
        userRole: req.user?.role,
        filters: req.query
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(`[${requestId}] Validation failed:`, errors.array());
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const { rating, reviewerType, dateRange, search } = req.query;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        let queryText = `
            SELECT sr.id, sr.rating, sr.comment, sr.reviewer_type, sr.would_recommend, 
                   sr.created_at, sr.session_id, sr.reviewer_id, sr.reviewee_id,
                   reviewer.first_name as reviewer_first_name,
                   reviewer.last_name as reviewer_last_name,
                   reviewer.email as reviewer_email,
                   reviewer.profile_picture_url as reviewer_avatar,
                   reviewee.first_name as reviewee_first_name,
                   reviewee.last_name as reviewee_last_name,
                   reviewee.email as reviewee_email,
                   s.name as subject_name,
                   ts.scheduled_start,
                   ts.duration_minutes,
                   ts.status as session_status
            FROM session_reviews sr
            JOIN users reviewer ON sr.reviewer_id = reviewer.id
            JOIN users reviewee ON sr.reviewee_id = reviewee.id
            LEFT JOIN tutoring_sessions ts ON sr.session_id = ts.id
            LEFT JOIN subjects s ON ts.subject_id = s.id
            WHERE 1=1
        `;

        const params = [];

        // Rating filter
        if (rating) {
            queryText += ` AND sr.rating = $${params.length + 1}`;
            params.push(rating);
        }

        // Reviewer type filter
        if (reviewerType) {
            queryText += ` AND sr.reviewer_type = $${params.length + 1}`;
            params.push(reviewerType);
        }

        // Date range filter
        if (dateRange && dateRange !== 'all') {
            const days = { week: 7, month: 30, quarter: 90 };
            if (days[dateRange]) {
                queryText += ` AND sr.created_at >= NOW() - INTERVAL '${days[dateRange]} days'`;
            }
        }

        // Search filter
        if (search) {
            queryText += ` AND (
                sr.comment ILIKE $${params.length + 1} OR
                reviewer.first_name ILIKE $${params.length + 1} OR
                reviewer.last_name ILIKE $${params.length + 1} OR
                reviewee.first_name ILIKE $${params.length + 1} OR
                reviewee.last_name ILIKE $${params.length + 1} OR
                s.name ILIKE $${params.length + 1}
            )`;
            params.push(`%${search}%`);
        }

        queryText += ` ORDER BY sr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        logger.debug(`[${requestId}] Executing reviews query with ${params.length} parameters`);
        const result = await query(queryText, params);
        logger.info(`[${requestId}] Reviews query successful: ${result.rows.length} rows returned`);

        const reviews = result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            rating: row.rating,
            comment: row.comment,
            reviewerType: row.reviewer_type,
            wouldRecommend: row.would_recommend,
            createdAt: row.created_at,
            reviewer: {
                id: row.reviewer_id,
                firstName: row.reviewer_first_name,
                lastName: row.reviewer_last_name,
                email: row.reviewer_email,
                avatar: row.reviewer_avatar
            },
            reviewee: {
                id: row.reviewee_id,
                firstName: row.reviewee_first_name,
                lastName: row.reviewee_last_name,
                email: row.reviewee_email
            },
            session: row.subject_name ? {
                subject: row.subject_name,
                duration: row.duration_minutes,
                scheduledStart: row.scheduled_start,
                status: row.session_status
            } : null
        }));

        // Get total count for pagination
        let countQueryText = 'SELECT COUNT(*) FROM session_reviews sr WHERE 1=1';
        const countParams = [];
        let paramIndex = 0;

        if (rating) {
            countQueryText += ` AND sr.rating = $${++paramIndex}`;
            countParams.push(rating);
        }
        if (reviewerType) {
            countQueryText += ` AND sr.reviewer_type = $${++paramIndex}`;
            countParams.push(reviewerType);
        }
        if (dateRange && dateRange !== 'all') {
            const days = { week: 7, month: 30, quarter: 90 };
            if (days[dateRange]) {
                countQueryText += ` AND sr.created_at >= NOW() - INTERVAL '${days[dateRange]} days'`;
            }
        }
        if (search) {
            countQueryText += ` AND EXISTS (
                SELECT 1 FROM users reviewer WHERE reviewer.id = sr.reviewer_id AND 
                (sr.comment ILIKE $${++paramIndex} OR reviewer.first_name ILIKE $${paramIndex} OR reviewer.last_name ILIKE $${paramIndex})
            )`;
            countParams.push(`%${search}%`);
        }

        const totalResult = await query(countQueryText, countParams);
        const totalReviews = parseInt(totalResult.rows[0].count);

        res.json({
            reviews,
            pagination: {
                total: totalReviews,
                limit,
                offset,
                hasMore: offset + limit < totalReviews
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Error fetching reviews:`, error);
        throw error;
    }
}));

// Delete a review
router.delete('/reviews/:id', asyncHandler(async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    logger.info(`[${requestId}] Admin request: Delete review`, {
        userId: req.user?.id,
        reviewId: req.params.id
    });

    try {
        const result = await query(
            'DELETE FROM session_reviews WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }

        logger.info(`[${requestId}] Review deleted successfully: ${req.params.id}`);
        res.json({ message: 'Review deleted successfully' });

    } catch (error) {
        logger.error(`[${requestId}] Error deleting review:`, error);
        throw error;
    }
}));

// Update tutor verification status
router.patch('/tutors/:id/verification', [
    body('isVerified').isBoolean()
], asyncHandler(async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        logger.warn(`[${requestId}] Validation failed:`, errors.array());
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { isVerified } = req.body;
    const userId = req.params.id;

    try {
        // First check if user exists and is a tutor
        const userResult = await query(
            'SELECT id, role FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userResult.rows[0].role !== 'tutor') {
            return res.status(400).json({ message: 'User is not a tutor' });
        }

        // Update or insert tutor profile verification status
        logger.info(`[${requestId}] Attempting to update tutor verification:`, { userId, isVerified });

        // First check if tutor profile exists
        const existingProfile = await query(
            'SELECT user_id FROM tutor_profiles WHERE user_id = $1',
            [userId]
        );

        let result;
        if (existingProfile.rows.length > 0) {
            // Update existing profile
            result = await query(`
                UPDATE tutor_profiles 
                SET is_verified = $2, updated_at = NOW()
                WHERE user_id = $1
                RETURNING user_id, is_verified
            `, [userId, isVerified]);
        } else {
            // Insert new profile with default values
            result = await query(`
                INSERT INTO tutor_profiles (
                    user_id, 
                    is_verified, 
                    hourly_rate, 
                    years_of_experience,
                    created_at,
                    updated_at
                )
                VALUES ($1, $2, 0.00, 0, NOW(), NOW())
                RETURNING user_id, is_verified
            `, [userId, isVerified]);
        }

        logger.info(`[${requestId}] Tutor verification updated successfully:`, { userId, isVerified, result: result.rows[0] });

        res.json({
            message: 'Tutor verification status updated successfully',
            tutor: {
                id: result.rows[0].user_id,
                isVerified: result.rows[0].is_verified
            }
        });
    } catch (error) {
        logger.error(`[${requestId}] Error updating tutor verification:`, {
            error: error.message,
            stack: error.stack,
            userId,
            isVerified
        });
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

module.exports = router;