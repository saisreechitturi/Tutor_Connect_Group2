const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireOwnership } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Search users by name or email
router.get('/search', [
    authenticateToken,
    expressQuery('q').optional().isString().trim(),
    expressQuery('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req, res) => {
    const searchQuery = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;

    let queryText, params;
    if (searchQuery.trim()) {
        // Search with query
        const q = `%${searchQuery}%`;
        queryText = `
            SELECT id, first_name, last_name, email, role, profile_picture_url
            FROM users
            WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
              AND is_active = true
            ORDER BY last_name ASC
            LIMIT $2
        `;
        params = [q, limit];
    } else {
        // No search query, return all active users
        queryText = `
            SELECT id, first_name, last_name, email, role, profile_picture_url
            FROM users
            WHERE is_active = true
            ORDER BY last_name ASC
            LIMIT $1
        `;
        params = [limit];
    }

    const result = await query(queryText, params);

    const users = result.rows.map(u => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: u.role,
        avatarUrl: u.profile_picture_url
    }));

    res.json({ users });
}));

// Get user profile
router.get('/:id', authenticateToken, requireOwnership('id'), asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.date_of_birth, u.address, u.pincode,
           u.profile_picture_url, u.bio, u.email_verified, u.is_active, u.created_at, u.updated_at,
           -- Tutor profile fields
           tp.hourly_rate, tp.years_of_experience, tp.education_background, tp.certifications,
           tp.teaching_philosophy, tp.rating, tp.total_students, tp.total_sessions, tp.is_verified as tutor_verified,
           tp.languages_spoken, tp.preferred_teaching_method, tp.total_earnings, tp.weekly_availability_hours,
           tp.monthly_earnings, tp.is_available_now,
           -- Student profile fields
           sp.grade_level, sp.school_name, sp.learning_goals, sp.preferred_learning_style,
           sp.subjects_of_interest, sp.availability_schedule, sp.emergency_contact
    FROM users u
    LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.id = $1
  `, [req.params.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    console.log('Fetched user data:', JSON.stringify(user, null, 2));

    const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        address: user.address,
        pincode: user.pincode,
        profilePictureUrl: user.profile_picture_url,
        bio: user.bio,
        emailVerified: user.email_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };

    // Add role-specific profile data
    if (user.role === 'tutor') {
        // Create tutor profile if it doesn't exist
        if (!user.hourly_rate && !user.years_of_experience) {
            await query(`
                INSERT INTO tutor_profiles (user_id, created_at, updated_at)
                VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO NOTHING
            `, [user.id]);
        }

        userData.profile = {
            hourlyRate: user.hourly_rate || 0,
            yearsOfExperience: user.years_of_experience || 0,
            educationBackground: user.education_background || '',
            certifications: user.certifications || '',
            teachingPhilosophy: user.teaching_philosophy || '',
            rating: user.rating || 0,
            totalStudents: user.total_students || 0,
            totalSessions: user.total_sessions || 0,
            isVerified: user.tutor_verified || false,
            languagesSpoken: user.languages_spoken || [],
            preferredTeachingMethod: user.preferred_teaching_method || '',
            totalEarnings: user.total_earnings || 0,
            weeklyAvailabilityHours: user.weekly_availability_hours || 0,
            monthlyEarnings: user.monthly_earnings || 0,
            isAvailableNow: user.is_available_now || false
        };
    } else if (user.role === 'student') {
        // Create student profile if it doesn't exist
        if (!user.grade_level && !user.school_name) {
            await query(`
                INSERT INTO student_profiles (user_id, created_at, updated_at)
                VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO NOTHING
            `, [user.id]);
        }

        userData.profile = {
            gradeLevel: user.grade_level || '',
            schoolName: user.school_name || '',
            learningGoals: user.learning_goals || '',
            preferredLearningStyle: user.preferred_learning_style || 'visual',
            subjectsOfInterest: user.subjects_of_interest || [],
            availabilitySchedule: user.availability_schedule || {},
            emergencyContact: user.emergency_contact || {}
        };
    }

    console.log('Sending user data to frontend:', JSON.stringify(userData, null, 2));
    res.json({ user: userData });
}));

// Update user profile
router.put('/:id', [
    authenticateToken,
    requireOwnership('id'),
    body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
    body('phone').optional().isLength({ max: 20 }),
    body('dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
    body('address').optional().isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
    body('pincode').optional().isLength({ min: 3, max: 20 }).withMessage('Pincode must be between 3 and 20 characters'),
    body('bio').optional().isLength({ max: 1000 }),
    body('profilePictureUrl').optional().custom((value) => {
        if (!value || value.trim() === '') return true; // Allow empty values
        try {
            new URL(value);
            return true;
        } catch {
            throw new Error('Profile picture must be a valid URL');
        }
    }),
    // Tutor profile fields
    body('hourlyRate').optional().isFloat({ min: 0 }),
    body('yearsOfExperience').optional().isInt({ min: 0 }),
    body('educationBackground').optional().isString(),
    body('certifications').optional().isArray(),
    body('teachingPhilosophy').optional().isString(),
    body('languagesSpoken').optional().isArray(),
    body('preferredTeachingMethod').optional().isString(),
    body('isAvailableNow').optional().isBoolean(),
    // Student profile fields
    body('gradeLevel').optional().isString(),
    body('schoolName').optional().isString(),
    body('learningGoals').optional().isString(),
    body('preferredLearningStyle').optional().isIn(['visual', 'auditory', 'kinesthetic', 'reading', 'both']),
    body('subjectsOfInterest').optional().isArray(),
    body('availabilitySchedule').optional().isObject(),
    body('emergencyContact').optional().isObject()
], asyncHandler(async (req, res) => {
    console.log('PUT /users/:id - Request received');
    console.log('PUT - User ID:', req.params.id);
    console.log('PUT - Request body:', JSON.stringify(req.body, null, 2));
    console.log('PUT - User role:', req.user.role);
    console.log('PUT - Content-Type:', req.headers['content-type']);
    console.log('PUT - Raw body type:', typeof req.body);

    const errors = validationResult(req);
    console.log('PUT - Validation result isEmpty:', errors.isEmpty());
    if (!errors.isEmpty()) {
        console.log('PUT - Validation errors:', JSON.stringify(errors.array(), null, 2));
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const {
        firstName, lastName, phone, dateOfBirth, address, pincode, bio, profilePictureUrl,
        // Tutor profile fields
        hourlyRate, yearsOfExperience, educationBackground, certifications, teachingPhilosophy,
        languagesSpoken, preferredTeachingMethod, isAvailableNow,
        // Student profile fields
        gradeLevel, schoolName, learningGoals, preferredLearningStyle, subjectsOfInterest,
        availabilitySchedule, emergencyContact
    } = req.body;

    // Update user basic info
    const userUpdateResult = await query(`
        UPDATE users 
        SET first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            date_of_birth = COALESCE($4, date_of_birth),
            address = COALESCE($5, address),
            pincode = COALESCE($6, pincode),
            bio = COALESCE($7, bio),
            profile_picture_url = COALESCE($8, profile_picture_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
    `, [firstName, lastName, phone, dateOfBirth, address, pincode, bio, profilePictureUrl, req.params.id]);

    if (userUpdateResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Update role-specific profile data
    if (req.user.role === 'tutor') {
        // Insert or update tutor profile
        await query(`
            INSERT INTO tutor_profiles (user_id, hourly_rate, years_of_experience, education_background, 
                                      certifications, teaching_philosophy, languages_spoken, 
                                      preferred_teaching_method, is_available_now, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                hourly_rate = COALESCE(EXCLUDED.hourly_rate, tutor_profiles.hourly_rate),
                years_of_experience = COALESCE(EXCLUDED.years_of_experience, tutor_profiles.years_of_experience),
                education_background = COALESCE(EXCLUDED.education_background, tutor_profiles.education_background),
                certifications = COALESCE(EXCLUDED.certifications, tutor_profiles.certifications),
                teaching_philosophy = COALESCE(EXCLUDED.teaching_philosophy, tutor_profiles.teaching_philosophy),
                languages_spoken = COALESCE(EXCLUDED.languages_spoken, tutor_profiles.languages_spoken),
                preferred_teaching_method = COALESCE(EXCLUDED.preferred_teaching_method, tutor_profiles.preferred_teaching_method),
                is_available_now = COALESCE(EXCLUDED.is_available_now, tutor_profiles.is_available_now),
                updated_at = CURRENT_TIMESTAMP
        `, [req.params.id, hourlyRate, yearsOfExperience, educationBackground, certifications,
            teachingPhilosophy, languagesSpoken, preferredTeachingMethod, isAvailableNow]);
    } else if (req.user.role === 'student') {
        // Insert or update student profile
        await query(`
            INSERT INTO student_profiles (user_id, grade_level, school_name, learning_goals, 
                                        preferred_learning_style, subjects_of_interest, 
                                        availability_schedule, emergency_contact, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                grade_level = COALESCE(EXCLUDED.grade_level, student_profiles.grade_level),
                school_name = COALESCE(EXCLUDED.school_name, student_profiles.school_name),
                learning_goals = COALESCE(EXCLUDED.learning_goals, student_profiles.learning_goals),
                preferred_learning_style = COALESCE(EXCLUDED.preferred_learning_style, student_profiles.preferred_learning_style),
                subjects_of_interest = COALESCE(EXCLUDED.subjects_of_interest, student_profiles.subjects_of_interest),
                availability_schedule = COALESCE(EXCLUDED.availability_schedule, student_profiles.availability_schedule),
                emergency_contact = COALESCE(EXCLUDED.emergency_contact, student_profiles.emergency_contact),
                updated_at = CURRENT_TIMESTAMP
        `, [req.params.id, gradeLevel, schoolName, learningGoals, preferredLearningStyle,
            subjectsOfInterest, availabilitySchedule, emergencyContact]);
    }

    res.json({
        message: 'Profile updated successfully',
        user: userUpdateResult.rows[0]
    });
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