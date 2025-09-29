const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { role, status, search } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = `
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
           tp.rating, tp.total_sessions
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

    const result = await query(queryText, params);

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
        ...(row.role === 'tutor' && {
            tutorStats: {
                rating: row.rating || 0,
                totalSessions: row.total_sessions || 0
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

    const countResult = await query(countQueryText, countParams);

    res.json({
        users,
        pagination: {
            total: parseInt(countResult.rows[0].count),
            limit,
            offset,
            hasMore: offset + limit < parseInt(countResult.rows[0].count)
        }
    });
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
            status: result.rows[0].is_active ? 'active' : 'inactive'
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
      SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue
    FROM tutoring_sessions
    GROUP BY status
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
        scheduledAt: row.scheduled_start,
        durationMinutes: Math.round((new Date(row.scheduled_end) - new Date(row.scheduled_start)) / (1000 * 60)),
        rate: row.hourly_rate,
        status: row.status,
        student: {
            id: row.student_id,
            name: `${row.student_first_name} ${row.student_last_name}`
        },
        tutor: {
            id: row.tutor_id,
            name: `${row.tutor_first_name} ${row.tutor_last_name}`
        },
        subject: row.subject_name,
        createdAt: row.created_at
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

// Create admin announcement/notification
router.post('/notifications', [
    body('title').trim().isLength({ min: 1, max: 255 }),
    body('message').trim().isLength({ min: 1, max: 1000 }),
    body('type').optional().isString(),
    body('targetRole').optional().isIn(['student', 'tutor', 'all'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { title, message, type, targetRole } = req.body;

    // Fix: The column should be 'is_active', not 'status'
    let usersQuery = 'SELECT id FROM users WHERE is_active = $1';
    const params = [true];

    if (targetRole && targetRole !== 'all') {
        usersQuery += ` AND role = $${params.length + 1}`;
        params.push(targetRole);
    }

    const usersResult = await query(usersQuery, params);

    // Create notifications for all target users
    const notificationPromises = usersResult.rows.map(user =>
        query(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
    `, [user.id, type || 'announcement', title, message])
    );

    await Promise.all(notificationPromises);

    res.json({
        message: 'Notifications sent successfully',
        recipientCount: usersResult.rows.length
    });
}));

// Get all notifications/announcements (admin only)
router.get('/notifications', [
    expressQuery('type').optional().isString(),
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

    const { type } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = `
    SELECT DISTINCT n.id, n.type, n.title, n.message, n.created_at,
           COUNT(n.user_id) OVER (PARTITION BY n.title, n.message, n.type, DATE_TRUNC('minute', n.created_at)) as recipient_count,
           COUNT(CASE WHEN n.is_read = true THEN 1 END) OVER (PARTITION BY n.title, n.message, n.type, DATE_TRUNC('minute', n.created_at)) as read_count
    FROM notifications n
    WHERE 1=1
  `;

    const params = [];

    if (type) {
        queryText += ` AND n.type = $${params.length + 1}`;
        params.push(type);
    }

    queryText += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Group notifications by title, message, and time to avoid duplicates
    const uniqueNotifications = [];
    const seen = new Set();

    result.rows.forEach(row => {
        const key = `${row.title}-${row.message}-${row.type}-${row.created_at}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueNotifications.push({
                id: row.id,
                type: row.type,
                title: row.title,
                message: row.message,
                recipientCount: parseInt(row.recipient_count),
                readCount: parseInt(row.read_count),
                createdAt: row.created_at
            });
        }
    });

    res.json({ notifications: uniqueNotifications });
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