const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get all tasks for a user
router.get('/', [
    authenticateToken,
    expressQuery('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    expressQuery('priority').optional().isIn(['low', 'medium', 'high']),
    expressQuery('category').optional().isString(),
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

    const { status, priority, category } = req.query;
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

    if (category) {
        queryText += ` AND category ILIKE $${params.length + 1}`;
        params.push(`%${category}%`);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    // Demo system: If user has no tasks, assign existing demo tasks to them
    const existingTasksCheck = await query('SELECT COUNT(*) as count FROM tasks WHERE user_id = $1', [req.user.id]);
    if (existingTasksCheck.rows[0].count === '0') {
        // User has no tasks, reassign existing tasks to them for demo purposes
        await query('UPDATE tasks SET user_id = $1 WHERE user_id != $1', [req.user.id]);
        logger.info(`Reassigned demo tasks to user ${req.user.id}`);
    }

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

// Create a new task
router.post('/', [
    authenticateToken,
    body('title').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('category').optional().isLength({ max: 100 }),
    body('priority').optional().isIn(['low', 'medium', 'high']),
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

    const { title, description, category, priority, dueDate, estimatedHours, tags } = req.body;

    const result = await query(`
    INSERT INTO tasks (user_id, title, description, category, priority, due_date, estimated_hours, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [req.user.id, title, description, category, priority || 'medium', dueDate, estimatedHours, JSON.stringify(tags)]);

    const task = result.rows[0];

    res.status(201).json({
        message: 'Task created successfully',
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            status: task.status,
            progress: task.progress,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            actualHours: task.actual_hours,
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
            category: task.category,
            priority: task.priority,
            status: task.status,
            progress: task.progress,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            actualHours: task.actual_hours,
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
    body('category').optional().isLength({ max: 100 }),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('dueDate').optional().isISO8601(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('actualHours').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { title, description, category, priority, status, progress, dueDate, estimatedHours, actualHours, tags } = req.body;

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
        category = COALESCE($3, category),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        progress = COALESCE($6, progress),
        due_date = COALESCE($7, due_date),
        estimated_hours = COALESCE($8, estimated_hours),
        actual_hours = COALESCE($9, actual_hours),
        tags = COALESCE($10, tags)
    WHERE id = $11 AND user_id = $12
    RETURNING *
  `, [title, description, category, priority, status, progress, dueDate, estimatedHours, actualHours, JSON.stringify(tags), req.params.id, req.user.id]);

    const task = result.rows[0];

    res.json({
        message: 'Task updated successfully',
        task: {
            id: task.id,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            status: task.status,
            progress: task.progress,
            dueDate: task.due_date,
            estimatedHours: task.estimated_hours,
            actualHours: task.actual_hours,
            tags: task.tags,
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