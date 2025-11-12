const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get messages for a user (sent and received)
router.get('/', [
    authenticateToken,
    expressQuery('type').optional().isIn(['sent', 'received']),
    expressQuery('unread').optional().isBoolean(),
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

    const { type, unread } = req.query;
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

    if (type === 'sent') {
        queryText += ` AND m.sender_id = $1`;
    } else if (type === 'received') {
        queryText += ` AND m.recipient_id = $1`;
    }

    if (unread === 'true') {
        queryText += ` AND m.is_read = false AND m.recipient_id = $1`;
    }

    queryText += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const messages = result.rows.map(row => ({
        id: row.id,
        subject: row.subject,
        content: row.content,
        messageType: row.message_type,
        isRead: row.is_read,
        attachmentUrl: row.attachment_url,
        sessionId: row.session_id,
        sender: {
            id: row.sender_id,
            name: `${row.sender_first_name} ${row.sender_last_name}`,
            avatarUrl: row.sender_avatar
        },
        recipient: {
            id: row.recipient_id,
            name: `${row.recipient_first_name} ${row.recipient_last_name}`,
            avatarUrl: row.recipient_avatar
        },
        createdAt: row.created_at
    }));

    res.json({ messages });
}));

// Send a new message
router.post('/', [
    authenticateToken,
    body('recipientId').isInt({ min: 1 }),
    body('subject').optional().trim().isLength({ min: 1, max: 255 }),
    body('content').trim().isLength({ min: 1, max: 2000 }),
    body('messageType').optional().isIn(['direct', 'session', 'system']),
    body('sessionId').optional().isInt({ min: 1 })
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { recipientId, subject, content, messageType, sessionId } = req.body;

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
    INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, session_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [req.user.id, recipientId, subject, content, messageType || 'direct', sessionId]);

    const message = result.rows[0];

    res.status(201).json({
        message: 'Message sent successfully',
        messageData: {
            id: message.id,
            subject: message.subject,
            content: message.content,
            messageType: message.message_type,
            sessionId: message.session_id,
            createdAt: message.created_at
        }
    });
}));

// Get specific message
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

    // Mark as read if user is the recipient
    if (row.recipient_id === req.user.id && !row.is_read) {
        await query('UPDATE messages SET is_read = true WHERE id = $1', [req.params.id]);
    }

    const messageData = {
        id: row.id,
        subject: row.subject,
        content: row.content,
        messageType: row.message_type,
        isRead: row.recipient_id === req.user.id ? true : row.is_read,
        attachmentUrl: row.attachment_url,
        sessionId: row.session_id,
        sender: {
            id: row.sender_id,
            name: `${row.sender_first_name} ${row.sender_last_name}`,
            avatarUrl: row.sender_avatar
        },
        recipient: {
            id: row.recipient_id,
            name: `${row.recipient_first_name} ${row.recipient_last_name}`,
            avatarUrl: row.recipient_avatar
        },
        createdAt: row.created_at
    };

    res.json({ message: messageData });
}));

// Mark message as read
router.patch('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(
        'UPDATE messages SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING id',
        [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
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
        isRead: row.is_read,
        createdAt: row.created_at
    }));

    // Mark messages as read if current user is recipient
    await query(`
    UPDATE messages 
    SET is_read = true 
    WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false
  `, [otherUserId, req.user.id]);

    res.json({ messages });
}));

module.exports = router;