const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const aiService = require('../services/aiService');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all AI chat routes
router.use(authenticateToken);

/**
 * GET /api/ai-chat/sessions
 * Get all chat sessions for the authenticated user
 */
router.get('/sessions', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await query(`
        SELECT 
            s.id,
            s.title,
            s.created_at,
            s.updated_at,
            s.total_messages,
            s.is_active,
            (
                SELECT content 
                FROM ai_chat_messages m 
                WHERE m.session_id = s.id 
                ORDER BY m.created_at DESC 
                LIMIT 1
            ) as last_message,
            (
                SELECT message_type 
                FROM ai_chat_messages m 
                WHERE m.session_id = s.id 
                ORDER BY m.created_at DESC 
                LIMIT 1
            ) as last_message_type
        FROM ai_chat_sessions s
        WHERE s.user_id = $1 AND s.is_active = true
        ORDER BY s.updated_at DESC
        LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await query(`
        SELECT COUNT(*) as total
        FROM ai_chat_sessions
        WHERE user_id = $1 AND is_active = true
    `, [userId]);

    res.json({
        success: true,
        sessions: result.rows,
        pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total),
            hasMore: (page * limit) < parseInt(countResult.rows[0].total)
        }
    });
}));

/**
 * POST /api/ai-chat/sessions
 * Create a new chat session
 */
router.post('/sessions', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { title } = req.body;

    const result = await query(`
        INSERT INTO ai_chat_sessions (user_id, title)
        VALUES ($1, $2)
        RETURNING *
    `, [userId, title || 'New Chat']);

    res.status(201).json({
        success: true,
        session: result.rows[0]
    });
}));

/**
 * GET /api/ai-chat/sessions/:sessionId/messages
 * Get all messages for a specific chat session
 */
router.get('/sessions/:sessionId/messages', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Verify session belongs to user
    const sessionCheck = await query(`
        SELECT id FROM ai_chat_sessions 
        WHERE id = $1 AND user_id = $2 AND is_active = true
    `, [sessionId, userId]);

    if (sessionCheck.rows.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'Chat session not found'
        });
    }

    const result = await query(`
        SELECT 
            id,
            message_type,
            content,
            model_used,
            tokens_used,
            response_time_ms,
            created_at
        FROM ai_chat_messages
        WHERE session_id = $1
        ORDER BY created_at ASC
        LIMIT $2 OFFSET $3
    `, [sessionId, limit, offset]);

    const countResult = await query(`
        SELECT COUNT(*) as total
        FROM ai_chat_messages
        WHERE session_id = $1
    `, [sessionId]);

    res.json({
        success: true,
        messages: result.rows,
        pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total),
            hasMore: (page * limit) < parseInt(countResult.rows[0].total)
        }
    });
}));

/**
 * POST /api/ai-chat/sessions/:sessionId/messages
 * Send a message to AI and get response
 */
router.post('/sessions/:sessionId/messages', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    // Validate message
    const validation = aiService.validateMessage(message);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: validation.error
        });
    }

    // Verify session belongs to user and get available user information
    const sessionResult = await query(`
        SELECT s.*, 
               u.first_name, u.last_name, u.email, u.role, u.created_at as user_created_at,
               u.bio, u.phone, u.profile_picture_url
        FROM ai_chat_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1 AND s.user_id = $2 AND s.is_active = true
    `, [sessionId, userId]);

    if (sessionResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'Chat session not found'
        });
    }

    const session = sessionResult.rows[0];

    try {
        // Get conversation history (recent messages for context)
        const historyResult = await query(`
            SELECT message_type, content, created_at
            FROM ai_chat_messages
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT 10
        `, [sessionId]);

        // Format conversation history for AI service (reverse to chronological order)
        const conversationHistory = historyResult.rows.reverse();

        // Prepare user profile from available data
        const userProfile = {
            first_name: session.first_name,
            last_name: session.last_name,
            role: session.role,
            bio: session.bio || '',
            email: session.email,
            user_since: session.user_created_at,
            current_role: session.role
        };

        // Prepare context for AI
        const context = {
            userName: `${session.first_name} ${session.last_name}`,
            currentSubject: 'General Studies',
            academicLevel: session.role === 'student' ? 'Student' : session.role === 'tutor' ? 'Tutor' : 'User'
        };

        // Save user message first
        const userMessageResult = await query(`
            INSERT INTO ai_chat_messages (session_id, user_id, message_type, content)
            VALUES ($1, $2, 'user', $3)
            RETURNING *
        `, [sessionId, userId, validation.message]);

        // Generate AI response with enhanced context
        const aiResponse = await aiService.generateResponse(
            validation.message,
            conversationHistory,
            context,
            userProfile
        );

        // Save AI response
        const aiMessageResult = await query(`
            INSERT INTO ai_chat_messages (
                session_id, user_id, message_type, content, 
                model_used, tokens_used, response_time_ms
            )
            VALUES ($1, $2, 'assistant', $3, $4, $5, $6)
            RETURNING *
        `, [
            sessionId,
            userId,
            aiResponse.response,
            aiResponse.metadata.model,
            aiResponse.metadata.tokensUsed,
            aiResponse.metadata.responseTime
        ]);

        // Update session title if this is the first message
        if (session.total_messages === 0) {
            const generatedTitle = await aiService.generateChatTitle(validation.message);
            await query(`
                UPDATE ai_chat_sessions 
                SET title = $1 
                WHERE id = $2
            `, [generatedTitle, sessionId]);
        }

        res.json({
            success: true,
            userMessage: userMessageResult.rows[0],
            aiMessage: aiMessageResult.rows[0],
            aiResponse: {
                success: aiResponse.success,
                error: aiResponse.error || null
            }
        });

    } catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process your message. Please try again.'
        });
    }
}));

/**
 * PUT /api/ai-chat/sessions/:sessionId
 * Update a chat session (e.g., change title)
 */
router.put('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { title, is_active } = req.body;

    // Verify session belongs to user
    const sessionCheck = await query(`
        SELECT id FROM ai_chat_sessions 
        WHERE id = $1 AND user_id = $2
    `, [sessionId, userId]);

    if (sessionCheck.rows.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'Chat session not found'
        });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
        updateFields.push(`title = $${paramCount++}`);
        values.push(title);
    }

    if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramCount++}`);
        values.push(is_active);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No fields to update'
        });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(sessionId);

    const result = await query(`
        UPDATE ai_chat_sessions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
    `, values);

    res.json({
        success: true,
        session: result.rows[0]
    });
}));

/**
 * DELETE /api/ai-chat/sessions/:sessionId
 * Delete a chat session (soft delete)
 */
router.delete('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session belongs to user
    const sessionCheck = await query(`
        SELECT id FROM ai_chat_sessions 
        WHERE id = $1 AND user_id = $2
    `, [sessionId, userId]);

    if (sessionCheck.rows.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'Chat session not found'
        });
    }

    await query(`
        UPDATE ai_chat_sessions 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
    `, [sessionId]);

    res.json({
        success: true,
        message: 'Chat session deleted successfully'
    });
}));

/**
 * GET /api/ai-chat/stats
 * Get AI chat usage statistics for the user
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await query(`
        SELECT 
            COUNT(DISTINCT s.id) as total_sessions,
            COUNT(m.id) as total_messages,
            SUM(CASE WHEN m.message_type = 'user' THEN 1 ELSE 0 END) as user_messages,
            SUM(CASE WHEN m.message_type = 'assistant' THEN 1 ELSE 0 END) as ai_responses,
            COALESCE(SUM(m.tokens_used), 0) as total_tokens_used,
            COALESCE(AVG(m.response_time_ms), 0) as avg_response_time
        FROM ai_chat_sessions s
        LEFT JOIN ai_chat_messages m ON s.id = m.session_id
        WHERE s.user_id = $1 AND s.is_active = true
    `, [userId]);

    res.json({
        success: true,
        stats: result.rows[0]
    });
}));

module.exports = router;