const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get all tasks for a user
router.get('/', [
    authenticateToken,
    expressQuery('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    expressQuery('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
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

    const { status, priority } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
        queryText += ` AND status = $${params.length + 1}`;
        params.push(status);
    }

    if (priority) {
        queryText += ` AND priority = $${params.length + 1}`;
        params.push(priority);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const tasks = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        subject: row.subject,
        priority: row.priority,
        status: row.status,
        progress: row.progress_percentage,
        progressPercentage: row.progress_percentage,
        dueDate: row.due_date,
        estimatedHours: row.estimated_hours,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));

    res.json({ tasks });
}));

// Create a new task
router.post('/', [
    authenticateToken,
    body('title').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('subject').optional().trim().isLength({ max: 100 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { title, description, subject, priority, dueDate, estimatedHours, tags } = req.body;

    const result = await query(`
    INSERT INTO tasks (user_id, title, description, subject, priority, due_date, estimated_hours, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [req.user.id, title, description, subject, priority || 'medium', dueDate, estimatedHours, tags]);

    const task = result.rows[0];

    res.status(201).json({
        message: 'Task created successfully',
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            subject: task.subject,
            priority: task.priority,
            status: task.status,
            progress: task.progress_percentage,
            progressPercentage: task.progress_percentage,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            tags: task.tags,
            createdAt: task.created_at,
            updatedAt: task.updated_at
        }
    });
}));

// Get specific task
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    const task = result.rows[0];

    res.json({
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            subject: task.subject,
            priority: task.priority,
            status: task.status,
            progress: task.progress_percentage,
            progressPercentage: task.progress_percentage,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            tags: task.tags,
            createdAt: task.created_at,
            updatedAt: task.updated_at
        }
    });
}));

// Update task
router.put('/:id', [
    authenticateToken,
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('subject').optional().trim().isLength({ max: 100 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('progressPercentage').optional().isInt({ min: 0, max: 100 }),
    body('dueDate').optional().isISO8601(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { title, description, subject, priority, status, progress, progressPercentage, dueDate, estimatedHours, tags } = req.body;
    const progressValue = progress || progressPercentage;

    // Check if task exists and belongs to user
    const existingTask = await query(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );

    if (existingTask.rows.length === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    const result = await query(`
    UPDATE tasks 
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        subject = COALESCE($3, subject),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        progress_percentage = COALESCE($6, progress_percentage),
        due_date = COALESCE($7, due_date),
        estimated_hours = COALESCE($8, estimated_hours),
        tags = COALESCE($9, tags),
        completed_at = CASE WHEN COALESCE($5, status) = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $10 AND user_id = $11
    RETURNING *
  `, [title, description, subject, priority, status, progressValue, dueDate, estimatedHours, tags, req.params.id, req.user.id]);

    const task = result.rows[0];

    res.json({
        message: 'Task updated successfully',
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            subject: task.subject,
            priority: task.priority,
            status: task.status,
            progress: task.progress_percentage,
            progressPercentage: task.progress_percentage,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            tags: task.tags,
            createdAt: task.created_at,
            updatedAt: task.updated_at
        }
    });
}));

// Update task progress only
router.put('/:id/progress', [
    authenticateToken,
    body('progress').isInt({ min: 0, max: 100 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { progress } = req.body;

    // Check if task exists and belongs to user
    const existingTask = await query(
        'SELECT id, status FROM tasks WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );

    if (existingTask.rows.length === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    // Auto-complete if progress reaches 100%
    const newStatus = progress === 100 ? 'completed' : existingTask.rows[0].status;
    const completedAt = progress === 100 ? 'CURRENT_TIMESTAMP' : 'completed_at';

    const result = await query(`
        UPDATE tasks 
        SET progress_percentage = $1,
            status = $2,
            completed_at = ${completedAt},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND user_id = $4
        RETURNING *
    `, [progress, newStatus, req.params.id, req.user.id]);

    const task = result.rows[0];

    res.json({
        message: 'Task progress updated successfully',
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            subject: task.subject,
            priority: task.priority,
            status: task.status,
            progress: task.progress_percentage,
            progressPercentage: task.progress_percentage,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            tags: task.tags,
            completedAt: task.completed_at,
            createdAt: task.created_at,
            updatedAt: task.updated_at
        }
    });
}));

// Mark task as complete
router.put('/:id/complete', authenticateToken, asyncHandler(async (req, res) => {
    // Check if task exists and belongs to user
    const existingTask = await query(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );

    if (existingTask.rows.length === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    const result = await query(`
        UPDATE tasks 
        SET status = 'completed',
            progress_percentage = 100,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
    `, [req.params.id, req.user.id]);

    const task = result.rows[0];

    res.json({
        message: 'Task marked as complete',
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            subject: task.subject,
            priority: task.priority,
            status: task.status,
            progress: task.progress_percentage,
            progressPercentage: task.progress_percentage,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            tags: task.tags,
            completedAt: task.completed_at,
            createdAt: task.created_at,
            updatedAt: task.updated_at
        }
    });
}));

// Mark task as incomplete
router.put('/:id/incomplete', authenticateToken, asyncHandler(async (req, res) => {
    // Check if task exists and belongs to user
    const existingTask = await query(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );

    if (existingTask.rows.length === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    const result = await query(`
        UPDATE tasks 
        SET status = 'pending',
            progress_percentage = 0,
            completed_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
    `, [req.params.id, req.user.id]);

    const task = result.rows[0];

    res.json({
        message: 'Task marked as incomplete',
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            subject: task.subject,
            priority: task.priority,
            status: task.status,
            progress: task.progress_percentage,
            progressPercentage: task.progress_percentage,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            tags: task.tags,
            completedAt: task.completed_at,
            createdAt: task.created_at,
            updatedAt: task.updated_at
        }
    });
}));

// Delete task
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(
        'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
        [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
}));

module.exports = router;