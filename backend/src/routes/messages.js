const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getIO } = require('../utils/socket');

const router = express.Router();

// Get messages for a user (sent and received)
// Get messages for a user (supports multiple filter styles)
router.get('/', [
    authenticateToken,
    expressQuery('type').optional().isIn(['sent', 'received']),
    // Legacy parameters for backward compatibility (ignored)
    expressQuery('unread').optional().isBoolean(),
    expressQuery('isRead').optional().isIn(['true', 'false']),
    // New style filters used by frontend messageService
    expressQuery('conversationWith').optional().isString(),
    expressQuery('sessionId').optional().isString(),
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

    const { type } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    let queryText = `
        SELECT m.*, 
               sender.first_name as sender_first_name, sender.last_name as sender_last_name, sender.profile_picture_url as sender_avatar,
               recipient.first_name as recipient_first_name, recipient.last_name as recipient_last_name, recipient.profile_picture_url as recipient_avatar
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users recipient ON m.recipient_id = recipient.id
        WHERE (m.sender_id = $1 OR m.recipient_id = $1)
    `;

    const params = [req.user.id];

    // Legacy filters
    if (type === 'sent') {
        queryText += ` AND m.sender_id = $1`;
    } else if (type === 'received') {
        queryText += ` AND m.recipient_id = $1`;
    }

    // New style filters
    if (req.query.conversationWith) {
        queryText += ` AND ( (m.sender_id = $1 AND m.recipient_id = $${params.length + 1}) OR (m.sender_id = $${params.length + 1} AND m.recipient_id = $1) )`;
        params.push(req.query.conversationWith);
    }
    if (req.query.sessionId) {
        queryText += ` AND m.session_id = $${params.length + 1}`;
        params.push(req.query.sessionId);
    }

    queryText += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const messages = result.rows.map(row => ({
        id: row.id,
        content: row.content,
        sender: {
            id: row.sender_id,
            name: `${row.sender_first_name} ${row.sender_last_name}`,
            firstName: row.sender_first_name,
            lastName: row.sender_last_name,
            avatarUrl: row.sender_avatar
        },
        recipient: {
            id: row.recipient_id,
            name: `${row.recipient_first_name} ${row.recipient_last_name}`,
            firstName: row.recipient_first_name,
            lastName: row.recipient_last_name,
            avatarUrl: row.recipient_avatar
        },
        createdAt: row.created_at
    }));

    res.json({ messages });
}));

// Send a new message
router.post('/', [
    authenticateToken,
    body('recipientId').isString().trim().notEmpty(),
    body('content').optional().trim().isLength({ min: 1, max: 2000 }),
    body('messageText').optional().trim().isLength({ min: 1, max: 2000 }),
    body('messageType').optional().isIn(['direct', 'session', 'system']),
    body('sessionId').optional().isString()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { recipientId, messageType, sessionId } = req.body;
    const content = req.body.content || req.body.messageText;

    if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify recipient exists
    const recipientCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND is_active = $2',
        [recipientId, true]
    );

    if (recipientCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid recipient' });
    }

    // If session message, verify session exists and user has access
    if (sessionId) {
        const sessionCheck = await query(
            'SELECT id FROM tutoring_sessions WHERE id = $1 AND (student_id = $2 OR tutor_id = $2)',
            [sessionId, req.user.id]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid session or access denied' });
        }
    }

    const result = await query(`
        INSERT INTO messages (sender_id, recipient_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [req.user.id, recipientId, content]);

    const message = result.rows[0];

    // Fetch sender and recipient details for socket event
    const [senderDetails, recipientDetails] = await Promise.all([
        query('SELECT id, first_name, last_name FROM users WHERE id = $1', [req.user.id]),
        query('SELECT id, first_name, last_name FROM users WHERE id = $1', [recipientId])
    ]);

    const sender = senderDetails.rows[0];
    const recipient = recipientDetails.rows[0];

    // Emit socket event to recipient if socket server is available
    try {
        const io = getIO();
        if (io) {
            const socketData = {
                id: message.id,
                content: message.content,
                sender: {
                    id: sender.id,
                    firstName: sender.first_name,
                    lastName: sender.last_name,
                    name: `${sender.first_name} ${sender.last_name}`
                },
                recipient: {
                    id: recipient.id,
                    firstName: recipient.first_name,
                    lastName: recipient.last_name,
                    name: `${recipient.first_name} ${recipient.last_name}`
                },
                createdAt: message.created_at
            };

            // Emit to recipient
            io.to(`user:${recipientId}`).emit('message:new', socketData);
            // Also emit to sender for real-time update in their own chat
            io.to(`user:${req.user.id}`).emit('message:new', socketData);
        }
    } catch (_) { /* noop */ }

    res.status(201).json({
        message: 'Message sent successfully',
        messageData: {
            id: message.id,
            content: message.content,
            messageType: messageType || 'direct',
            sessionId: sessionId || null,
            createdAt: message.created_at
        }
    });
}));

// Get unread count (simplified - always returns 0 since we don't track read status)
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
    // Since we removed is_read tracking, always return 0
    res.json({ count: 0 });
}));

// Search messages BEFORE param routes to avoid collision with '/:id'
router.get('/search', [
    authenticateToken,
    expressQuery('q').isString().trim().notEmpty(),
    expressQuery('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
    const q = `%${req.query.q}%`;
    const limit = parseInt(req.query.limit) || 50;
    const result = await query(`
        SELECT m.*, sender.first_name as sender_first_name, sender.last_name as sender_last_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        WHERE (m.sender_id = $1 OR m.recipient_id = $1)
          AND m.content ILIKE $2
        ORDER BY m.created_at DESC
        LIMIT $3
    `, [req.user.id, q, limit]);

    const messages = result.rows.map(row => ({
        id: row.id,
        content: row.content,
        senderId: row.sender_id,
        senderName: `${row.sender_first_name} ${row.sender_last_name}`,
        createdAt: row.created_at
    }));

    res.json({ messages });
}));

router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(`
    SELECT m.*, 
           sender.first_name as sender_first_name, sender.last_name as sender_last_name, sender.profile_picture_url as sender_avatar,
           recipient.first_name as recipient_first_name, recipient.last_name as recipient_last_name, recipient.profile_picture_url as recipient_avatar
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    JOIN users recipient ON m.recipient_id = recipient.id
    WHERE m.id = $1 AND (m.sender_id = $2 OR m.recipient_id = $2)
  `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Message not found' });
    }

    const row = result.rows[0];

    const messageData = {
        id: row.id,
        content: row.content,
        sender: {
            id: row.sender_id,
            name: `${row.sender_first_name} ${row.sender_last_name}`,
            firstName: row.sender_first_name,
            lastName: row.sender_last_name,
            avatarUrl: row.sender_avatar
        },
        recipient: {
            id: row.recipient_id,
            name: `${row.recipient_first_name} ${row.recipient_last_name}`,
            firstName: row.recipient_first_name,
            lastName: row.recipient_last_name,
            avatarUrl: row.recipient_avatar
        },
        createdAt: row.created_at
    };

    res.json({ message: messageData });
}));



// Delete message
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(
        'DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id',
        [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Message not found or cannot be deleted' });
    }

    res.json({ message: 'Message deleted successfully' });
}));

// Get conversation between two users
router.get('/conversation/:userId', [
    authenticateToken,
    expressQuery('limit').optional().isInt({ min: 1, max: 100 }),
    expressQuery('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const otherUserId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(`
    SELECT m.*, 
           sender.first_name as sender_first_name, sender.last_name as sender_last_name, sender.profile_picture_url as sender_avatar
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    WHERE (
      (m.sender_id = $1 AND m.recipient_id = $2) 
      OR 
      (m.sender_id = $2 AND m.recipient_id = $1)
    )
    ORDER BY m.created_at DESC
    LIMIT $3 OFFSET $4
  `, [req.user.id, otherUserId, limit, offset]);

    const messages = result.rows.map(row => ({
        id: row.id,
        content: row.content,
        senderId: row.sender_id,
        senderName: `${row.sender_first_name} ${row.sender_last_name}`,
        senderAvatar: row.sender_avatar,
        createdAt: row.created_at
    }));

    res.json({ messages });
}));



module.exports = router;