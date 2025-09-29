const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireOwnership } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get user profile
router.get('/:id', authenticateToken, requireOwnership('id'), asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.avatar_url, 
           u.bio, u.location, u.timezone, u.status, u.created_at,
           tp.title, tp.hourly_rate, tp.experience_years, tp.education, tp.certifications,
           tp.languages, tp.specializations, tp.rating, tp.total_sessions, tp.total_earnings
    FROM users u
    LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
    WHERE u.id = $1
  `, [req.params.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            phone: user.phone,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            location: user.location,
            timezone: user.timezone,
            status: user.status,
            createdAt: user.created_at,
            ...(user.role === 'tutor' && {
                profile: {
                    title: user.title,
                    hourlyRate: user.hourly_rate,
                    experienceYears: user.experience_years,
                    education: user.education,
                    certifications: user.certifications,
                    languages: user.languages,
                    specializations: user.specializations,
                    rating: user.rating,
                    totalSessions: user.total_sessions,
                    totalEarnings: user.total_earnings
                }
            })
        }
    });
}));

// Update user profile
router.put('/:id', [
    authenticateToken,
    requireOwnership('id'),
    body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
    body('phone').optional().isMobilePhone(),
    body('bio').optional().isLength({ max: 1000 }),
    body('location').optional().isLength({ max: 255 }),
    body('timezone').optional().isLength({ max: 50 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { firstName, lastName, phone, bio, location, timezone, avatarUrl } = req.body;

    // Update user basic info
    const userUpdateResult = await query(`
    UPDATE users 
    SET first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        bio = COALESCE($4, bio),
        location = COALESCE($5, location),
        timezone = COALESCE($6, timezone),
        avatar_url = COALESCE($7, avatar_url)
    WHERE id = $8
    RETURNING *
  `, [firstName, lastName, phone, bio, location, timezone, avatarUrl, req.params.id]);

    if (userUpdateResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    // If tutor, also update tutor profile
    if (req.user.role === 'tutor') {
        const { title, hourlyRate, experienceYears, education, certifications, languages, specializations } = req.body;

        await query(`
      UPDATE tutor_profiles 
      SET title = COALESCE($1, title),
          hourly_rate = COALESCE($2, hourly_rate),
          experience_years = COALESCE($3, experience_years),
          education = COALESCE($4, education),
          certifications = COALESCE($5, certifications),
          languages = COALESCE($6, languages),
          specializations = COALESCE($7, specializations)
      WHERE user_id = $8
    `, [title, hourlyRate, experienceYears, education, certifications, languages, specializations, req.params.id]);
    }

    res.json({ message: 'Profile updated successfully' });
}));

// Get user's sessions
router.get('/:id/sessions', [
    authenticateToken,
    requireOwnership('id'),
    expressQuery('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
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

    const { status } = req.query;
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
    WHERE (s.student_id = $1 OR s.tutor_id = $1)
  `;

    const params = [req.params.id];

    if (status) {
        queryText += ` AND s.status = $${params.length + 1}`;
        params.push(status);
    }

    queryText += ` ORDER BY s.scheduled_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const sessions = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
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
        ratings: {
            student: row.student_rating,
            tutor: row.tutor_rating
        },
        feedback: {
            student: row.student_feedback,
            tutor: row.tutor_feedback
        },
        createdAt: row.created_at
    }));

    res.json({ sessions });
}));

// Get user's tasks  
router.get('/:id/tasks', [
    authenticateToken,
    requireOwnership('id'),
    expressQuery('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
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

    const { status } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [req.params.id];

    if (status) {
        queryText += ` AND status = $${params.length + 1}`;
        params.push(status);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const tasks = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: row.status,
        progress: row.progress,
        dueDate: row.due_date,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));

    res.json({ tasks });
}));

module.exports = router;