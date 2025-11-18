const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

const router = express.Router();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('firstName').trim().isLength({ min: 1, max: 100 }),
    body('lastName').trim().isLength({ min: 1, max: 100 }),
    body('role').isIn(['student', 'tutor']),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('address').optional().trim().isLength({ max: 500 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { email, password, firstName, lastName, role, phone, dateOfBirth, address, pincode } = req.body;

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
    INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, address, pincode)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, email, role, first_name, last_name, phone, date_of_birth, address, pincode, created_at
  `, [email, passwordHash, role, firstName, lastName, phone, dateOfBirth, address, pincode]);

    const user = result.rows[0];

    // If registering as tutor, create basic tutor profile with default values
    if (role === 'tutor') {
        await query(`
      INSERT INTO tutor_profiles (user_id, hourly_rate, years_of_experience, rating)
      VALUES ($1, $2, $3, $4)
    `, [user.id, 0, 0, 0]); // Set default years_of_experience to 0
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
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
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            address: user.address,
            pincode: user.pincode
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
        'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = $1',
        [email]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
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
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
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
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.profile_picture_url, 
           u.bio, u.is_active, u.created_at,
           tp.hourly_rate, tp.years_of_experience, tp.education_background,
           tp.languages_spoken, tp.rating, tp.total_sessions
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
            profileImageUrl: user.profile_picture_url,
            bio: user.bio,
            isActive: user.is_active,
            createdAt: user.created_at,
            ...(user.role === 'tutor' && {
                profile: {
                    hourlyRate: user.hourly_rate,
                    experienceYears: user.years_of_experience,
                    education: user.education_background,
                    languages: user.languages_spoken,
                    rating: user.rating,
                    totalSessions: user.total_sessions
                }
            })
        }
    });
}));

// Get user profile (alias for /me for frontend compatibility)
router.get('/profile', require('../middleware/auth').authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.profile_picture_url, 
           u.bio, u.is_active, u.created_at,
           tp.hourly_rate, tp.years_of_experience, tp.education_background,
           tp.languages_spoken, tp.rating, tp.total_sessions
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
            profileImageUrl: user.profile_picture_url,
            bio: user.bio,
            isActive: user.is_active,
            createdAt: user.created_at,
            ...(user.role === 'tutor' && {
                profile: {
                    hourlyRate: user.hourly_rate,
                    experienceYears: user.years_of_experience,
                    education: user.education_background,
                    languages: user.languages_spoken,
                    rating: user.rating,
                    totalSessions: user.total_sessions
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

// Token verification endpoint
router.get('/verify', require('../middleware/auth').authenticateToken, asyncHandler(async (req, res) => {
    // If middleware passes, token is valid
    const result = await query(
        'SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
        [req.user.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    const user = result.rows[0];

    res.json({
        valid: true,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
        }
    });
}));

// Request password reset
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { email } = req.body;

    // Check if user exists
    const userResult = await query(
        'SELECT id, email, first_name FROM users WHERE email = $1 AND is_active = true',
        [email]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
        return res.json({
            message: 'If an account with that email exists, we have sent a password reset link.'
        });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Store raw token in database for simplicity (not hashed)
    try {
        await query(`
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET
                token_hash = EXCLUDED.token_hash,
                expires_at = EXCLUDED.expires_at,
                used_at = NULL,
                created_at = NOW()
        `, [user.id, resetToken, expiresAt]);

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, resetToken, user.first_name);
        logger.info(`Password reset email processed for: ${email}`);

        // Log token to console for easy copying during development
        console.log('\n🔑 PASSWORD RESET TOKEN GENERATED:');
        console.log('='.repeat(50));
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Token: ${resetToken}`);
        console.log(`📋 Length: ${resetToken.length} characters`);
        console.log(`⏰ Expires: ${expiresAt.toLocaleString()}`);
        console.log(`🌐 Reset URL: http://localhost:3000/#/reset-password/${resetToken}`);
        console.log('='.repeat(50));

        res.json({
            message: 'If an account with that email exists, we have sent a password reset link.'
        });
    } catch (error) {
        logger.error('Failed to create password reset token:', error);
        res.status(500).json({ message: 'Failed to process password reset request' });
    }
}));

// Reset password with token
router.post('/reset-password', [
    body('token').isLength({ min: 64, max: 64 }).matches(/^[a-f0-9]+$/),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Password reset validation failed:', {
            token: req.body.token ? `${req.body.token.substring(0, 8)}...` : 'missing',
            tokenLength: req.body.token ? req.body.token.length : 0,
            passwordLength: req.body.password ? req.body.password.length : 0,
            errors: errors.array()
        });
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { token, password } = req.body;

    // Try to find token both as raw token and as hash (for backward compatibility)
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token - check both raw token and hash
    const tokenResult = await query(`
        SELECT prt.user_id, prt.expires_at, u.email
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE (prt.token_hash = $1 OR prt.token_hash = $2)
        AND prt.expires_at > NOW()
        AND prt.used_at IS NULL
        AND u.is_active = true
    `, [token, tokenHash]);

    if (tokenResult.rows.length === 0) {
        return res.status(400).json({
            message: 'Invalid or expired password reset token'
        });
    }

    const { user_id, email } = tokenResult.rows[0];

    try {
        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(password, saltRounds);

        // Update password and mark token as used
        await query('BEGIN');

        await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, user_id]
        );

        await query(
            'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND (token_hash = $2 OR token_hash = $3)',
            [user_id, token, tokenHash]
        );

        await query('COMMIT');

        logger.info(`Password reset completed for user: ${email}`);

        res.json({
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Failed to reset password:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
}));

// Logout (optional - mainly for clearing client-side token)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;