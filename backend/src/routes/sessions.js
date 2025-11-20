const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get all sessions for a user (both as student and tutor)
router.get('/', [
    authenticateToken,
    expressQuery('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
    expressQuery('role').optional().isIn(['student', 'tutor']),
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

    const { status, role } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = `
    SELECT s.*, 
           student.first_name as student_first_name, student.last_name as student_last_name, student.profile_picture_url as student_avatar,
           tutor.first_name as tutor_first_name, tutor.last_name as tutor_last_name, tutor.profile_picture_url as tutor_avatar,
           sub.name as subject_name
    FROM tutoring_sessions s
    JOIN users student ON s.student_id = student.id
    JOIN users tutor ON s.tutor_id = tutor.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    WHERE (s.student_id = $1 OR s.tutor_id = $1)
  `;

    const params = [req.user.id];

    if (status) {
        queryText += ` AND s.status = $${params.length + 1}`;
        params.push(status);
    }

    if (role === 'student') {
        queryText += ` AND s.student_id = $1`;
    } else if (role === 'tutor') {
        queryText += ` AND s.tutor_id = $1`;
    }

    queryText += ` ORDER BY s.scheduled_start DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const sessions = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        sessionType: row.session_type,
        durationMinutes: row.duration_minutes,
        hourlyRate: row.hourly_rate,
        paymentAmount: row.payment_amount,
        status: row.status,
        student: {
            id: row.student_id,
            name: `${row.student_first_name} ${row.student_last_name}`,
            avatarUrl: row.student_avatar
        },
        tutor: {
            id: row.tutor_id,
            name: `${row.tutor_first_name} ${row.tutor_last_name}`,
            avatarUrl: row.tutor_avatar
        },
        subject: row.subject_name,
        meetingLink: row.meeting_link,
        meetingRoom: row.meeting_room,
        sessionNotes: row.session_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));

    res.json({ sessions });
}));

// Create a new session (book a session)
router.post('/', [
    authenticateToken,
    body('tutorId').isUUID(),
    body('subjectId').optional().isUUID(),
    body('title').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('sessionType').isIn(['online', 'in_person']),
    body('scheduledStart').isISO8601(),
    body('scheduledEnd').isISO8601(),
    body('hourlyRate').isFloat({ min: 0 }),
    body('meetingLink').optional().isLength({ max: 500 }),
    body('locationAddress').optional().isLength({ max: 255 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId, subjectId, title, description, sessionType, scheduledStart, scheduledEnd, hourlyRate, meetingLink, locationAddress } = req.body;

    // Verify tutor exists and is active
    const tutorCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = $3',
        [tutorId, 'tutor', true]
    );

    if (tutorCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid tutor selected' });
    }

    // Check for scheduling conflicts
    const conflictCheck = await query(`
    SELECT id FROM tutoring_sessions 
    WHERE tutor_id = $1 
    AND status IN ('scheduled', 'in-progress')
    AND (
      (scheduled_start <= $2 AND scheduled_end > $2)
      OR
      (scheduled_start < $3 AND scheduled_end >= $3)
      OR
      (scheduled_start >= $2 AND scheduled_start < $3)
    )
  `, [tutorId, scheduledStart, scheduledEnd]);

    if (conflictCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Tutor is not available at the requested time' });
    }

    const result = await query(`
    INSERT INTO tutoring_sessions (
      student_id, tutor_id, subject_id, title, description, 
      session_type, scheduled_start, scheduled_end, hourly_rate,
      meeting_link, meeting_room
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
        req.user.id,
        tutorId,
        subjectId,
        title,
        description,
        sessionType,
        scheduledStart,
        scheduledEnd,
        hourlyRate,
        sessionType === 'online' ? meetingLink : null,
        sessionType === 'in_person' ? locationAddress : null
    ]);

    const session = result.rows[0];

    res.status(201).json({
        message: 'Session booked successfully',
        session: {
            id: session.id,
            title: session.title,
            description: session.description,
            scheduledStart: session.scheduled_start,
            scheduledEnd: session.scheduled_end,
            sessionType: session.session_type,
            durationMinutes: session.duration_minutes,
            hourlyRate: session.hourly_rate,
            status: session.status,
            studentId: session.student_id,
            tutorId: session.tutor_id,
            subjectId: session.subject_id,
            meetingLink: session.meeting_link,
            meetingRoom: session.meeting_room,
            createdAt: session.created_at
        }
    });
}));

// Get specific session
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT s.*, 
           student.first_name as student_first_name, student.last_name as student_last_name, student.profile_picture_url as student_avatar,
           tutor.first_name as tutor_first_name, tutor.last_name as tutor_last_name, tutor.profile_picture_url as tutor_avatar,
           sub.name as subject_name
    FROM tutoring_sessions s
    JOIN users student ON s.student_id = student.id
    JOIN users tutor ON s.tutor_id = tutor.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    WHERE s.id = $1 AND (s.student_id = $2 OR s.tutor_id = $2)
  `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
    }

    const row = result.rows[0];

    const session = {
        id: row.id,
        title: row.title,
        description: row.description,
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        sessionType: row.session_type,
        durationMinutes: row.duration_minutes,
        hourlyRate: row.hourly_rate,
        paymentAmount: row.payment_amount,
        status: row.status,
        student: {
            id: row.student_id,
            name: `${row.student_first_name} ${row.student_last_name}`,
            avatarUrl: row.student_avatar
        },
        tutor: {
            id: row.tutor_id,
            name: `${row.tutor_first_name} ${row.tutor_last_name}`,
            avatarUrl: row.tutor_avatar
        },
        subject: row.subject_name,
        meetingLink: row.meeting_link,
        meetingRoom: row.meeting_room,
        sessionNotes: row.session_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };

    res.json({ session });
}));

// Update session (status, ratings, feedback)
router.put('/:id', [
    authenticateToken,
    body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
    body('studentRating').optional().isInt({ min: 1, max: 5 }),
    body('tutorRating').optional().isInt({ min: 1, max: 5 }),
    body('studentFeedback').optional().isLength({ max: 1000 }),
    body('tutorFeedback').optional().isLength({ max: 1000 }),
    body('sessionNotes').optional().isLength({ max: 1000 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { status, studentRating, tutorRating, studentFeedback, tutorFeedback, sessionNotes } = req.body;

    // Check if session exists and user has access
    const sessionCheck = await query(
        'SELECT student_id, tutor_id, status FROM tutoring_sessions WHERE id = $1 AND (student_id = $2 OR tutor_id = $2)',
        [req.params.id, req.user.id]
    );

    if (sessionCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessionCheck.rows[0];
    const isStudent = session.student_id === req.user.id;
    const isTutor = session.tutor_id === req.user.id;

    // Build update query based on user role and permissions
    let updateFields = [];
    let params = [];
    let paramCount = 0;

    if (status) {
        // Allow tutors and admins to update to any status
        // Allow students to mark sessions as completed only
        if (isTutor || req.user.role === 'admin') {
            updateFields.push(`status = $${++paramCount}`);
            params.push(status);
        } else if (isStudent && status === 'completed') {
            updateFields.push(`status = $${++paramCount}`);
            params.push(status);
        }
    }

    if (studentRating && isStudent) {
        updateFields.push(`student_rating = $${++paramCount}`);
        params.push(studentRating);
    }

    if (tutorRating && isTutor) {
        updateFields.push(`tutor_rating = $${++paramCount}`);
        params.push(tutorRating);
    }

    if (studentFeedback && isStudent) {
        updateFields.push(`student_feedback = $${++paramCount}`);
        params.push(studentFeedback);
    }

    if (tutorFeedback && isTutor) {
        updateFields.push(`tutor_feedback = $${++paramCount}`);
        params.push(tutorFeedback);
    }

    if (sessionNotes && isTutor) {
        updateFields.push(`session_notes = $${++paramCount}`);
        params.push(sessionNotes);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    params.push(req.params.id);

    const result = await query(`
    UPDATE tutoring_sessions 
    SET ${updateFields.join(', ')}
    WHERE id = $${++paramCount}
    RETURNING *
  `, params);

    const updatedSession = result.rows[0];

    // If session is marked as completed, create payment record
    if (status === 'completed' && updatedSession.status === 'completed') {
        // Check if payment already exists
        const existingPayment = await query(`
            SELECT id FROM payments WHERE session_id = $1
        `, [updatedSession.id]);

        if (existingPayment.rows.length === 0) {
            // Create payment record
            await query(`
                INSERT INTO payments (session_id, payer_id, recipient_id, amount, payment_method, status, currency, description)
                VALUES ($1, $2, $3, $4, 'platform', 'completed', 'USD', $5)
            `, [
                updatedSession.id,
                updatedSession.student_id,
                updatedSession.tutor_id,
                updatedSession.hourly_rate,
                `Payment for ${updatedSession.title || 'tutoring session'}`
            ]);

            logger.info(`Payment created for completed session ${updatedSession.id}`);
        }
    }

    res.json({
        message: 'Session updated successfully',
        session: {
            id: updatedSession.id,
            status: updatedSession.status,
            updatedAt: updatedSession.updated_at
        }
    });
}));

// Cancel session
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(`
    UPDATE tutoring_sessions 
    SET status = 'cancelled'
    WHERE id = $1 AND (student_id = $2 OR tutor_id = $2) AND status = 'scheduled'
    RETURNING id
  `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found or cannot be cancelled' });
    }

    res.json({ message: 'Session cancelled successfully' });
}));

module.exports = router;