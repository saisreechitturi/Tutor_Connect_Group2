const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const errorId = Math.random().toString(36).substr(2, 9);

    // Enhanced error logging
    logger.error(`[${errorId}] Error occurred:`, {
        errorType: err.name || 'Unknown',
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        userRole: req.user?.role,
        timestamp: new Date().toISOString(),
        stack: err.stack
    });

    // Default error
    let error = { ...err };
    error.message = err.message;

    // Database errors
    if (err.code === '23505') {
        const message = 'Resource already exists';
        error = { message, statusCode: 400 };
        logger.warn(`[${errorId}] Duplicate key constraint violation`);
    }

    if (err.code === '23503') {
        const message = 'Resource reference not found';
        error = { message, statusCode: 400 };
        logger.warn(`[${errorId}] Foreign key constraint violation`);
    }

    if (err.code === '22P02') {
        const message = 'Invalid input format';
        error = { message, statusCode: 400 };
        logger.warn(`[${errorId}] Invalid input syntax error`);
    }

    if (err.code === '42P01') {
        const message = 'Database schema error';
        error = { message, statusCode: 500 };
        logger.error(`[${errorId}] Table does not exist - database schema issue`);
    }

    if (err.code === '42703') {
        const message = 'Database schema error';
        error = { message, statusCode: 500 };
        logger.error(`[${errorId}] Column does not exist - database schema issue`);
    }

    // Connection errors
    if (err.code === 'ECONNREFUSED') {
        const message = 'Service temporarily unavailable';
        error = { message, statusCode: 503 };
        logger.error(`[${errorId}] Database connection refused`);
    }

    if (err.code === 'ENOTFOUND') {
        const message = 'Service temporarily unavailable';
        error = { message, statusCode: 503 };
        logger.error(`[${errorId}] Database host not found`);
    }

    // Authentication errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
        logger.warn(`[${errorId}] Invalid JWT token`);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
        logger.warn(`[${errorId}] JWT token expired`);
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
        logger.warn(`[${errorId}] Validation error: ${message}`);
    }

    // Rate limiting errors
    if (err.message === 'Too many requests from this IP, please try again later.') {
        logger.warn(`[${errorId}] Rate limit exceeded from IP: ${req.ip}`);
    }

    const statusCode = error.statusCode || 500;
    const responseMessage = error.message || 'Internal Server Error';

    logger.info(`[${errorId}] Sending error response: ${statusCode} - ${responseMessage}`);

    res.status(statusCode).json({
        success: false,
        message: responseMessage,
        errorId: errorId,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            code: err.code,
            details: err.detail
        })
    });
};

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
    errorHandler,
    asyncHandler
};