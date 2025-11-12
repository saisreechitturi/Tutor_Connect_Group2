const express = require('express');
const { query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get tutor dashboard analytics
router.get('/dashboard/:tutorId', [
    authenticateToken,
    expressQuery('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Period must be week, month, quarter, or year'),
    expressQuery('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    expressQuery('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId } = req.params;
    const { period = 'month', startDate, endDate } = req.query;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate date range based on period
    let dateFilter = '';
    let dateParams = [];

    if (startDate && endDate) {
        dateFilter = 'AND ts.session_date BETWEEN $2 AND $3';
        dateParams = [startDate, endDate];
    } else {
        const now = new Date();
        let start;

        switch (period) {
            case 'week':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'quarter':
                start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case 'year':
                start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default: // month
                start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }

        dateFilter = 'AND ts.session_date >= $2';
        dateParams = [start.toISOString().split('T')[0]];
    }

    try {
        // Get overall stats
        const overallStats = await query(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_sessions,
                COUNT(CASE WHEN ts.status = 'cancelled' THEN 1 END) as cancelled_sessions,
                COUNT(CASE WHEN ts.status = 'no-show' THEN 1 END) as no_show_sessions,
                COUNT(CASE WHEN ts.status = 'scheduled' THEN 1 END) as upcoming_sessions,
                SUM(CASE WHEN ts.status = 'completed' THEN ts.duration_minutes ELSE 0 END) as total_teaching_minutes,
                AVG(CASE WHEN ts.status = 'completed' THEN ts.duration_minutes END) as avg_session_duration,
                SUM(CASE WHEN ts.status = 'completed' THEN ts.payment_amount ELSE 0 END) as total_earnings
            FROM tutoring_sessions ts
            WHERE ts.tutor_id = $1 ${dateFilter}
        `, [tutorId, ...dateParams]);

        // Get unique students count
        const studentsStats = await query(`
            SELECT 
                COUNT(DISTINCT ts.student_id) as total_students,
                COUNT(DISTINCT CASE WHEN ts.session_date >= $2 THEN ts.student_id END) as new_students
            FROM tutoring_sessions ts
            WHERE ts.tutor_id = $1 ${dateFilter}
        `, [tutorId, ...dateParams]);

        // Get rating stats
        const ratingStats = await query(`
            SELECT 
                AVG(sr.rating) as avg_rating,
                COUNT(sr.id) as total_reviews,
                COUNT(CASE WHEN sr.rating = 5 THEN 1 END) as five_star_reviews,
                COUNT(CASE WHEN sr.rating >= 4 THEN 1 END) as four_plus_star_reviews
            FROM session_reviews sr
            JOIN tutoring_sessions ts ON sr.session_id = ts.id
            WHERE ts.tutor_id = $1 ${dateFilter}
        `, [tutorId, ...dateParams]);

        // Get subject breakdown
        const subjectStats = await query(`
            SELECT 
                s.name as subject_name,
                s.id as subject_id,
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_sessions,
                SUM(CASE WHEN ts.status = 'completed' THEN ts.payment_amount ELSE 0 END) as earnings,
                AVG(CASE WHEN sr.rating IS NOT NULL THEN sr.rating END) as avg_rating
            FROM tutoring_sessions ts
            JOIN subjects s ON ts.subject_id = s.id
            LEFT JOIN session_reviews sr ON ts.id = sr.session_id
            WHERE ts.tutor_id = $1 ${dateFilter}
            GROUP BY s.id, s.name
            ORDER BY completed_sessions DESC
        `, [tutorId, ...dateParams]);

        // Get daily session trends (last 30 days)
        const dailyTrends = await query(`
            SELECT 
                ts.session_date,
                COUNT(*) as sessions_count,
                COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_sessions,
                SUM(CASE WHEN ts.status = 'completed' THEN ts.payment_amount ELSE 0 END) as daily_earnings
            FROM tutoring_sessions ts
            WHERE ts.tutor_id = $1 
            AND ts.session_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY ts.session_date
            ORDER BY ts.session_date DESC
            LIMIT 30
        `, [tutorId]);

        // Get top performing students
        const topStudents = await query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.profile_picture_url,
                COUNT(ts.id) as total_sessions,
                COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_sessions,
                AVG(CASE WHEN sr.rating IS NOT NULL THEN sr.rating END) as avg_rating_given,
                MAX(ts.session_date) as last_session_date
            FROM users u
            JOIN tutoring_sessions ts ON u.id = ts.student_id
            LEFT JOIN session_reviews sr ON ts.id = sr.session_id AND sr.reviewer_id = u.id
            WHERE ts.tutor_id = $1 ${dateFilter}
            GROUP BY u.id, u.first_name, u.last_name, u.profile_picture_url
            ORDER BY completed_sessions DESC, last_session_date DESC
            LIMIT 10
        `, [tutorId, ...dateParams]);

        const stats = overallStats.rows[0];
        const students = studentsStats.rows[0];
        const ratings = ratingStats.rows[0];

        const analytics = {
            overview: {
                totalSessions: parseInt(stats.total_sessions),
                completedSessions: parseInt(stats.completed_sessions),
                cancelledSessions: parseInt(stats.cancelled_sessions),
                noShowSessions: parseInt(stats.no_show_sessions),
                upcomingSessions: parseInt(stats.upcoming_sessions),
                totalTeachingHours: Math.round((parseInt(stats.total_teaching_minutes) || 0) / 60 * 100) / 100,
                avgSessionDuration: Math.round(parseFloat(stats.avg_session_duration) || 0),
                totalEarnings: parseFloat(stats.total_earnings) || 0,
                completionRate: stats.total_sessions > 0
                    ? Math.round((stats.completed_sessions / stats.total_sessions) * 100 * 100) / 100
                    : 0
            },
            students: {
                totalStudents: parseInt(students.total_students),
                newStudents: parseInt(students.new_students),
                topStudents: topStudents.rows.map(row => ({
                    id: row.id,
                    name: `${row.first_name} ${row.last_name}`,
                    profileImage: row.profile_picture_url,
                    totalSessions: parseInt(row.total_sessions),
                    completedSessions: parseInt(row.completed_sessions),
                    avgRating: parseFloat(row.avg_rating_given) || 0,
                    lastSessionDate: row.last_session_date
                }))
            },
            ratings: {
                avgRating: Math.round((parseFloat(ratings.avg_rating) || 0) * 100) / 100,
                totalReviews: parseInt(ratings.total_reviews),
                fiveStarReviews: parseInt(ratings.five_star_reviews),
                fourPlusStarReviews: parseInt(ratings.four_plus_star_reviews),
                positiveRatingPercentage: ratings.total_reviews > 0
                    ? Math.round((ratings.four_plus_star_reviews / ratings.total_reviews) * 100)
                    : 0
            },
            subjects: subjectStats.rows.map(row => ({
                subjectId: row.subject_id,
                subjectName: row.subject_name,
                totalSessions: parseInt(row.total_sessions),
                completedSessions: parseInt(row.completed_sessions),
                earnings: parseFloat(row.earnings) || 0,
                avgRating: Math.round((parseFloat(row.avg_rating) || 0) * 100) / 100
            })),
            trends: {
                daily: dailyTrends.rows.map(row => ({
                    date: row.session_date,
                    sessions: parseInt(row.sessions_count),
                    completedSessions: parseInt(row.completed_sessions),
                    earnings: parseFloat(row.daily_earnings) || 0
                }))
            },
            period: period,
            dateRange: {
                start: dateParams[0] || null,
                end: dateParams[1] || null
            }
        };

        logger.info(`Analytics generated for tutor ${tutorId} for period ${period}`);
        res.json({ analytics });

    } catch (error) {
        logger.error('Error generating tutor analytics:', error);
        res.status(500).json({ message: 'Failed to generate analytics' });
    }
}));

// Get tutor earnings breakdown
router.get('/earnings/:tutorId', [
    authenticateToken,
    expressQuery('period').optional().isIn(['week', 'month', 'quarter', 'year']),
    expressQuery('status').optional().isIn(['pending', 'available', 'withdrawn'])
], asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    const { period = 'month', status } = req.query;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Get earnings summary
    const earningsSummary = await query(`
        SELECT 
            SUM(amount) as total_earnings,
            SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END) as pending_earnings,
            SUM(CASE WHEN status = 'available' THEN net_amount ELSE 0 END) as available_earnings,
            SUM(CASE WHEN status = 'withdrawn' THEN net_amount ELSE 0 END) as withdrawn_earnings,
            AVG(platform_fee) as avg_platform_fee_rate
        FROM tutor_earnings
        WHERE tutor_id = $1
        ${status ? 'AND status = $2' : ''}
    `, status ? [tutorId, status] : [tutorId]);

    // Get monthly earnings breakdown
    const monthlyEarnings = await query(`
        SELECT 
            year,
            month,
            SUM(amount) as gross_earnings,
            SUM(net_amount) as net_earnings,
            SUM(platform_fee) as total_fees,
            COUNT(*) as total_transactions
        FROM tutor_earnings
        WHERE tutor_id = $1
        AND earned_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY year, month
        ORDER BY year DESC, month DESC
    `, [tutorId]);

    // Get recent transactions
    const recentTransactions = await query(`
        SELECT 
            te.id,
            te.amount,
            te.net_amount,
            te.platform_fee,
            te.earning_type,
            te.status,
            te.earned_date,
            te.available_date,
            ts.session_date,
            s.name as subject_name,
            u.first_name as student_first_name,
            u.last_name as student_last_name
        FROM tutor_earnings te
        LEFT JOIN tutoring_sessions ts ON te.session_id = ts.id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        LEFT JOIN users u ON ts.student_id = u.id
        WHERE te.tutor_id = $1
        ORDER BY te.created_at DESC
        LIMIT 20
    `, [tutorId]);

    const summary = earningsSummary.rows[0];

    const earnings = {
        summary: {
            totalEarnings: parseFloat(summary.total_earnings) || 0,
            pendingEarnings: parseFloat(summary.pending_earnings) || 0,
            availableEarnings: parseFloat(summary.available_earnings) || 0,
            withdrawnEarnings: parseFloat(summary.withdrawn_earnings) || 0,
            avgPlatformFeeRate: parseFloat(summary.avg_platform_fee_rate) || 0
        },
        monthly: monthlyEarnings.rows.map(row => ({
            year: row.year,
            month: row.month,
            grossEarnings: parseFloat(row.gross_earnings),
            netEarnings: parseFloat(row.net_earnings),
            platformFees: parseFloat(row.total_fees),
            totalTransactions: parseInt(row.total_transactions)
        })),
        recentTransactions: recentTransactions.rows.map(row => ({
            id: row.id,
            amount: parseFloat(row.amount),
            netAmount: parseFloat(row.net_amount),
            platformFee: parseFloat(row.platform_fee),
            type: row.earning_type,
            status: row.status,
            earnedDate: row.earned_date,
            availableDate: row.available_date,
            sessionDate: row.session_date,
            subjectName: row.subject_name,
            studentName: row.student_first_name ? `${row.student_first_name} ${row.student_last_name}` : null
        }))
    };

    res.json({ earnings });
}));

// Get student progress analytics for tutor
router.get('/student-progress/:tutorId', [
    authenticateToken,
    expressQuery('studentId').optional().isUUID(),
    expressQuery('subjectId').optional().isUUID(),
    expressQuery('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    const { studentId, subjectId, period = 'month' } = req.query;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    let filters = [];
    let params = [tutorId];

    if (studentId) {
        params.push(studentId);
        filters.push(`spt.student_id = $${params.length}`);
    }

    if (subjectId) {
        params.push(subjectId);
        filters.push(`spt.subject_id = $${params.length}`);
    }

    const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

    // Get student progress overview
    const progressOverview = await query(`
        SELECT 
            u.id as student_id,
            u.first_name,
            u.last_name,
            u.profile_picture_url,
            s.name as subject_name,
            COUNT(spt.id) as total_sessions_tracked,
            AVG(spt.comprehension_level) as avg_comprehension,
            AVG(spt.engagement_level) as avg_engagement,
            AVG(spt.homework_completion_rate) as avg_homework_completion
        FROM student_progress_tracking spt
        JOIN users u ON spt.student_id = u.id
        JOIN subjects s ON spt.subject_id = s.id
        WHERE spt.tutor_id = $1 ${whereClause}
        GROUP BY u.id, u.first_name, u.last_name, u.profile_picture_url, s.name
        ORDER BY total_sessions_tracked DESC
    `, params);

    // Get detailed progress tracking
    const detailedProgress = await query(`
        SELECT 
            spt.*,
            u.first_name as student_first_name,
            u.last_name as student_last_name,
            s.name as subject_name,
            ts.session_date
        FROM student_progress_tracking spt
        JOIN users u ON spt.student_id = u.id
        JOIN subjects s ON spt.subject_id = s.id
        JOIN tutoring_sessions ts ON spt.session_id = ts.id
        WHERE spt.tutor_id = $1 ${whereClause}
        ORDER BY spt.created_at DESC
        LIMIT 50
    `, params);

    const studentProgress = {
        overview: progressOverview.rows.map(row => ({
            studentId: row.student_id,
            studentName: `${row.first_name} ${row.last_name}`,
            profileImage: row.profile_picture_url,
            subjectName: row.subject_name,
            totalSessionsTracked: parseInt(row.total_sessions_tracked),
            avgComprehension: Math.round((parseFloat(row.avg_comprehension) || 0) * 100) / 100,
            avgEngagement: Math.round((parseFloat(row.avg_engagement) || 0) * 100) / 100,
            avgHomeworkCompletion: Math.round((parseFloat(row.avg_homework_completion) || 0) * 100) / 100
        })),
        detailedTracking: detailedProgress.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            sessionDate: row.session_date,
            studentName: `${row.student_first_name} ${row.student_last_name}`,
            subjectName: row.subject_name,
            comprehensionLevel: row.comprehension_level,
            engagementLevel: row.engagement_level,
            homeworkCompletionRate: row.homework_completion_rate,
            goalsAchieved: row.goals_achieved || [],
            areasOfImprovement: row.areas_of_improvement || [],
            nextSessionFocus: row.next_session_focus,
            tutorNotes: row.tutor_notes,
            recommendedResources: row.recommended_resources || [],
            createdAt: row.created_at
        }))
    };

    res.json({ studentProgress });
}));

module.exports = router;