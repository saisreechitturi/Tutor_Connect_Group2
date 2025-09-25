const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('firstName').trim().isLength({ min: 1, max: 100 }),
    body('lastName').trim().isLength({ min: 1, max: 100 }),
    body('role').isIn(['student', 'tutor'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(`
    INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, role, first_name, last_name, phone, created_at
  `, [email, passwordHash, role, firstName, lastName, phone]);

    const user = result.rows[0];

    // If registering as tutor, create tutor profile
    if (role === 'tutor') {
        await query(`
      INSERT INTO tutor_profiles (user_id, hourly_rate, rating)
      VALUES ($1, $2, $3)
    `, [user.id, 0, 0]);
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`New user registered: ${email} as ${role}`);

    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            phone: user.phone
        },
        token
    });
}));

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { email, password } = req.body;

    // Find user
    const result = await query(
        'SELECT id, email, password_hash, role, first_name, last_name, status FROM users WHERE email = $1',
        [email]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
        return res.status(401).json({ message: 'Account is not active' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
        },
        token
    });
}));

// Get current user profile
router.get('/me', require('../middleware/auth').authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.avatar_url, 
           u.bio, u.location, u.timezone, u.status, u.created_at,
           tp.title, tp.hourly_rate, tp.experience_years, tp.education, tp.certifications,
           tp.languages, tp.specializations, tp.rating, tp.total_sessions, tp.total_earnings
    FROM users u
    LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
    WHERE u.id = $1
  `, [req.user.id]);

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

// Update password
router.put('/password', [
    require('../middleware/auth').authenticateToken,
    body('currentPassword').exists(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, req.user.id]
    );

    logger.info(`Password updated for user: ${req.user.email}`);

    res.json({ message: 'Password updated successfully' });
}));

// Logout (optional - mainly for clearing client-side token)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;