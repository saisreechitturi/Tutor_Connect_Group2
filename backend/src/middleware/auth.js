const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    logger.info(`Authentication attempt - Path: ${req.path}, Method: ${req.method}`);
    logger.info(`Auth header present: ${!!authHeader}`);
    logger.info(`Token extracted: ${!!token}`);

    if (!token) {
        logger.error('No token provided');
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`Token decoded successfully - User ID: ${decoded.userId}, Role: ${decoded.role}`);

        // Verify user still exists and is active
        const result = await query(
            'SELECT id, email, role, is_active FROM users WHERE id = $1 AND is_active = $2',
            [decoded.userId, true]
        );

        logger.info(`User lookup result - Found: ${result.rows.length} users`);

        if (result.rows.length === 0) {
            logger.error(`User not found or inactive for token user ID: ${decoded.userId}`);
            return res.status(401).json({ message: 'Invalid token or user not found' });
        }

        req.user = result.rows[0];
        logger.info(`Authentication successful - User: ${req.user.email}, Role: ${req.user.role}, ID: ${req.user.id}`);

        // Check if token expires within 7 days and auto-refresh if needed
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - currentTime;
        const sevenDaysInSeconds = 7 * 24 * 60 * 60;

        if (timeUntilExpiry < sevenDaysInSeconds) {
            // Generate a new token with fresh 30-day expiration
            const newToken = jwt.sign(
                { userId: decoded.userId, role: decoded.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
            );

            // Add new token to response headers for frontend to update
            res.setHeader('X-New-Token', newToken);

            logger.info(`Token auto-refreshed for user ${decoded.userId} (${result.rows[0].email})`);
        }

        next();
    } catch (error) {
        logger.error('Token verification failed:', error.message);
        logger.error('Token that failed:', token?.substring(0, 20) + '...');
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

const requireOwnership = (resourceIdParam = 'id') => {
    return (req, res, next) => {
        const resourceId = req.params[resourceIdParam];

        if (req.user.role === 'admin') {
            return next(); // Admins can access any resource
        }

        if (req.user.id != resourceId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requireOwnership
};