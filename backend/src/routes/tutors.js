const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get all tutors (for browsing)
router.get('/', [
    expressQuery('subject').optional().isString(),
    expressQuery('minRate').optional().isFloat({ min: 0 }),
    expressQuery('maxRate').optional().isFloat({ min: 0 }),
    expressQuery('minRating').optional().isFloat({ min: 0, max: 5 }),
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

    const { subject, minRate, maxRate, minRating, search } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = `
    SELECT u.id, u.first_name, u.last_name, u.profile_image_url, u.bio,
           tp.hourly_rate, tp.experience_years, tp.rating, tp.total_sessions,
           tp.languages, tp.education, tp.is_available
    FROM users u
    JOIN tutor_profiles tp ON u.id = tp.user_id
    WHERE u.role = 'tutor' AND u.is_active = true
  `;

    const params = [];

    if (minRate) {
        queryText += ` AND tp.hourly_rate >= $${params.length + 1}`;
        params.push(minRate);
    }

    if (maxRate) {
        queryText += ` AND tp.hourly_rate <= $${params.length + 1}`;
        params.push(maxRate);
    }

    if (minRating) {
        queryText += ` AND tp.rating >= $${params.length + 1}`;
        params.push(minRating);
    }

    if (search) {
        queryText += ` AND (u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1} OR tp.title ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
    }

    queryText += ` ORDER BY tp.rating DESC, tp.total_sessions DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const tutors = result.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_image_url,
        bio: row.bio,
        hourlyRate: row.hourly_rate,
        experienceYears: row.experience_years,
        rating: row.rating,
        totalSessions: row.total_sessions,
        languages: row.languages,
        education: row.education,
        isAvailable: row.is_available
    }));

    res.json({ tutors });
}));

// Get specific tutor profile
router.get('/:id', asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT u.id, u.first_name, u.last_name, u.profile_image_url, u.bio,
           tp.hourly_rate, tp.experience_years, tp.education,
           tp.languages, tp.rating, tp.total_sessions, tp.is_available
    FROM users u
    JOIN tutor_profiles tp ON u.id = tp.user_id
    WHERE u.id = $1 AND u.role = 'tutor' AND u.is_active = true
  `, [req.params.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    const tutor = result.rows[0];

    // Get tutor's subjects
    const subjectsResult = await query(`
    SELECT s.name, s.category, ts.rate, ts.proficiency_level
    FROM tutor_subjects ts
    JOIN subjects s ON ts.subject_id = s.id
    WHERE ts.tutor_id = $1
  `, [req.params.id]);

    // Get recent reviews (if any)
    const reviewsResult = await query(`
    SELECT s.student_rating, s.student_feedback, u.first_name
    FROM sessions s
    JOIN users u ON s.student_id = u.id
    WHERE s.tutor_id = $1 AND s.student_rating IS NOT NULL
    ORDER BY s.updated_at DESC
    LIMIT 5
  `, [req.params.id]);

    res.json({
        tutor: {
            id: tutor.id,
            name: `${tutor.first_name} ${tutor.last_name}`,
            firstName: tutor.first_name,
            lastName: tutor.last_name,
            avatarUrl: tutor.avatar_url,
            bio: tutor.bio,
            location: tutor.location,
            timezone: tutor.timezone,
            title: tutor.title,
            hourlyRate: tutor.hourly_rate,
            experienceYears: tutor.experience_years,
            education: tutor.education,
            certifications: tutor.certifications,
            languages: tutor.languages,
            specializations: tutor.specializations,
            rating: tutor.rating,
            totalSessions: tutor.total_sessions,
            totalEarnings: tutor.total_earnings,
            subjects: subjectsResult.rows.map(row => ({
                name: row.name,
                category: row.category,
                rate: row.rate,
                proficiency: row.proficiency_level
            })),
            reviews: reviewsResult.rows.map(row => ({
                rating: row.student_rating,
                feedback: row.student_feedback,
                studentName: row.first_name
            }))
        }
    });
}));

// Get tutor's students (only for the tutor themselves or admin)
router.get('/:id/students', authenticateToken, asyncHandler(async (req, res) => {
    // Check if user can access this data
    if (req.user.role !== 'admin' && req.user.id != req.params.id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const result = await query(`
    SELECT DISTINCT u.id, u.first_name, u.last_name, u.avatar_url, u.email,
           COUNT(s.id) as total_sessions,
           COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
           AVG(sr.tutor_rating) as avg_rating,
           MAX(s.scheduled_start) as last_session
    FROM users u
    JOIN tutoring_sessions s ON u.id = s.student_id
    LEFT JOIN session_reviews sr ON s.id = sr.session_id
    WHERE s.tutor_id = $1
    GROUP BY u.id, u.first_name, u.last_name, u.avatar_url, u.email
    ORDER BY last_session DESC
  `, [req.params.id]);

    const students = result.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        avatarUrl: row.avatar_url,
        totalSessions: parseInt(row.total_sessions),
        completedSessions: parseInt(row.completed_sessions),
        avgRating: parseFloat(row.avg_rating) || 0,
        lastSession: row.last_session
    }));

    res.json({ students });
}));

module.exports = router;