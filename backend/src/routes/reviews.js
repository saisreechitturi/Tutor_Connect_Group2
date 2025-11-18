const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get reviews for a session
router.get('/session/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const result = await query(`
        SELECT sr.id, sr.rating, sr.comment, sr.reviewer_type, sr.would_recommend, sr.created_at,
               sr.reviewer_id, sr.reviewee_id,
               reviewer.first_name as reviewer_first_name,
               reviewer.last_name as reviewer_last_name,
               reviewer.profile_picture_url as reviewer_avatar,
               reviewee.first_name as reviewee_first_name,
               reviewee.last_name as reviewee_last_name
        FROM session_reviews sr
        JOIN users reviewer ON sr.reviewer_id = reviewer.id
        JOIN users reviewee ON sr.reviewee_id = reviewee.id
        WHERE sr.session_id = $1
        ORDER BY sr.created_at DESC
    `, [sessionId]);

    const reviews = result.rows.map(row => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        reviewerType: row.reviewer_type,
        reviewerId: row.reviewer_id,
        revieweeId: row.reviewee_id,
        wouldRecommend: row.would_recommend,
        createdAt: row.created_at,
        reviewer: {
            firstName: row.reviewer_first_name,
            lastName: row.reviewer_last_name,
            avatar: row.reviewer_avatar
        },
        reviewee: {
            firstName: row.reviewee_first_name,
            lastName: row.reviewee_last_name
        }
    }));

    res.json({ reviews });
}));

// Get reviews by tutor (public reviews only)
router.get('/tutor/:tutorId', [
    expressQuery('limit').optional().isInt({ min: 1, max: 50 }),
    expressQuery('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const result = await query(`
        SELECT sr.id, sr.rating, sr.comment, sr.would_recommend, sr.created_at,
               student.first_name as student_first_name,
               student.last_name as student_last_name,
               student.profile_picture_url as student_avatar,
               s.scheduled_start, sub.name as subject_name
        FROM session_reviews sr
        JOIN users student ON sr.reviewer_id = student.id
        JOIN tutoring_sessions s ON sr.session_id = s.id
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE sr.reviewee_id = $1 AND sr.reviewer_type = 'student'
        ORDER BY sr.created_at DESC
        LIMIT $2 OFFSET $3
    `, [tutorId, limit, offset]);

    // Get total count
    const countResult = await query(`
        SELECT COUNT(*) as count
        FROM session_reviews sr
        WHERE sr.reviewee_id = $1 AND sr.reviewer_type = 'student'
    `, [tutorId]);

    const reviews = result.rows.map(row => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        wouldRecommend: row.would_recommend,
        createdAt: row.created_at,
        sessionDate: row.scheduled_start,
        subjectName: row.subject_name,
        student: {
            firstName: row.student_first_name,
            lastName: row.student_last_name,
            avatar: row.student_avatar
        }
    }));

    const total = parseInt(countResult.rows[0].count);

    res.json({
        reviews,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
    });
}));

// Get reviews by student (their own reviews)
router.get('/student/:studentId', [
    authenticateToken,
    expressQuery('limit').optional().isInt({ min: 1, max: 50 }),
    expressQuery('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { studentId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Check authorization - students can only see their own reviews
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const result = await query(`
        SELECT sr.id, sr.rating, sr.comment, sr.would_recommend, sr.created_at,
               tutor.first_name as tutor_first_name,
               tutor.last_name as tutor_last_name,
               tutor.profile_picture_url as tutor_avatar,
               s.scheduled_start, sub.name as subject_name
        FROM session_reviews sr
        JOIN users tutor ON sr.reviewee_id = tutor.id
        JOIN tutoring_sessions s ON sr.session_id = s.id
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE sr.reviewer_id = $1
        ORDER BY sr.created_at DESC
        LIMIT $2 OFFSET $3
    `, [studentId, limit, offset]);

    // Get total count
    const countResult = await query(`
        SELECT COUNT(*) as count
        FROM session_reviews sr
        WHERE sr.reviewer_id = $1
    `, [studentId]);

    const reviews = result.rows.map(row => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        wouldRecommend: row.would_recommend,
        createdAt: row.created_at,
        sessionDate: row.scheduled_start,
        subjectName: row.subject_name,
        tutor: {
            firstName: row.tutor_first_name,
            lastName: row.tutor_last_name,
            avatar: row.tutor_avatar
        }
    }));

    const total = parseInt(countResult.rows[0].count);

    res.json({
        reviews,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
    });
}));

// Create review for a session
router.post('/', [
    authenticateToken,
    body('sessionId').isUUID().withMessage('Valid session ID is required'),
    body('revieweeId').isUUID().withMessage('Valid reviewee ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comment must be max 1000 characters'),
    body('wouldRecommend').optional().isBoolean().withMessage('wouldRecommend must be a boolean')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { sessionId, revieweeId, rating, comment, wouldRecommend } = req.body;
    const reviewerId = req.user.id;

    // Check if session exists and user was part of it
    const sessionCheck = await query(`
        SELECT id, student_id, tutor_id, status, scheduled_end
        FROM tutoring_sessions
        WHERE id = $1 AND (student_id = $2 OR tutor_id = $2)
    `, [sessionId, reviewerId]);

    if (sessionCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found or you were not part of this session' });
    }

    const session = sessionCheck.rows[0];

    // Check if session is completed or finished (based on time)
    const now = new Date();
    const sessionEnd = new Date(session.scheduled_end);
    const isSessionFinished = session.status === 'completed' || session.status === 'cancelled' || now > sessionEnd;

    if (!isSessionFinished) {
        return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    // Don't allow reviews for cancelled sessions
    if (session.status === 'cancelled') {
        return res.status(400).json({ message: 'Cannot review cancelled sessions' });
    }

    // Verify reviewee is the other participant
    const expectedRevieweeId = session.student_id === reviewerId ? session.tutor_id : session.student_id;
    if (revieweeId !== expectedRevieweeId) {
        return res.status(400).json({ message: 'Invalid reviewee for this session' });
    }

    // Check if review already exists
    const existingReview = await query(`
        SELECT id FROM session_reviews
        WHERE session_id = $1 AND reviewer_id = $2
    `, [sessionId, reviewerId]);

    if (existingReview.rows.length > 0) {
        return res.status(409).json({ message: 'Review already exists for this session' });
    }

    // Determine reviewer type
    const reviewerType = session.student_id === reviewerId ? 'student' : 'tutor';

    // Create the review
    const result = await query(`
        INSERT INTO session_reviews (session_id, reviewer_id, reviewer_type, rating, comment, would_recommend, reviewee_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, rating, comment, would_recommend, created_at
    `, [sessionId, reviewerId, reviewerType, rating, comment || null, wouldRecommend, revieweeId]);

    const review = result.rows[0];

    // Update tutor's average rating if reviewing a tutor
    if (session.tutor_id === revieweeId) {
        await query(`
            UPDATE tutor_profiles
            SET rating = (
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM session_reviews
                WHERE reviewee_id = $1 AND reviewer_type = 'student'
            )
            WHERE user_id = $1
        `, [revieweeId]);
    }

    logger.info(`Review created for session ${sessionId} by user ${reviewerId}`);

    res.status(201).json({
        message: 'Review created successfully',
        review: {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            wouldRecommend: review.would_recommend,
            createdAt: review.created_at
        }
    });
}));

// Update review
router.put('/:id', [
    authenticateToken,
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comment must be max 1000 characters'),
    body('wouldRecommend').optional().isBoolean().withMessage('wouldRecommend must be a boolean')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { rating, comment, wouldRecommend } = req.body;

    // Check if review exists and user owns it
    const reviewCheck = await query(`
        SELECT id, reviewer_id, session_id
        FROM session_reviews
        WHERE id = $1
    `, [id]);

    if (reviewCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Review not found' });
    }

    const review = reviewCheck.rows[0];

    // Check authorization
    if (req.user.id !== review.reviewer_id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (rating !== undefined) {
        updates.push(`rating = $${params.length + 1}`);
        params.push(rating);
    }
    if (comment !== undefined) {
        updates.push(`comment = $${params.length + 1}`);
        params.push(comment);
    }
    if (wouldRecommend !== undefined) {
        updates.push(`would_recommend = $${params.length + 1}`);
        params.push(wouldRecommend);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    params.push(id); // Add ID for WHERE clause

    // Add updated_at to the update
    updates.push('updated_at = CURRENT_TIMESTAMP');

    const result = await query(`
        UPDATE session_reviews
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
        RETURNING id, rating, comment, would_recommend, created_at, updated_at
    `, params);

    const updatedReview = result.rows[0];

    // Update tutor's average rating if rating changed
    if (rating !== undefined) {
        // Get the reviewee from the review to check if it's a tutor
        const revieweeResult = await query(`
            SELECT sr.reviewee_id, u.role FROM session_reviews sr
            JOIN users u ON sr.reviewee_id = u.id
            WHERE sr.id = $1
        `, [id]);

        if (revieweeResult.rows.length > 0 && revieweeResult.rows[0].role === 'tutor') {
            const tutorId = revieweeResult.rows[0].reviewee_id;
            await query(`
                UPDATE tutor_profiles
                SET rating = (
                    SELECT ROUND(AVG(rating)::numeric, 2)
                    FROM session_reviews
                    WHERE reviewee_id = $1 AND reviewer_type = 'student'
                )
                WHERE user_id = $1
            `, [tutorId]);
        }
    }

    logger.info(`Review ${id} updated by user ${req.user.id}`);

    res.json({
        message: 'Review updated successfully',
        review: {
            id: updatedReview.id,
            rating: updatedReview.rating,
            comment: updatedReview.comment,
            wouldRecommend: updatedReview.would_recommend,
            createdAt: updatedReview.created_at,
            updatedAt: updatedReview.updated_at
        }
    });
}));

// Delete review
router.delete('/:id', [
    authenticateToken
], asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if review exists and user owns it
    const reviewCheck = await query(`
        SELECT sr.id, sr.reviewer_id, sr.session_id, sr.reviewee_id
        FROM session_reviews sr
        WHERE sr.id = $1
    `, [id]);

    if (reviewCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Review not found' });
    }

    const review = reviewCheck.rows[0];

    // Check authorization
    if (req.user.id !== review.reviewer_id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Delete the review
    await query('DELETE FROM session_reviews WHERE id = $1', [id]);

    // Update tutor's average rating
    const revieweeResult = await query(`
        SELECT u.role FROM users u WHERE u.id = (
            SELECT reviewee_id FROM session_reviews WHERE id = $1
        )
    `, [id]);

    if (revieweeResult.rows.length > 0 && revieweeResult.rows[0].role === 'tutor') {
        const tutorId = review.reviewee_id;
        await query(`
            UPDATE tutor_profiles
            SET rating = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM session_reviews
                WHERE reviewee_id = $1 AND reviewer_type = 'student'
            ), 0)
            WHERE user_id = $1
        `, [tutorId]);
    }

    logger.info(`Review ${id} deleted by user ${req.user.id}`);

    res.json({ message: 'Review deleted successfully' });
}));

module.exports = router;