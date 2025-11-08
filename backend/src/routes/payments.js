const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Mock payment providers and methods for simulation
const MOCK_PROVIDERS = ['stripe', 'paypal', 'mock_bank'];
const MOCK_PAYMENT_METHODS = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];

// Generate mock transaction ID
function generateMockTransactionId() {
    return 'mock_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Simulate payment processing delay
function simulatePaymentDelay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)); // 1-3 seconds
}

// Mock payment success rate (90% success for demo)
function shouldPaymentSucceed() {
    return Math.random() > 0.1; // 90% success rate
}

// Create payment for session booking
router.post('/session/:sessionId', [
    authenticateToken,
    body('paymentMethod').isIn(MOCK_PAYMENT_METHODS).withMessage('Invalid payment method'),
    body('savePaymentMethod').optional().isBoolean().withMessage('Save payment method must be a boolean')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { sessionId } = req.params;
    const { paymentMethod, savePaymentMethod = false } = req.body;
    const payerId = req.user.id;

    // Get session details
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

    // Check if session is in valid state for payment
    if (session.status !== 'scheduled') {
        return res.status(400).json({ message: 'Session must be scheduled to process payment' });
    }

    // Check if payment already exists
    if (session.payment_status === 'paid') {
        return res.status(409).json({ message: 'Payment already processed for this session' });
    }

    const amount = parseFloat(session.payment_amount);
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid payment amount' });
    }

    try {
        // Simulate payment processing
        logger.info(`Processing mock payment for session ${sessionId}: $${amount}`);
        await simulatePaymentDelay();

        const paymentSucceeded = shouldPaymentSucceed();
        const transactionId = generateMockTransactionId();
        const platformFeeRate = 0.10; // 10% platform fee
        const platformFee = Math.round(amount * platformFeeRate * 100) / 100;
        const netAmount = amount - platformFee;
        const provider = MOCK_PROVIDERS[Math.floor(Math.random() * MOCK_PROVIDERS.length)];

        if (paymentSucceeded) {
            // Create successful payment record
            const paymentResult = await query(`
                INSERT INTO payments (
                    session_id, payer_id, payee_id, amount, currency, 
                    payment_method, payment_provider, transaction_id, 
                    status, description, platform_fee, net_amount, processed_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
                RETURNING *
            `, [
                sessionId,
                payerId,
                session.tutor_id,
                amount,
                'USD',
                paymentMethod,
                provider,
                transactionId,
                'completed',
                `Payment for ${session.subject_name} session with ${session.tutor_first_name} ${session.tutor_last_name}`,
                platformFee,
                netAmount
            ]);

            const payment = paymentResult.rows[0];

            // Update session payment status
            await query(`
                UPDATE tutoring_sessions 
                SET payment_status = 'paid', payment_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [payment.id, sessionId]);

            // Create tutor earnings record
            await query(`
                INSERT INTO tutor_earnings (
                    tutor_id, session_id, amount, platform_fee, net_amount,
                    earning_type, status, earned_date, available_date
                )
                VALUES ($1, $2, $3, $4, $5, 'session', 'available', $6, $6)
            `, [
                session.tutor_id,
                sessionId,
                amount,
                platformFee,
                netAmount,
                session.session_date
            ]);

            // Update tutor profile earnings
            await query(`
                UPDATE tutor_profiles 
                SET total_earnings = total_earnings + $1,
                    available_earnings = available_earnings + $2
                WHERE user_id = $3
            `, [amount, netAmount, session.tutor_id]);

            logger.info(`Mock payment successful: ${transactionId} for $${amount}`);

            res.status(201).json({
                message: 'Payment processed successfully',
                payment: {
                    id: payment.id,
                    transactionId: payment.transaction_id,
                    amount: payment.amount,
                    currency: payment.currency,
                    platformFee: payment.platform_fee,
                    netAmount: payment.net_amount,
                    status: payment.status,
                    paymentMethod: payment.payment_method,
                    provider: payment.payment_provider,
                    processedAt: payment.processed_at
                },
                session: {
                    id: sessionId,
                    tutorName: `${session.tutor_first_name} ${session.tutor_last_name}`,
                    subjectName: session.subject_name,
                    sessionDate: session.session_date,
                    startTime: session.start_time,
                    endTime: session.end_time
                }
            });

        } else {
            // Create failed payment record
            const paymentResult = await query(`
                INSERT INTO payments (
                    session_id, payer_id, payee_id, amount, currency, 
                    payment_method, payment_provider, transaction_id, 
                    status, description, platform_fee, net_amount, processed_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
                RETURNING *
            `, [
                sessionId,
                payerId,
                session.tutor_id,
                amount,
                'USD',
                paymentMethod,
                provider,
                transactionId,
                'failed',
                `Failed payment for ${session.subject_name} session with ${session.tutor_first_name} ${session.tutor_last_name}`,
                0,
                0
            ]);

            logger.warn(`Mock payment failed: ${transactionId} for $${amount}`);

            res.status(400).json({
                message: 'Payment processing failed',
                error: 'Payment declined by mock processor',
                payment: {
                    id: paymentResult.rows[0].id,
                    transactionId: transactionId,
                    status: 'failed'
                }
            });
        }

    } catch (error) {
        logger.error('Payment processing error:', error);
        res.status(500).json({ message: 'Payment processing failed' });
    }
}));

// Retry failed payment
router.post('/:paymentId/retry', [
    authenticateToken
], asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    // Get payment details
    const paymentResult = await query(`
        SELECT p.*, ts.session_date, ts.start_time, ts.end_time,
               tutor.first_name as tutor_first_name,
               tutor.last_name as tutor_last_name,
               s.name as subject_name
        FROM payments p
        JOIN tutoring_sessions ts ON p.session_id = ts.id
        JOIN users tutor ON p.payee_id = tutor.id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        WHERE p.id = $1
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // Check authorization
    if (payment.payer_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Check if payment can be retried
    if (payment.status !== 'failed') {
        return res.status(400).json({ message: 'Only failed payments can be retried' });
    }

    try {
        // Simulate retry payment processing
        logger.info(`Retrying mock payment ${paymentId} for $${payment.amount}`);
        await simulatePaymentDelay();

        const paymentSucceeded = shouldPaymentSucceed();
        const newTransactionId = generateMockTransactionId();

        if (paymentSucceeded) {
            const platformFeeRate = 0.10;
            const platformFee = Math.round(payment.amount * platformFeeRate * 100) / 100;
            const netAmount = payment.amount - platformFee;

            // Update payment to successful
            await query(`
                UPDATE payments 
                SET status = 'completed', 
                    transaction_id = $1,
                    platform_fee = $2,
                    net_amount = $3,
                    processed_at = CURRENT_TIMESTAMP
                WHERE id = $4
            `, [newTransactionId, platformFee, netAmount, paymentId]);

            // Update session payment status
            await query(`
                UPDATE tutoring_sessions 
                SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [payment.session_id]);

            // Create tutor earnings record
            await query(`
                INSERT INTO tutor_earnings (
                    tutor_id, session_id, amount, platform_fee, net_amount,
                    earning_type, status, earned_date, available_date
                )
                VALUES ($1, $2, $3, $4, $5, 'session', 'available', $6, $6)
            `, [
                payment.payee_id,
                payment.session_id,
                payment.amount,
                platformFee,
                netAmount,
                payment.session_date
            ]);

            // Update tutor profile earnings
            await query(`
                UPDATE tutor_profiles 
                SET total_earnings = total_earnings + $1,
                    available_earnings = available_earnings + $2
                WHERE user_id = $3
            `, [payment.amount, netAmount, payment.payee_id]);

            logger.info(`Mock payment retry successful: ${newTransactionId} for $${payment.amount}`);

            res.json({
                message: 'Payment retry successful',
                payment: {
                    id: paymentId,
                    transactionId: newTransactionId,
                    amount: payment.amount,
                    status: 'completed',
                    processedAt: new Date().toISOString()
                }
            });

        } else {
            // Update with new failed transaction ID
            await query(`
                UPDATE payments 
                SET transaction_id = $1, processed_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [newTransactionId, paymentId]);

            logger.warn(`Mock payment retry failed: ${newTransactionId} for $${payment.amount}`);

            res.status(400).json({
                message: 'Payment retry failed',
                error: 'Payment declined by mock processor',
                payment: {
                    id: paymentId,
                    transactionId: newTransactionId,
                    status: 'failed'
                }
            });
        }

    } catch (error) {
        logger.error('Payment retry error:', error);
        res.status(500).json({ message: 'Payment retry failed' });
    }
}));

// Get payment details
router.get('/:paymentId', [
    authenticateToken
], asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    const paymentResult = await query(`
        SELECT p.*, 
               payer.first_name as payer_first_name,
               payer.last_name as payer_last_name,
               payee.first_name as payee_first_name,
               payee.last_name as payee_last_name,
               ts.session_date, ts.start_time, ts.end_time,
               s.name as subject_name
        FROM payments p
        JOIN users payer ON p.payer_id = payer.id
        JOIN users payee ON p.payee_id = payee.id
        LEFT JOIN tutoring_sessions ts ON p.session_id = ts.id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        WHERE p.id = $1
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // Check authorization
    if (payment.payer_id !== req.user.id && payment.payee_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
        payment: {
            id: payment.id,
            sessionId: payment.session_id,
            amount: payment.amount,
            currency: payment.currency,
            platformFee: payment.platform_fee,
            netAmount: payment.net_amount,
            paymentMethod: payment.payment_method,
            paymentProvider: payment.payment_provider,
            transactionId: payment.transaction_id,
            status: payment.status,
            description: payment.description,
            processedAt: payment.processed_at,
            createdAt: payment.created_at,
            payer: {
                name: `${payment.payer_first_name} ${payment.payer_last_name}`
            },
            payee: {
                name: `${payment.payee_first_name} ${payment.payee_last_name}`
            },
            session: payment.session_date ? {
                date: payment.session_date,
                startTime: payment.start_time,
                endTime: payment.end_time,
                subjectName: payment.subject_name
            } : null
        }
    });
}));

// Get user's payments (student's payments or tutor's earnings)
router.get('/user/:userId', [
    authenticateToken,
    expressQuery('type').optional().isIn(['payments', 'earnings']).withMessage('Type must be payments or earnings'),
    expressQuery('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
    expressQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    expressQuery('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { userId } = req.params;
    const { type = 'payments', status, limit = 20, offset = 0 } = req.query;

    // Check authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    let whereClause, params;

    if (type === 'earnings') {
        // Get payments where user is the payee (tutor earnings)
        whereClause = 'p.payee_id = $1';
        params = [userId];
    } else {
        // Get payments where user is the payer (student payments)
        whereClause = 'p.payer_id = $1';
        params = [userId];
    }

    if (status) {
        whereClause += ` AND p.status = $${params.length + 1}`;
        params.push(status);
    }

    const paymentsResult = await query(`
        SELECT p.*, 
               payer.first_name as payer_first_name,
               payer.last_name as payer_last_name,
               payee.first_name as payee_first_name,
               payee.last_name as payee_last_name,
               ts.session_date, ts.start_time, ts.end_time,
               s.name as subject_name
        FROM payments p
        JOIN users payer ON p.payer_id = payer.id
        JOIN users payee ON p.payee_id = payee.id
        LEFT JOIN tutoring_sessions ts ON p.session_id = ts.id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await query(`
        SELECT COUNT(*) as count
        FROM payments p
        WHERE ${whereClause}
    `, params);

    const payments = paymentsResult.rows.map(payment => ({
        id: payment.id,
        sessionId: payment.session_id,
        amount: payment.amount,
        currency: payment.currency,
        platformFee: payment.platform_fee,
        netAmount: payment.net_amount,
        paymentMethod: payment.payment_method,
        paymentProvider: payment.payment_provider,
        transactionId: payment.transaction_id,
        status: payment.status,
        description: payment.description,
        processedAt: payment.processed_at,
        createdAt: payment.created_at,
        otherParty: type === 'earnings'
            ? `${payment.payer_first_name} ${payment.payer_last_name}`
            : `${payment.payee_first_name} ${payment.payee_last_name}`,
        session: payment.session_date ? {
            date: payment.session_date,
            startTime: payment.start_time,
            endTime: payment.end_time,
            subjectName: payment.subject_name
        } : null
    }));

    const total = parseInt(countResult.rows[0].count);

    res.json({
        payments,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        type
    });
}));

// Mock refund payment (admin only)
router.post('/:paymentId/refund', [
    authenticateToken,
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be max 500 characters'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive')
], asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;

    // Check admin authorization
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    // Get payment details
    const paymentResult = await query(`
        SELECT * FROM payments WHERE id = $1
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'completed') {
        return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
        return res.status(400).json({ message: 'Refund amount cannot exceed original payment amount' });
    }

    try {
        // Simulate refund processing
        await simulatePaymentDelay();

        const refundTransactionId = 'refund_' + generateMockTransactionId();

        // Update payment status
        await query(`
            UPDATE payments 
            SET status = 'refunded', 
                description = COALESCE(description, '') || ' - REFUNDED: ' || $1
            WHERE id = $2
        `, [reason || 'Admin refund', paymentId]);

        // Create refund record (as negative payment)
        await query(`
            INSERT INTO payments (
                session_id, payer_id, payee_id, amount, currency, 
                payment_method, payment_provider, transaction_id, 
                status, description, platform_fee, net_amount, processed_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        `, [
            payment.session_id,
            payment.payee_id, // Reverse: tutor "pays" student
            payment.payer_id,
            -refundAmount, // Negative amount for refund
            payment.currency,
            'refund',
            payment.payment_provider,
            refundTransactionId,
            'completed',
            `Refund for payment ${payment.transaction_id}: ${reason || 'Admin refund'}`,
            0,
            -refundAmount
        ]);

        // Adjust tutor earnings
        await query(`
            UPDATE tutor_profiles 
            SET total_earnings = GREATEST(0, total_earnings - $1),
                available_earnings = GREATEST(0, available_earnings - $2)
            WHERE user_id = $3
        `, [refundAmount, payment.net_amount, payment.payee_id]);

        // Update session payment status
        await query(`
            UPDATE tutoring_sessions 
            SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [payment.session_id]);

        logger.info(`Mock refund processed: ${refundTransactionId} for $${refundAmount}`);

        res.json({
            message: 'Refund processed successfully',
            refund: {
                transactionId: refundTransactionId,
                amount: refundAmount,
                originalPaymentId: paymentId,
                reason: reason || 'Admin refund',
                processedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Refund processing error:', error);
        res.status(500).json({ message: 'Refund processing failed' });
    }
}));

module.exports = router;