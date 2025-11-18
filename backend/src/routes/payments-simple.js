const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Create mock payment for a session - instantly marks as paid
router.post('/session/:sessionId', [
    authenticateToken,
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { sessionId } = req.params;
    const { amount } = req.body;
    const payerId = req.user.id;

    // Get session details to validate and get recipient
    const sessionResult = await query(`
        SELECT ts.*, 
               tutor.first_name as tutor_first_name,
               tutor.last_name as tutor_last_name,
               student.first_name as student_first_name,
               student.last_name as student_last_name,
               s.name as subject_name
        FROM tutoring_sessions ts
        JOIN users tutor ON ts.tutor_id = tutor.id
        JOIN users student ON ts.student_id = student.id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        WHERE ts.id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Check if user is the student for this session
    if (session.student_id !== payerId) {
        return res.status(403).json({ message: 'Only the student can pay for this session' });
    }

    // Check if payment already exists for this session
    const existingPayment = await query(
        'SELECT id FROM payments WHERE session_id = $1 AND status = $2',
        [sessionId, 'completed']
    );

    if (existingPayment.rows.length > 0) {
        return res.status(409).json({ message: 'Payment already completed for this session' });
    }

    // Create instant mock payment
    const paymentResult = await query(`
        INSERT INTO payments (
            session_id, payer_id, recipient_id, amount, currency,
            payment_method, status, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `, [
        sessionId,
        payerId,
        session.tutor_id,
        amount,
        'USD',
        'mock',
        'completed',
        `Payment for ${session.subject_name || 'tutoring'} session with ${session.tutor_first_name} ${session.tutor_last_name}`
    ]);

    const payment = paymentResult.rows[0];

    // Update session status to paid
    await query(`
        UPDATE tutoring_sessions 
        SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `, [sessionId]);

    res.status(201).json({
        message: 'Payment completed successfully',
        payment: {
            id: payment.id,
            sessionId: payment.session_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            createdAt: payment.created_at
        }
    });
}));

// Get payments for the authenticated user
router.get('/', [
    authenticateToken,
    expressQuery('type').optional().isIn(['sent', 'received']),
    expressQuery('status').optional().isIn(['pending', 'completed', 'failed']),
    expressQuery('limit').optional().isInt({ min: 1, max: 100 }),
    expressQuery('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
    const { type, status } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = `
        SELECT p.*, 
               payer.first_name as payer_first_name, 
               payer.last_name as payer_last_name,
               recipient.first_name as recipient_first_name, 
               recipient.last_name as recipient_last_name,
               ts.session_date, ts.duration_minutes,
               s.name as subject_name
        FROM payments p
        JOIN users payer ON p.payer_id = payer.id
        JOIN users recipient ON p.recipient_id = recipient.id
        LEFT JOIN tutoring_sessions ts ON p.session_id = ts.id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        WHERE (p.payer_id = $1 OR p.recipient_id = $1)
    `;

    const params = [req.user.id];

    // Filter by type (sent/received)
    if (type === 'sent') {
        queryText += ` AND p.payer_id = $1`;
    } else if (type === 'received') {
        queryText += ` AND p.recipient_id = $1`;
    }

    // Filter by status
    if (status) {
        queryText += ` AND p.status = $${params.length + 1}`;
        params.push(status);
    }

    queryText += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const payments = result.rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        description: row.description,
        type: row.payer_id === req.user.id ? 'sent' : 'received',
        payer: {
            id: row.payer_id,
            name: `${row.payer_first_name} ${row.payer_last_name}`
        },
        recipient: {
            id: row.recipient_id,
            name: `${row.recipient_first_name} ${row.recipient_last_name}`
        },
        session: row.session_id ? {
            date: row.session_date,
            duration: row.duration_minutes,
            subject: row.subject_name
        } : null,
        createdAt: row.created_at
    }));

    res.json({ payments });
}));

// Get specific payment details
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT p.*, 
               payer.first_name as payer_first_name, 
               payer.last_name as payer_last_name,
               recipient.first_name as recipient_first_name, 
               recipient.last_name as recipient_last_name,
               ts.session_date, ts.duration_minutes,
               s.name as subject_name
        FROM payments p
        JOIN users payer ON p.payer_id = payer.id
        JOIN users recipient ON p.recipient_id = recipient.id
        LEFT JOIN tutoring_sessions ts ON p.session_id = ts.id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        WHERE p.id = $1 AND (p.payer_id = $2 OR p.recipient_id = $2)
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
    }

    const row = result.rows[0];
    const payment = {
        id: row.id,
        sessionId: row.session_id,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        description: row.description,
        type: row.payer_id === req.user.id ? 'sent' : 'received',
        payer: {
            id: row.payer_id,
            name: `${row.payer_first_name} ${row.payer_last_name}`
        },
        recipient: {
            id: row.recipient_id,
            name: `${row.recipient_first_name} ${row.recipient_last_name}`
        },
        session: row.session_id ? {
            date: row.session_date,
            duration: row.duration_minutes,
            subject: row.subject_name
        } : null,
        createdAt: row.created_at
    };

    res.json({ payment });
}));

// Get payment statistics for user
router.get('/stats/summary', authenticateToken, asyncHandler(async (req, res) => {
    const stats = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE payer_id = $1) as payments_sent_count,
            COALESCE(SUM(amount) FILTER (WHERE payer_id = $1), 0) as total_sent,
            COUNT(*) FILTER (WHERE recipient_id = $1) as payments_received_count,
            COALESCE(SUM(amount) FILTER (WHERE recipient_id = $1), 0) as total_received,
            COUNT(*) FILTER (WHERE (payer_id = $1 OR recipient_id = $1) AND status = 'completed') as completed_payments,
            COUNT(*) FILTER (WHERE (payer_id = $1 OR recipient_id = $1) AND status = 'pending') as pending_payments
        FROM payments 
        WHERE payer_id = $1 OR recipient_id = $1
    `, [req.user.id]);

    const row = stats.rows[0];
    res.json({
        paymentsSent: {
            count: parseInt(row.payments_sent_count),
            total: parseFloat(row.total_sent)
        },
        paymentsReceived: {
            count: parseInt(row.payments_received_count),
            total: parseFloat(row.total_received)
        },
        completedPayments: parseInt(row.completed_payments),
        pendingPayments: parseInt(row.pending_payments)
    });
}));

module.exports = router;