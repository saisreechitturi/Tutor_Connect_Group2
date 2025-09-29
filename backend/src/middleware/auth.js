const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists and is active
        const result = await query(
            'SELECT id, email, role, is_active FROM users WHERE id = $1 AND is_active = $2',
            [decoded.userId, true]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid token or user not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        logger.error('Token verification failed:', error);
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