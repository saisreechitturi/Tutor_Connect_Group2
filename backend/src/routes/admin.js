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
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.status, u.created_at,
           tp.rating, tp.total_sessions, tp.total_earnings
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
        queryText += ` AND u.status = $${params.length + 1}`;
        params.push(status);
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
        status: row.status,
        createdAt: row.created_at,
        ...(row.role === 'tutor' && {
            tutorStats: {
                rating: row.rating,
                totalSessions: row.total_sessions,
                totalEarnings: row.total_earnings
            }
        })
    }));

    // Get total count for pagination
    const countResult = await query('SELECT COUNT(*) FROM users WHERE 1=1' +
        (role ? ` AND role = '${role}'` : '') +
        (status ? ` AND status = '${status}'` : '') +
        (search ? ` AND (first_name ILIKE '%${search}%' OR last_name ILIKE '%${search}%' OR email ILIKE '%${search}%')` : '')
    );

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

    const result = await query(
        'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, email, status',
        [status, req.params.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({
        message: 'User status updated successfully',
        user: result.rows[0]
    });
}));

// Get platform statistics
router.get('/stats', asyncHandler(async (req, res) => {
    // Get user counts by role and status
    const userStats = await query(`
    SELECT role, status, COUNT(*) as count
    FROM users
    GROUP BY role, status
    ORDER BY role, status
  `);

    // Get session statistics
    const sessionStats = await query(`
    SELECT 
      status,
      COUNT(*) as count,
      AVG(rate) as avg_rate,
      SUM(CASE WHEN status = 'completed' THEN rate * (duration_minutes::float / 60) ELSE 0 END) as total_revenue
    FROM sessions
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
    FROM sessions
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

    // Get top tutors
    const topTutors = await query(`
    SELECT u.first_name, u.last_name, tp.rating, tp.total_sessions, tp.total_earnings
    FROM users u
    JOIN tutor_profiles tp ON u.id = tp.user_id
    WHERE u.role = 'tutor' AND u.status = 'active'
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
            totalSessions: row.total_sessions,
            totalEarnings: row.total_earnings
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
    FROM sessions s
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
        queryText += ` AND s.scheduled_at >= $${params.length + 1}`;
        params.push(startDate);
    }

    if (endDate) {
        queryText += ` AND s.scheduled_at <= $${params.length + 1}`;
        params.push(endDate);
    }

    queryText += ` ORDER BY s.scheduled_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const sessions = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        scheduledAt: row.scheduled_at,
        durationMinutes: row.duration_minutes,
        rate: row.rate,
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

    // Get target users
    let usersQuery = 'SELECT id FROM users WHERE status = $1';
    const params = ['active'];

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

module.exports = router;