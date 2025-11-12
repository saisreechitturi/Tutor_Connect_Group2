const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get all subjects (public endpoint for browsing)
router.get('/', [
    expressQuery('category').optional().isString(),
    expressQuery('active').optional().isBoolean(),
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

    const { category, active, search, limit = 50, offset = 0 } = req.query;

    let queryText = `
        SELECT id, name, description, category, is_active, created_at
        FROM subjects
        WHERE 1=1
    `;
    const params = [];

    // Add filters
    if (category) {
        queryText += ` AND category = $${params.length + 1}`;
        params.push(category);
    }

    if (active !== undefined) {
        queryText += ` AND is_active = $${params.length + 1}`;
        params.push(active === 'true');
    } else {
        // Default to active subjects only
        queryText += ` AND is_active = true`;
    }

    if (search) {
        queryText += ` AND (name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
    }

    queryText += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM subjects WHERE 1=1';
    const countParams = [];

    if (category) {
        countQuery += ` AND category = $${countParams.length + 1}`;
        countParams.push(category);
    }

    if (active !== undefined) {
        countQuery += ` AND is_active = $${countParams.length + 1}`;
        countParams.push(active === 'true');
    } else {
        countQuery += ` AND is_active = true`;
    }

    if (search) {
        countQuery += ` AND (name ILIKE $${countParams.length + 1} OR description ILIKE $${countParams.length + 1})`;
        countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    logger.info(`Subjects retrieved: ${result.rows.length} of ${total} total`);

    res.json({
        subjects: result.rows,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
    });
}));

// Get subject by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(`
        SELECT id, name, description, category, is_active, created_at
        FROM subjects
        WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Subject not found' });
    }

    // Get tutors teaching this subject
    const tutorsResult = await query(`
        SELECT u.id, u.first_name, u.last_name, u.profile_picture_url,
               tp.hourly_rate, tp.rating, tp.total_sessions
        FROM tutor_subjects ts
        JOIN users u ON ts.tutor_id = u.id
        JOIN tutor_profiles tp ON u.id = tp.user_id
        WHERE ts.subject_id = $1 AND u.is_active = true AND tp.is_available = true
        ORDER BY tp.rating DESC, tp.total_sessions DESC
        LIMIT 10
    `, [id]);

    const subject = {
        ...result.rows[0],
        tutors: tutorsResult.rows.map(tutor => ({
            id: tutor.id,
            firstName: tutor.first_name,
            lastName: tutor.last_name,
            profileImage: tutor.profile_picture_url,
            hourlyRate: tutor.hourly_rate,
            rating: tutor.rating,
            totalSessions: tutor.total_sessions
        }))
    };

    res.json({ subject });
}));

// Create new subject (admin only)
router.post('/', [
    authenticateToken,
    requireRole(['admin']),
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be 1-100 characters'),
    body('description').optional().isString().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
    body('category').optional().isString().isLength({ max: 50 }).withMessage('Category must be max 50 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { name, description, category } = req.body;

    // Check if subject already exists
    const existingSubject = await query('SELECT id FROM subjects WHERE name = $1', [name]);
    if (existingSubject.rows.length > 0) {
        return res.status(409).json({ message: 'Subject with this name already exists' });
    }

    const result = await query(`
        INSERT INTO subjects (name, description, category, is_active)
        VALUES ($1, $2, $3, true)
        RETURNING id, name, description, category, is_active, created_at
    `, [name, description || null, category || null]);

    const subject = result.rows[0];
    logger.info(`Subject created: ${subject.name} (ID: ${subject.id})`);

    res.status(201).json({ subject });
}));

// Update subject (admin only)
router.put('/:id', [
    authenticateToken,
    requireRole(['admin']),
    body('name').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('description').optional().isString().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
    body('category').optional().isString().isLength({ max: 50 }).withMessage('Category must be max 50 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { name, description, category, isActive } = req.body;

    // Check if subject exists
    const existingSubject = await query('SELECT id FROM subjects WHERE id = $1', [id]);
    if (existingSubject.rows.length === 0) {
        return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if name is unique (if being updated)
    if (name) {
        const duplicateCheck = await query('SELECT id FROM subjects WHERE name = $1 AND id != $2', [name, id]);
        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Subject with this name already exists' });
        }
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
        updates.push(`name = $${params.length + 1}`);
        params.push(name);
    }
    if (description !== undefined) {
        updates.push(`description = $${params.length + 1}`);
        params.push(description);
    }
    if (category !== undefined) {
        updates.push(`category = $${params.length + 1}`);
        params.push(category);
    }
    if (isActive !== undefined) {
        updates.push(`is_active = $${params.length + 1}`);
        params.push(isActive);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    params.push(id); // Add ID for WHERE clause

    const result = await query(`
        UPDATE subjects
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
        RETURNING id, name, description, category, is_active, created_at
    `, params);

    const subject = result.rows[0];
    logger.info(`Subject updated: ${subject.name} (ID: ${subject.id})`);

    res.json({ subject });
}));

// Delete subject (admin only)
router.delete('/:id', [
    authenticateToken,
    requireRole(['admin'])
], asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if subject exists
    const existingSubject = await query('SELECT id, name FROM subjects WHERE id = $1', [id]);
    if (existingSubject.rows.length === 0) {
        return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if subject is being used by tutors or sessions
    const tutorCount = await query('SELECT COUNT(*) FROM tutor_subjects WHERE subject_id = $1', [id]);
    const sessionCount = await query('SELECT COUNT(*) FROM tutoring_sessions WHERE subject_id = $1', [id]);

    if (parseInt(tutorCount.rows[0].count) > 0 || parseInt(sessionCount.rows[0].count) > 0) {
        return res.status(409).json({
            message: 'Cannot delete subject that is currently assigned to tutors or used in sessions. Consider deactivating instead.'
        });
    }

    await query('DELETE FROM subjects WHERE id = $1', [id]);

    const subjectName = existingSubject.rows[0].name;
    logger.info(`Subject deleted: ${subjectName} (ID: ${id})`);

    res.json({ message: 'Subject deleted successfully' });
}));

// Get subject categories
router.get('/meta/categories', asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT DISTINCT category
        FROM subjects
        WHERE category IS NOT NULL AND is_active = true
        ORDER BY category ASC
    `);

    const categories = result.rows.map(row => row.category);
    res.json({ categories });
}));

module.exports = router;