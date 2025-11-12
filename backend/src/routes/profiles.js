const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile (public info for any user, full info for own profile)
// Constrain :id to UUID to avoid collisions with static routes like "/tutor"
router.get('/:id([0-9a-fA-F-]{36})', authenticateToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const isOwnProfile = requesterId === id;

    // Get basic user info
    const userResult = await query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.bio, 
               u.profile_picture_url, u.role, u.created_at, u.is_active,
               ${isOwnProfile ? 'u.date_of_birth,' : ''}
               ua.address_line1, ua.address_line2, ua.city, ua.state, ua.postal_code, ua.country
        FROM users u
        LEFT JOIN user_addresses ua ON u.id = ua.user_id AND ua.is_primary = true
        WHERE u.id = $1 AND u.is_active = true
    `, [id]);

    if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    const profile = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        bio: user.bio,
        profileImage: user.profile_picture_url,
        role: user.role,
        createdAt: user.created_at,
        ...(isOwnProfile && {
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.date_of_birth
        }),
        address: user.address_line1 ? {
            line1: user.address_line1,
            line2: user.address_line2,
            city: user.city,
            state: user.state,
            postalCode: user.postal_code,
            country: user.country
        } : null
    };

    // Add role-specific profile data
    if (user.role === 'tutor') {
        const tutorResult = await query(`
            SELECT tp.hourly_rate, tp.years_of_experience, tp.education_background, tp.certifications,
                   tp.languages_spoken, tp.preferred_teaching_method, tp.teaching_philosophy,
                   tp.is_verified, tp.rating, tp.total_sessions, tp.total_students
            FROM tutor_profiles tp
            WHERE tp.user_id = $1
        `, [id]);

        if (tutorResult.rows.length > 0) {
            const tutorData = tutorResult.rows[0];
            profile.tutorProfile = {
                hourlyRate: tutorData.hourly_rate,
                experienceYears: tutorData.years_of_experience,
                education: tutorData.education_background,
                certifications: tutorData.certifications,
                languages: tutorData.languages_spoken,
                preferredTeachingMethod: tutorData.preferred_teaching_method,
                teachingPhilosophy: tutorData.teaching_philosophy,
                isVerified: tutorData.is_verified,
                rating: tutorData.rating,
                totalSessions: tutorData.total_sessions,
                totalStudents: tutorData.total_students
            };

            // Get subjects (public info)
            const subjectsResult = await query(`
                SELECT s.id, s.name, s.category, ts.proficiency_level
                FROM tutor_subjects ts
                JOIN subjects s ON ts.subject_id = s.id
                WHERE ts.tutor_id = $1 AND s.is_active = true
                ORDER BY s.name ASC
            `, [id]);

            profile.tutorProfile.subjects = subjectsResult.rows.map(row => ({
                id: row.id,
                name: row.name,
                category: row.category,
                proficiencyLevel: row.proficiency_level
            }));
        }
    } else if (user.role === 'student' && isOwnProfile) {
        const studentResult = await query(`
            SELECT sp.grade_level, sp.school_name, sp.learning_goals, sp.preferred_learning_style,
                   sp.subjects_of_interest, sp.availability_schedule, sp.emergency_contact
            FROM student_profiles sp
            WHERE sp.user_id = $1
        `, [id]);

        if (studentResult.rows.length > 0) {
            const studentData = studentResult.rows[0];
            profile.studentProfile = {
                gradeLevel: studentData.grade_level,
                schoolName: studentData.school_name,
                learningGoals: studentData.learning_goals,
                preferredLearningStyle: studentData.preferred_learning_style,
                subjectsOfInterest: studentData.subjects_of_interest || [],
                availabilitySchedule: studentData.availability_schedule || null,
                emergencyContact: studentData.emergency_contact || null
            };
        }
    }

    res.json({ profile });
}));

// Update user profile
// Constrain :id to UUID to avoid collisions with static routes like "/tutor"
router.put('/:id([0-9a-fA-F-]{36})', [
    authenticateToken,
    body('firstName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 characters'),
    body('phone').optional().isString().isLength({ max: 20 }).withMessage('Phone must be max 20 characters'),
    body('bio').optional().isString().isLength({ max: 1000 }).withMessage('Bio must be max 1000 characters'),
    body('dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
    body('profileImage').optional().isURL().withMessage('Profile image must be a valid URL')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { firstName, lastName, phone, bio, dateOfBirth, profileImage } = req.body;

    // Check authorization
    if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Build dynamic update query for users table
    const updates = [];
    const params = [];

    if (firstName !== undefined) {
        updates.push(`first_name = $${params.length + 1}`);
        params.push(firstName);
    }
    if (lastName !== undefined) {
        updates.push(`last_name = $${params.length + 1}`);
        params.push(lastName);
    }
    if (phone !== undefined) {
        updates.push(`phone = $${params.length + 1}`);
        params.push(phone);
    }
    if (bio !== undefined) {
        updates.push(`bio = $${params.length + 1}`);
        params.push(bio);
    }
    if (dateOfBirth !== undefined) {
        updates.push(`date_of_birth = $${params.length + 1}`);
        params.push(dateOfBirth);
    }
    if (profileImage !== undefined) {
        updates.push(`profile_picture_url = $${params.length + 1}`);
        params.push(profileImage);
    }

    if (updates.length > 0) {
        params.push(id);
        await query(`
            UPDATE users
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${params.length}
        `, params);
    }

    logger.info(`Profile updated for user ${id}`);
    res.json({ message: 'Profile updated successfully' });
}));

// Update tutor profile
// Constrain :id to UUID to avoid collisions with static routes like "/tutor"
router.put('/:id([0-9a-fA-F-]{36})/tutor', [
    authenticateToken,
    body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
    body('experienceYears').optional().isInt({ min: 0 }).withMessage('Experience years must be a non-negative integer'),
    body('education').optional().isString().isLength({ max: 1000 }).withMessage('Education must be max 1000 characters'),
    body('certifications').optional().isArray().withMessage('Certifications must be an array'),
    body('languages').optional().isString().isLength({ max: 255 }).withMessage('Languages must be max 255 characters'),
    body('teachingPhilosophy').optional().isString().isLength({ max: 1000 }).withMessage('Teaching philosophy must be max 1000 characters'),
    body('preferredTeachingMethod').optional().isIn(['online', 'in_person', 'both']).withMessage('Preferred teaching method must be online, in_person, or both')
], asyncHandler(async (req, res) => {
    // 🚨 ROUTE LEVEL LOGGING - Check if /:id/tutor route is being hit
    logger.info(`🚀 PUT /api/profiles/:id/tutor - REQUEST RECEIVED for ID: ${req.params.id}`);
    console.log('🚀 PUT /api/profiles/:id/tutor - REQUEST RECEIVED for ID:', req.params.id);
    console.log('🔍 User from token:', req.user ? { id: req.user.id, role: req.user.role, email: req.user.email } : 'NO USER');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const {
        hourlyRate, experienceYears, education, certifications, languages,
        teachingPhilosophy, preferredTeachingMethod
    } = req.body;

    // Check authorization
    if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Verify user is a tutor
    const userCheck = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'tutor') {
        return res.status(404).json({ message: 'Tutor not found' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (hourlyRate !== undefined) {
        updates.push(`hourly_rate = $${params.length + 1}`);
        params.push(hourlyRate);
    }
    if (experienceYears !== undefined) {
        updates.push(`years_of_experience = $${params.length + 1}`);
        params.push(experienceYears);
    }
    if (education !== undefined) {
        updates.push(`education_background = $${params.length + 1}`);
        params.push(education);
    }
    if (certifications !== undefined) {
        updates.push(`certifications = $${params.length + 1}`);
        params.push(certifications);
    }
    if (languages !== undefined) {
        updates.push(`languages_spoken = $${params.length + 1}`);
        params.push(languages);
    }
    if (teachingPhilosophy !== undefined) {
        updates.push(`teaching_philosophy = $${params.length + 1}`);
        params.push(teachingPhilosophy);
    }
    if (preferredTeachingMethod !== undefined) {
        updates.push(`preferred_teaching_method = $${params.length + 1}`);
        params.push(preferredTeachingMethod);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    params.push(id);

    await query(`
        UPDATE tutor_profiles
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${params.length}
    `, params);

    logger.info(`Tutor profile updated for user ${id}`);
    res.json({ message: 'Tutor profile updated successfully' });
}));

// Update current user's tutor profile (simplified route)
router.put('/tutor', [
    authenticateToken,
    body('yearsOfExperience').optional().isInt({ min: 0, max: 50 }).withMessage('Years of experience must be between 0 and 50'),
    body('hourlyRate').optional().isFloat({ min: 0, max: 1000 }).withMessage('Hourly rate must be between 0 and 1000'),
    body('educationBackground').optional().isString().isLength({ max: 1000 }).withMessage('Education background must be max 1000 characters'),
    body('certifications').optional().isArray().withMessage('Certifications must be an array'),
    body('teachingPhilosophy').optional().isString().isLength({ max: 1000 }).withMessage('Teaching philosophy must be max 1000 characters'),
    body('preferredTeachingMethod').optional().isString().isLength({ max: 100 }).withMessage('Preferred teaching method must be max 100 characters'),
    body('languagesSpoken').optional().isArray().withMessage('Languages spoken must be an array')
], asyncHandler(async (req, res) => {
    // 🚨 ROUTE LEVEL LOGGING - Add this to see if request reaches the route
    logger.info(`🚀 PUT /api/profiles/tutor - REQUEST RECEIVED`);
    logger.info(`🔍 User from token: ${req.user ? JSON.stringify({ id: req.user.id, role: req.user.role, email: req.user.email }) : 'NO USER'}`);
    logger.info(`📦 Request body keys: ${Object.keys(req.body).join(', ')}`);
    console.log('🚀 PUT /api/profiles/tutor - REQUEST RECEIVED');
    console.log('🔍 User from token:', req.user ? { id: req.user.id, role: req.user.role, email: req.user.email } : 'NO USER');
    // Trigger restart
    console.log('📦 Request body keys:', Object.keys(req.body).join(', '));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    // Check if req.user exists
    if (!req.user) {
        logger.error('req.user is not set - authentication middleware may have failed');
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.id) {
        logger.error('req.user.id is not set:', req.user);
        return res.status(401).json({ message: 'Invalid user data' });
    }

    const userId = req.user.id;
    const {
        yearsOfExperience,
        hourlyRate,
        educationBackground,
        certifications,
        teachingPhilosophy,
        preferredTeachingMethod,
        languagesSpoken
    } = req.body;

    // Add detailed logging for debugging
    logger.info(`Tutor profile update attempt - User ID: ${userId}, User object:`, req.user);
    logger.info(`Request body:`, req.body);

    // Check if user is a tutor
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    logger.info(`User lookup result for ${userId}:`, userResult.rows);
    if (userResult.rows.length === 0) {
        logger.error(`User not found for tutor profile update: ${userId}`);
        return res.status(403).json({ message: 'Access denied. User not found.' });
    }

    if (userResult.rows[0].role !== 'tutor') {
        logger.error(`Non-tutor user attempting to update tutor profile: ${userId}, role: ${userResult.rows[0].role}`);
        return res.status(403).json({ message: 'Access denied. Only tutors can update tutor profiles.' });
    }

    // Check if tutor profile exists, create if it doesn't
    const profileCheck = await query('SELECT id FROM tutor_profiles WHERE user_id = $1', [userId]);
    if (profileCheck.rows.length === 0) {
        logger.info(`Creating tutor profile for user: ${userId}`);
        await query(`
            INSERT INTO tutor_profiles (user_id, hourly_rate, years_of_experience)
            VALUES ($1, 0.00, 0)
        `, [userId]);
    }

    // Build dynamic update query
    const updates = [];
    const params = [userId];

    if (yearsOfExperience !== undefined) {
        params.push(yearsOfExperience);
        updates.push(`years_of_experience = $${params.length}`);
    }
    if (hourlyRate !== undefined) {
        params.push(hourlyRate);
        updates.push(`hourly_rate = $${params.length}`);
    }
    if (educationBackground !== undefined) {
        params.push(educationBackground);
        updates.push(`education_background = $${params.length}`);
    }
    if (certifications !== undefined) {
        // Handle certifications as PostgreSQL array - convert string/array to proper format
        let certificationsValue;
        if (typeof certifications === 'string') {
            // If it's a single string, convert to array
            certificationsValue = certifications.trim() ? [certifications] : [];
        } else if (Array.isArray(certifications)) {
            // If it's already an array, use it directly
            certificationsValue = certifications.filter(cert => cert && cert.trim());
        } else {
            certificationsValue = [];
        }
        params.push(certificationsValue);
        updates.push(`certifications = $${params.length}`);
    }
    if (teachingPhilosophy !== undefined) {
        params.push(teachingPhilosophy);
        updates.push(`teaching_philosophy = $${params.length}`);
    }
    if (preferredTeachingMethod !== undefined) {
        params.push(preferredTeachingMethod);
        updates.push(`preferred_teaching_method = $${params.length}`);
    }
    if (languagesSpoken !== undefined) {
        params.push(JSON.stringify(languagesSpoken));
        updates.push(`languages_spoken = $${params.length}`);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    await query(`
        UPDATE tutor_profiles
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
    `, params);

    logger.info(`Tutor profile updated for current user ${userId}`);
    res.json({ message: 'Tutor profile updated successfully' });
}));

// Update student profile
// Constrain :id to UUID to avoid collisions with static routes like "/tutor"
router.put('/:id([0-9a-fA-F-]{36})/student', [
    authenticateToken,
    body('gradeLevel').optional().isString().isLength({ max: 50 }).withMessage('Grade level must be max 50 characters'),
    body('schoolName').optional().isString().isLength({ max: 255 }).withMessage('School name must be max 255 characters'),
    body('learningGoals').optional().isString().isLength({ max: 2000 }).withMessage('Learning goals must be max 2000 characters'),
    body('preferredLearningStyle').optional({ nullable: true, checkFalsy: true }).isIn(['visual', 'auditory', 'kinesthetic', 'reading', 'both']).withMessage('Preferred learning style is invalid'),
    body('subjectsOfInterest').optional().isArray().withMessage('Subjects of interest must be an array'),
    body('availabilitySchedule').optional().isObject().withMessage('Availability schedule must be an object'),
    body('emergencyContact').optional().isObject().withMessage('Emergency contact must be an object')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const {
        gradeLevel, schoolName, learningGoals, preferredLearningStyle,
        subjectsOfInterest, availabilitySchedule, emergencyContact
    } = req.body;

    // Check authorization
    if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Verify user is a student
    const userCheck = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'student') {
        return res.status(404).json({ message: 'Student not found' });
    }

    // Ensure a student profile exists for this user
    const profileCheck = await query('SELECT id FROM student_profiles WHERE user_id = $1', [id]);
    if (profileCheck.rows.length === 0) {
        await query('INSERT INTO student_profiles (user_id) VALUES ($1)', [id]);
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (gradeLevel !== undefined) {
        updates.push(`grade_level = $${params.length + 1}`);
        params.push(gradeLevel);
    }
    if (schoolName !== undefined) {
        updates.push(`school_name = $${params.length + 1}`);
        params.push(schoolName);
    }
    if (learningGoals !== undefined) {
        updates.push(`learning_goals = $${params.length + 1}`);
        params.push(learningGoals);
    }
    if (preferredLearningStyle !== undefined) {
        updates.push(`preferred_learning_style = $${params.length + 1}`);
        params.push(preferredLearningStyle);
    }
    if (subjectsOfInterest !== undefined) {
        updates.push(`subjects_of_interest = $${params.length + 1}`);
        // Accept comma-separated string or array of strings
        let subjects = subjectsOfInterest;
        if (typeof subjectsOfInterest === 'string') {
            subjects = subjectsOfInterest.split(',').map(s => s.trim()).filter(Boolean);
        }
        params.push(subjects);
    }
    if (availabilitySchedule !== undefined) {
        updates.push(`availability_schedule = $${params.length + 1}`);
        params.push(JSON.stringify(availabilitySchedule));
    }
    if (emergencyContact !== undefined) {
        updates.push(`emergency_contact = $${params.length + 1}`);
        params.push(JSON.stringify(emergencyContact));
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    params.push(id);

    await query(`
        UPDATE student_profiles
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${params.length}
    `, params);

    logger.info(`Student profile updated for user ${id}`);
    res.json({ message: 'Student profile updated successfully' });
}));

// Update user address
// Constrain :id to UUID to avoid collisions with static routes like "/tutor"
router.put('/:id([0-9a-fA-F-]{36})/address', [
    authenticateToken,
    body('addressLine1').optional().isString().isLength({ max: 255 }).withMessage('Address line 1 must be max 255 characters'),
    body('addressLine2').optional().isString().isLength({ max: 255 }).withMessage('Address line 2 must be max 255 characters'),
    body('city').optional().isString().isLength({ max: 100 }).withMessage('City must be max 100 characters'),
    body('state').optional().isString().isLength({ max: 50 }).withMessage('State must be max 50 characters'),
    body('postalCode').optional().isString().isLength({ max: 20 }).withMessage('Postal code must be max 20 characters'),
    body('country').optional().isString().isLength({ max: 50 }).withMessage('Country must be max 50 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;

    // Check authorization
    if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Check if address exists
    const addressCheck = await query('SELECT id FROM user_addresses WHERE user_id = $1 AND is_primary = true', [id]);

    if (addressCheck.rows.length > 0) {
        // Update existing address
        const updates = [];
        const params = [];

        if (addressLine1 !== undefined) {
            updates.push(`address_line1 = $${params.length + 1}`);
            params.push(addressLine1);
        }
        if (addressLine2 !== undefined) {
            updates.push(`address_line2 = $${params.length + 1}`);
            params.push(addressLine2);
        }
        if (city !== undefined) {
            updates.push(`city = $${params.length + 1}`);
            params.push(city);
        }
        if (state !== undefined) {
            updates.push(`state = $${params.length + 1}`);
            params.push(state);
        }
        if (postalCode !== undefined) {
            updates.push(`postal_code = $${params.length + 1}`);
            params.push(postalCode);
        }
        if (country !== undefined) {
            updates.push(`country = $${params.length + 1}`);
            params.push(country);
        }

        if (updates.length > 0) {
            params.push(id);
            await query(`
                UPDATE user_addresses
                SET ${updates.join(', ')}
                WHERE user_id = $${params.length} AND is_primary = true
            `, params);
        }
    } else {
        // Create new address
        await query(`
            INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, postal_code, country, is_primary)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        `, [id, addressLine1 || null, addressLine2 || null, city || null, state || null, postalCode || null, country || 'USA']);
    }

    logger.info(`Address updated for user ${id}`);
    res.json({ message: 'Address updated successfully' });
}));

module.exports = router;
