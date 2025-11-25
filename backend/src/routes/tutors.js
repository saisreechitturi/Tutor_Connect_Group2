const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

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
    SELECT u.id, u.first_name, u.last_name, u.profile_picture_url, u.bio,
           tp.hourly_rate, tp.years_of_experience, tp.rating, tp.total_sessions,
           tp.languages_spoken, tp.education_background, tp.is_verified,
           COALESCE(
               JSON_AGG(
                   DISTINCT JSONB_BUILD_OBJECT(
                       'id', s.id,
                       'name', s.name,
                       'proficiency', ts.proficiency_level
                   )
               ) FILTER (WHERE s.id IS NOT NULL), 
               '[]'::json
           ) as subjects
    FROM users u
    JOIN tutor_profiles tp ON u.id = tp.user_id
    LEFT JOIN tutor_subjects ts ON tp.user_id = ts.tutor_id
    LEFT JOIN subjects s ON ts.subject_id = s.id
    WHERE u.role = 'tutor' AND u.is_active = true AND tp.is_verified = true
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
        queryText += ` AND (u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1} OR tp.education_background ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
    }

    if (subject) {
        queryText += ` AND EXISTS (
            SELECT 1 FROM tutor_subjects ts2 
            JOIN subjects s2 ON ts2.subject_id = s2.id 
            WHERE ts2.tutor_id = tp.user_id AND s2.name ILIKE $${params.length + 1}
        )`;
        params.push(`%${subject}%`);
    }

    queryText += ` GROUP BY u.id, u.first_name, u.last_name, u.profile_picture_url, u.bio, tp.hourly_rate, tp.years_of_experience, tp.rating, tp.total_sessions, tp.languages_spoken, tp.education_background, tp.is_verified`;
    queryText += ` ORDER BY tp.rating DESC, tp.total_sessions DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const tutors = result.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_picture_url,
        bio: row.bio,
        hourlyRate: row.hourly_rate,
        experienceYears: row.years_of_experience,
        rating: row.rating,
        totalSessions: row.total_sessions,
        languages: row.languages_spoken,
        education: row.education_background,
        isVerified: row.is_verified,
        isAvailable: true, // All returned tutors are verified and available
        subjects: row.subjects || []
    }));

    res.json({ tutors });
}));

// Get tutor details with subjects and availability
router.get('/:tutorId/details', asyncHandler(async (req, res) => {
    const { tutorId } = req.params;

    // Get tutor basic info
    const tutorResult = await query(`
        SELECT u.id, u.first_name, u.last_name, u.profile_picture_url, u.bio,
               tp.hourly_rate, tp.years_of_experience, tp.rating, tp.total_sessions,
               tp.languages_spoken, tp.education_background, tp.is_verified
        FROM users u
        JOIN tutor_profiles tp ON u.id = tp.user_id
        WHERE u.id = $1 AND u.role = 'tutor' AND u.is_active = true AND tp.is_verified = true
    `, [tutorId]);

    if (tutorResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    const tutor = tutorResult.rows[0];

    // Get tutor subjects
    const subjectsResult = await query(`
        SELECT s.id, s.name, ts.proficiency_level
        FROM tutor_subjects ts
        JOIN subjects s ON ts.subject_id = s.id
        WHERE ts.tutor_id = $1 AND s.is_active = true
        ORDER BY s.name
    `, [tutorId]);

    // Get availability slots
    const availabilityResult = await query(`
        SELECT *
        FROM tutor_availability_slots
        WHERE tutor_id = $1 AND is_available = true
        ORDER BY day_of_week, start_time
    `, [tutorId]);

    res.json({
        tutor: {
            id: tutor.id,
            name: `${tutor.first_name} ${tutor.last_name}`,
            firstName: tutor.first_name,
            lastName: tutor.last_name,
            profileImageUrl: tutor.profile_picture_url,
            bio: tutor.bio,
            hourlyRate: tutor.hourly_rate,
            experienceYears: tutor.years_of_experience,
            rating: tutor.rating,
            totalSessions: tutor.total_sessions,
            languages: tutor.languages_spoken,
            education: tutor.education_background,
            isVerified: tutor.is_verified,
            isAvailable: true
        },
        subjects: subjectsResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            proficiency: row.proficiency_level
        })),
        availability: availabilityResult.rows
    });
}));

// Get specific tutor profile
router.get('/:id', asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT u.id, u.first_name, u.last_name, u.profile_picture_url, u.bio,
           tp.hourly_rate, tp.years_of_experience, tp.education_background,
           tp.languages_spoken, tp.rating, tp.total_sessions, tp.is_verified
    FROM users u
    JOIN tutor_profiles tp ON u.id = tp.user_id
    WHERE u.id = $1 AND u.role = 'tutor' AND u.is_active = true AND tp.is_verified = true
  `, [req.params.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    const tutor = result.rows[0];

    // Get tutor's subjects
    const subjectsResult = await query(`
    SELECT s.name, s.category, ts.proficiency_level, ts.years_of_experience
    FROM tutor_subjects ts
    JOIN subjects s ON ts.subject_id = s.id
    WHERE ts.tutor_id = $1
  `, [req.params.id]);

    // Get recent reviews (if any)
    const reviewsResult = await query(`
    SELECT sr.rating, sr.comment, u.first_name
    FROM session_reviews sr
    JOIN users u ON sr.reviewer_id = u.id
    WHERE sr.reviewee_id = $1 AND sr.reviewer_type = 'student'
    ORDER BY sr.created_at DESC
    LIMIT 5
  `, [req.params.id]);

    res.json({
        tutor: {
            id: tutor.id,
            name: `${tutor.first_name} ${tutor.last_name}`,
            firstName: tutor.first_name,
            lastName: tutor.last_name,
            avatarUrl: tutor.profile_picture_url,
            bio: tutor.bio,
            hourlyRate: tutor.hourly_rate,
            experienceYears: tutor.years_of_experience,
            education: tutor.education_background,
            languages: tutor.languages_spoken,
            rating: tutor.rating,
            totalSessions: tutor.total_sessions,
            isVerified: tutor.is_verified,
            subjects: subjectsResult.rows.map(row => ({
                name: row.name,
                category: row.category,
                proficiency: row.proficiency_level,
                yearsExperience: row.years_of_experience
            })),
            reviews: reviewsResult.rows.map(row => ({
                rating: row.rating,
                feedback: row.comment,
                studentName: row.first_name
            }))
        }
    });
}));

// COMMENTED OUT: Get tutor's students endpoint - removed from frontend
/*
router.get('/:id/students', authenticateToken, asyncHandler(async (req, res) => {
    // Check if user can access this data
    if (req.user.role !== 'admin' && req.user.id != req.params.id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const result = await query(`
    SELECT DISTINCT u.id, u.first_name, u.last_name, u.profile_picture_url, u.email,
           COUNT(s.id) as total_sessions,
           COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
           AVG(sr.rating) as avg_rating,
           MAX(s.scheduled_start) as last_session
    FROM users u
    JOIN tutoring_sessions s ON u.id = s.student_id
    LEFT JOIN session_reviews sr ON s.id = sr.session_id
    WHERE s.tutor_id = $1
    GROUP BY u.id, u.first_name, u.last_name, u.profile_picture_url, u.email
    ORDER BY last_session DESC
  `, [req.params.id]);

    const students = result.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        avatarUrl: row.profile_picture_url,
        totalSessions: parseInt(row.total_sessions),
        completedSessions: parseInt(row.completed_sessions),
        avgRating: parseFloat(row.avg_rating) || 0,
        lastSession: row.last_session
    }));

    res.json({ students });
}));
*/

// Get tutor's subjects
router.get('/:id/subjects', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(`
        SELECT s.id, s.name, s.description, s.category,
               ts.proficiency_level, ts.created_at as assigned_at
        FROM tutor_subjects ts
        JOIN subjects s ON ts.subject_id = s.id
        WHERE ts.tutor_id = $1 AND s.is_active = true
        ORDER BY s.name ASC
    `, [id]);

    const subjects = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        proficiencyLevel: row.proficiency_level,
        assignedAt: row.assigned_at
    }));

    res.json({ subjects });
}));

// Add subject to tutor (tutor themselves or admin)
router.post('/:id/subjects', [
    authenticateToken,
    body('subjectId').isUUID().withMessage('Valid subject ID is required'),
    body('proficiencyLevel').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Proficiency level must be beginner, intermediate, advanced, or expert')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { subjectId, proficiencyLevel = 'intermediate' } = req.body;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Check if tutor exists
    const tutorCheck = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [id, 'tutor']);
    if (tutorCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if subject exists
    const subjectCheck = await query('SELECT id, name FROM subjects WHERE id = $1 AND is_active = true', [subjectId]);
    if (subjectCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Subject not found or inactive' });
    }

    // Check if relationship already exists
    const existingRelation = await query('SELECT id FROM tutor_subjects WHERE tutor_id = $1 AND subject_id = $2', [id, subjectId]);
    if (existingRelation.rows.length > 0) {
        return res.status(409).json({ message: 'Tutor is already assigned to this subject' });
    }

    // Create the relationship
    await query(`
        INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level)
        VALUES ($1, $2, $3)
    `, [id, subjectId, proficiencyLevel]);

    const subjectName = subjectCheck.rows[0].name;
    logger.info(`Subject ${subjectName} assigned to tutor ${id} with proficiency ${proficiencyLevel}`);

    res.status(201).json({
        message: 'Subject assigned successfully',
        subject: {
            id: subjectId,
            name: subjectName,
            proficiencyLevel
        }
    });
}));

// Update tutor's subject proficiency
router.put('/:id/subjects/:subjectId', [
    authenticateToken,
    body('proficiencyLevel').isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Proficiency level must be beginner, intermediate, advanced, or expert')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id, subjectId } = req.params;
    const { proficiencyLevel } = req.body;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Check if relationship exists
    const relationCheck = await query(`
        SELECT ts.id, s.name
        FROM tutor_subjects ts
        JOIN subjects s ON ts.subject_id = s.id
        WHERE ts.tutor_id = $1 AND ts.subject_id = $2
    `, [id, subjectId]);

    if (relationCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor-subject relationship not found' });
    }

    // Update proficiency level
    await query(`
        UPDATE tutor_subjects
        SET proficiency_level = $1
        WHERE tutor_id = $2 AND subject_id = $3
    `, [proficiencyLevel, id, subjectId]);

    const subjectName = relationCheck.rows[0].name;
    logger.info(`Updated proficiency for tutor ${id} in subject ${subjectName} to ${proficiencyLevel}`);

    res.json({
        message: 'Proficiency level updated successfully',
        subject: {
            id: subjectId,
            name: subjectName,
            proficiencyLevel
        }
    });
}));

// Remove subject from tutor
router.delete('/:id/subjects/:subjectId', [
    authenticateToken
], asyncHandler(async (req, res) => {
    const { id, subjectId } = req.params;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Check if relationship exists
    const relationCheck = await query(`
        SELECT ts.id, s.name
        FROM tutor_subjects ts
        JOIN subjects s ON ts.subject_id = s.id
        WHERE ts.tutor_id = $1 AND ts.subject_id = $2
    `, [id, subjectId]);

    if (relationCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor-subject relationship not found' });
    }

    // Check if tutor has any active/upcoming sessions for this subject
    const activeSessionsCheck = await query(`
        SELECT COUNT(*) as count
        FROM tutoring_sessions
        WHERE tutor_id = $1 AND subject_id = $2
        AND status IN ('scheduled', 'in_progress')
    `, [id, subjectId]);

    if (parseInt(activeSessionsCheck.rows[0].count) > 0) {
        return res.status(409).json({
            message: 'Cannot remove subject with active or upcoming sessions'
        });
    }

    // Remove the relationship
    await query('DELETE FROM tutor_subjects WHERE tutor_id = $1 AND subject_id = $2', [id, subjectId]);

    const subjectName = relationCheck.rows[0].name;
    logger.info(`Removed subject ${subjectName} from tutor ${id}`);

    res.json({ message: 'Subject removed successfully' });
}));

// Set current tutor's subjects (simplified route)
router.post('/subjects', [
    authenticateToken,
    body('subjects').isArray().withMessage('Subjects must be an array'),
    body('subjects.*').isUUID().withMessage('Each subject must be a valid UUID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const tutorId = req.user.id;
    const { subjects } = req.body;

    // Check if user is a tutor
    const userResult = await query('SELECT role FROM users WHERE id = $1', [tutorId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'tutor') {
        return res.status(403).json({ message: 'Access denied. Only tutors can set subjects.' });
    }

    // Verify all subjects exist
    if (subjects.length > 0) {
        const subjectCheck = await query(
            'SELECT id FROM subjects WHERE id = ANY($1::uuid[])',
            [subjects]
        );

        if (subjectCheck.rows.length !== subjects.length) {
            return res.status(400).json({ message: 'One or more subjects do not exist' });
        }
    }

    // Remove existing subjects
    await query('DELETE FROM tutor_subjects WHERE tutor_id = $1', [tutorId]);

    // Add new subjects
    if (subjects.length > 0) {
        const values = subjects.map((subjectId, index) =>
            `($1, $${index + 2}, 'intermediate')`
        ).join(',');

        await query(
            `INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level) VALUES ${values}`,
            [tutorId, ...subjects]
        );
    }

    logger.info(`Updated subjects for tutor ${tutorId}: ${subjects.length} subjects`);
    res.json({ message: 'Subjects updated successfully' });
}));

// Get comprehensive tutor dashboard data
router.get('/dashboard/:tutorId', authenticateToken, asyncHandler(async (req, res) => {
    const { tutorId } = req.params;

    // Check authorization - only the tutor themselves or admin can access
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Verify tutor exists
    const tutorCheck = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [tutorId, 'tutor']);
    if (tutorCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    try {
        // Get active students count (students with recent sessions)
        const activeStudentsResult = await query(`
            SELECT COUNT(DISTINCT student_id) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1 
            AND scheduled_start >= NOW() - INTERVAL '30 days'
        `, [tutorId]);

        // Get upcoming sessions this week
        const upcomingSessionsResult = await query(`
            SELECT COUNT(*) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1 
            AND status = 'scheduled'
            AND scheduled_start >= NOW()
            AND scheduled_start <= NOW() + INTERVAL '7 days'
        `, [tutorId]);

        // Get current month earnings
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const monthlyEarningsResult = await query(`
            SELECT COALESCE(SUM(p.amount), 0) as total
            FROM payments p
            JOIN tutoring_sessions ts ON p.session_id = ts.id
            WHERE p.recipient_id = $1 
            AND p.status = 'completed'
            AND EXTRACT(MONTH FROM p.created_at) = $2
            AND EXTRACT(YEAR FROM p.created_at) = $3
        `, [tutorId, currentMonth, currentYear]);

        // Get recent sessions for activity feed
        const recentSessionsResult = await query(`
            SELECT ts.id, ts.title, ts.scheduled_start, ts.status, p.amount as payment_amount,
                   u.first_name as student_first_name, u.last_name as student_last_name,
                   s.name as subject_name
            FROM tutoring_sessions ts
            JOIN users u ON ts.student_id = u.id
            JOIN subjects s ON ts.subject_id = s.id
            LEFT JOIN payments p ON ts.id = p.session_id AND p.recipient_id = ts.tutor_id AND p.status = 'completed'
            WHERE ts.tutor_id = $1
            ORDER BY ts.scheduled_start DESC
            LIMIT 10
        `, [tutorId]);

        // Get performance metrics for current month
        const performanceResult = await query(`
            SELECT total_sessions, completed_sessions, cancelled_sessions,
                   total_earnings, total_hours, average_rating, total_reviews
            FROM tutor_performance_metrics
            WHERE tutor_id = $1 AND year = $2 AND month = $3
        `, [tutorId, currentYear, currentMonth]);

        // Get overall tutor profile stats
        const profileStatsResult = await query(`
            SELECT tp.rating, tp.total_sessions, tp.total_students,
                   tp.hourly_rate, tp.total_earnings, tp.monthly_earnings
            FROM tutor_profiles tp
            WHERE tp.user_id = $1
        `, [tutorId]);

        // Get real-time total earnings from payments table (most accurate)
        const totalEarningsResult = await query(`
            SELECT COALESCE(SUM(p.amount), 0) as total_earnings
            FROM payments p
            WHERE p.recipient_id = $1 AND p.status = 'completed'
        `, [tutorId]);

        // Get next upcoming session
        const nextSessionResult = await query(`
            SELECT ts.id, ts.title, ts.scheduled_start, ts.scheduled_end,
                   u.first_name as student_first_name, u.last_name as student_last_name,
                   s.name as subject_name
            FROM tutoring_sessions ts
            JOIN users u ON ts.student_id = u.id
            JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.tutor_id = $1 AND ts.status = 'scheduled'
            AND ts.scheduled_start > NOW()
            ORDER BY ts.scheduled_start ASC
            LIMIT 1
        `, [tutorId]);

        // Get recent student reviews
        const recentReviewsResult = await query(`
            SELECT sr.rating, sr.comment, sr.created_at,
                   u.first_name as student_first_name, u.last_name as student_last_name,
                   s.name as subject_name
            FROM session_reviews sr
            JOIN tutoring_sessions ts ON sr.session_id = ts.id
            JOIN users u ON sr.reviewer_id = u.id
            JOIN subjects s ON ts.subject_id = s.id
            WHERE sr.reviewee_id = $1 AND sr.reviewer_type = 'student'
            ORDER BY sr.created_at DESC
            LIMIT 5
        `, [tutorId]);

        // Prepare dashboard data
        const activeStudents = parseInt(activeStudentsResult.rows[0]?.count) || 0;
        const upcomingSessions = parseInt(upcomingSessionsResult.rows[0]?.count) || 0;
        const monthlyEarnings = parseFloat(monthlyEarningsResult.rows[0]?.total) || 0;

        const performance = performanceResult.rows[0] || {
            total_sessions: 0,
            completed_sessions: 0,
            cancelled_sessions: 0,
            total_earnings: 0,
            total_hours: 0,
            average_rating: 0,
            total_reviews: 0
        };

        const profileStats = profileStatsResult.rows[0] || {
            rating: 0,
            total_sessions: 0,
            total_students: 0,
            hourly_rate: 0,
            total_earnings: 0,
            monthly_earnings: 0
        };

        // Get real-time total earnings (most accurate)
        const realTimeTotalEarnings = parseFloat(totalEarningsResult.rows[0]?.total_earnings) || 0;

        const recentActivity = recentSessionsResult.rows.map(row => ({
            id: row.id,
            type: 'session',
            title: row.title,
            student: `${row.student_first_name} ${row.student_last_name}`,
            subject: row.subject_name,
            date: row.scheduled_start,
            status: row.status,
            amount: row.payment_amount
        }));

        const nextSession = nextSessionResult.rows[0] ? {
            id: nextSessionResult.rows[0].id,
            title: nextSessionResult.rows[0].title,
            student: `${nextSessionResult.rows[0].student_first_name} ${nextSessionResult.rows[0].student_last_name}`,
            subject: nextSessionResult.rows[0].subject_name,
            scheduledStart: nextSessionResult.rows[0].scheduled_start,
            scheduledEnd: nextSessionResult.rows[0].scheduled_end
        } : null;

        const recentReviews = recentReviewsResult.rows.map(row => ({
            rating: row.rating,
            comment: row.comment,
            student: `${row.student_first_name} ${row.student_last_name}`,
            subject: row.subject_name,
            date: row.created_at
        }));

        const dashboardData = {
            stats: {
                activeStudents,
                upcomingSessions,
                monthlyEarnings: monthlyEarnings.toFixed(2),
                totalEarnings: realTimeTotalEarnings.toFixed(2),
                overallRating: parseFloat(profileStats.rating) || 0,
                totalSessions: parseInt(profileStats.total_sessions) || 0,
                hourlyRate: parseFloat(profileStats.hourly_rate) || 0
            },
            performance: {
                thisMonth: {
                    totalSessions: parseInt(performance.total_sessions) || 0,
                    completedSessions: parseInt(performance.completed_sessions) || 0,
                    cancelledSessions: parseInt(performance.cancelled_sessions) || 0,
                    totalEarnings: parseFloat(performance.total_earnings) || 0,
                    totalHours: parseFloat(performance.total_hours) || 0,
                    averageRating: parseFloat(performance.average_rating) || 0,
                    totalReviews: parseInt(performance.total_reviews) || 0
                }
            },
            recentActivity,
            nextSession,
            recentReviews
        };

        res.json({ dashboard: dashboardData });

    } catch (error) {
        logger.error('Error fetching tutor dashboard data:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
}));

// Get tutor analytics data
router.get('/analytics/:tutorId', authenticateToken, asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    const { period = 'month' } = req.query;

    // Check authorization - only the tutor themselves or admin can access
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Verify tutor exists
    const tutorCheck = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [tutorId, 'tutor']);
    if (tutorCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Get total earnings from payments table
        const totalEarningsResult = await query(`
            SELECT COALESCE(SUM(p.amount), 0) as total_earnings
            FROM payments p
            WHERE p.recipient_id = $1 AND p.status = 'completed'
        `, [tutorId]);

        // Get current month earnings
        const monthlyEarningsResult = await query(`
            SELECT COALESCE(SUM(p.amount), 0) as monthly_earnings
            FROM payments p
            WHERE p.recipient_id = $1 
            AND p.status = 'completed'
            AND EXTRACT(MONTH FROM p.created_at) = $2
            AND EXTRACT(YEAR FROM p.created_at) = $3
        `, [tutorId, currentMonth, currentYear]);

        // Get total hours tutored
        const totalHoursResult = await query(`
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (
                CASE 
                    WHEN ts.actual_end IS NOT NULL AND ts.actual_start IS NOT NULL 
                    THEN ts.actual_end - ts.actual_start
                    ELSE ts.scheduled_end - ts.scheduled_start
                END
            ))/3600), 0) as total_hours
            FROM tutoring_sessions ts
            WHERE ts.tutor_id = $1 AND ts.status = 'completed'
        `, [tutorId]);

        // Get current month hours
        const monthlyHoursResult = await query(`
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (
                CASE 
                    WHEN ts.actual_end IS NOT NULL AND ts.actual_start IS NOT NULL 
                    THEN ts.actual_end - ts.actual_start
                    ELSE ts.scheduled_end - ts.scheduled_start
                END
            ))/3600), 0) as monthly_hours
            FROM tutoring_sessions ts
            WHERE ts.tutor_id = $1 
            AND ts.status = 'completed'
            AND EXTRACT(MONTH FROM ts.scheduled_start) = $2
            AND EXTRACT(YEAR FROM ts.scheduled_start) = $3
        `, [tutorId, currentMonth, currentYear]);

        // Get active students count
        const activeStudentsResult = await query(`
            SELECT COUNT(DISTINCT student_id) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1 
            AND scheduled_start >= NOW() - INTERVAL '30 days'
        `, [tutorId]);

        // Get average rating
        const averageRatingResult = await query(`
            SELECT COALESCE(ROUND(AVG(sr.rating)::numeric, 1), 0) as avg_rating
            FROM session_reviews sr
            JOIN tutoring_sessions ts ON sr.session_id = ts.id
            WHERE ts.tutor_id = $1
        `, [tutorId]);

        // Get sessions completed
        const sessionsCompletedResult = await query(`
            SELECT COUNT(*) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1 AND status = 'completed'
        `, [tutorId]);

        // Get current month sessions completed
        const monthlySessionsResult = await query(`
            SELECT COUNT(*) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1 
            AND status = 'completed'
            AND EXTRACT(MONTH FROM scheduled_start) = $2
            AND EXTRACT(YEAR FROM scheduled_start) = $3
        `, [tutorId, currentMonth, currentYear]);

        // Get upcoming sessions
        const upcomingSessionsResult = await query(`
            SELECT COUNT(*) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1 
            AND status = 'scheduled'
            AND scheduled_start >= NOW()
            AND scheduled_start <= NOW() + INTERVAL '7 days'
        `, [tutorId]);

        // Get earnings breakdown by month (last 6 months)
        const earningsBreakdownResult = await query(`
            SELECT 
                TO_CHAR(p.created_at, 'Mon') as month,
                EXTRACT(MONTH FROM p.created_at) as month_num,
                COALESCE(SUM(p.amount), 0) as amount
            FROM payments p
            WHERE p.recipient_id = $1 
            AND p.status = 'completed'
            AND p.created_at >= NOW() - INTERVAL '6 months'
            GROUP BY EXTRACT(MONTH FROM p.created_at), TO_CHAR(p.created_at, 'Mon')
            ORDER BY month_num
        `, [tutorId]);

        // Get recent sessions
        const recentSessionsResult = await query(`
            SELECT ts.id, ts.title, ts.scheduled_start, ts.status,
                   u.first_name as student_first_name, u.last_name as student_last_name,
                   s.name as subject_name, p.amount
            FROM tutoring_sessions ts
            JOIN users u ON ts.student_id = u.id
            JOIN subjects s ON ts.subject_id = s.id
            LEFT JOIN payments p ON ts.id = p.session_id AND p.recipient_id = ts.tutor_id
            WHERE ts.tutor_id = $1
            ORDER BY ts.scheduled_start DESC
            LIMIT 5
        `, [tutorId]);

        // Prepare analytics data
        const analyticsData = {
            overview: {
                totalEarnings: parseFloat(totalEarningsResult.rows[0]?.total_earnings) || 0,
                monthlyEarnings: parseFloat(monthlyEarningsResult.rows[0]?.monthly_earnings) || 0,
                totalHours: parseFloat(totalHoursResult.rows[0]?.total_hours) || 0,
                monthlyHours: parseFloat(monthlyHoursResult.rows[0]?.monthly_hours) || 0,
                activeStudents: parseInt(activeStudentsResult.rows[0]?.count) || 0,
                averageRating: parseFloat(averageRatingResult.rows[0]?.avg_rating) || 0,
                sessionsCompleted: parseInt(sessionsCompletedResult.rows[0]?.count) || 0,
                monthlySessionsCompleted: parseInt(monthlySessionsResult.rows[0]?.count) || 0,
                upcomingSessions: parseInt(upcomingSessionsResult.rows[0]?.count) || 0
            },
            earnings: {
                breakdown: earningsBreakdownResult.rows.map(row => ({
                    month: row.month,
                    amount: parseFloat(row.amount) || 0
                }))
            },
            recentSessions: recentSessionsResult.rows.map(row => ({
                id: row.id,
                title: row.title,
                student: `${row.student_first_name} ${row.student_last_name}`,
                subject: row.subject_name,
                date: row.scheduled_start,
                status: row.status,
                amount: parseFloat(row.amount) || 0
            }))
        };

        res.json({ analytics: analyticsData });

    } catch (error) {
        logger.error('Error fetching tutor analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
}));

// Refresh tutor statistics (manual refresh)
router.post('/:tutorId/refresh-stats', authenticateToken, asyncHandler(async (req, res) => {
    const { tutorId } = req.params;

    // Check authorization - only the tutor themselves or admin can refresh
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Verify tutor exists
    const tutorCheck = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [tutorId, 'tutor']);
    if (tutorCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Update tutor profile statistics
        await query(`
            UPDATE tutor_profiles 
            SET 
                total_sessions = (
                    SELECT COUNT(*) FROM tutoring_sessions 
                    WHERE tutor_id = $1::uuid AND status = 'completed'
                ),
                total_students = (
                    SELECT COUNT(DISTINCT student_id) FROM tutoring_sessions 
                    WHERE tutor_id = $1::uuid
                ),
                rating = (
                    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
                    FROM session_reviews sr
                    JOIN tutoring_sessions ts ON sr.session_id = ts.id
                    WHERE ts.tutor_id = $1::uuid
                ),
                total_earnings = (
                    SELECT COALESCE(SUM(p.amount), 0) FROM payments p
                    WHERE p.recipient_id = $1::uuid AND p.status = 'completed'
                ),
                monthly_earnings = (
                    SELECT COALESCE(SUM(p.amount), 0) FROM payments p
                    WHERE p.recipient_id = $1::uuid 
                    AND p.status = 'completed'
                    AND EXTRACT(MONTH FROM p.created_at) = $2::integer
                    AND EXTRACT(YEAR FROM p.created_at) = $3::integer
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1::uuid
        `, [tutorId, currentMonth, currentYear]);

        // Update performance metrics for current month
        await query(`
            INSERT INTO tutor_performance_metrics (
                tutor_id, year, month, total_sessions, completed_sessions, 
                total_earnings, total_hours, average_rating, total_reviews
            )
            SELECT 
                $1::uuid,
                $3::integer,
                $2::integer,
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
                 WHERE ts2.tutor_id = $1::uuid
                 AND EXTRACT(MONTH FROM ts2.scheduled_start) = $2::integer
                 AND EXTRACT(YEAR FROM ts2.scheduled_start) = $3::integer),
                (SELECT COUNT(*) FROM session_reviews sr 
                 JOIN tutoring_sessions ts2 ON sr.session_id = ts2.id 
                 WHERE ts2.tutor_id = $1::uuid
                 AND EXTRACT(MONTH FROM ts2.scheduled_start) = $2::integer
                 AND EXTRACT(YEAR FROM ts2.scheduled_start) = $3::integer)
            FROM tutoring_sessions ts
            LEFT JOIN payments p ON ts.id = p.session_id AND p.recipient_id = $1::uuid
            WHERE ts.tutor_id = $1::uuid
            AND EXTRACT(MONTH FROM ts.scheduled_start) = $2::integer
            AND EXTRACT(YEAR FROM ts.scheduled_start) = $3::integer
            ON CONFLICT (tutor_id, year, month) DO UPDATE SET
                total_sessions = EXCLUDED.total_sessions,
                completed_sessions = EXCLUDED.completed_sessions,
                total_earnings = EXCLUDED.total_earnings,
                total_hours = EXCLUDED.total_hours,
                average_rating = EXCLUDED.average_rating,
                total_reviews = EXCLUDED.total_reviews,
                updated_at = CURRENT_TIMESTAMP
        `, [tutorId, currentMonth, currentYear]);

        logger.info(`Statistics refreshed for tutor ${tutorId}`);
        res.json({ message: 'Statistics refreshed successfully' });

    } catch (error) {
        logger.error('Error refreshing tutor statistics:', error);
        res.status(500).json({ message: 'Failed to refresh statistics' });
    }
}));

module.exports = router;