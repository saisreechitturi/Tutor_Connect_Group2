const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const taskRoutes = require('./routes/tasks');
const messageRoutes = require('./routes/messages');
const tutorRoutes = require('./routes/tutors');
const subjectsRoutes = require('./routes/subjects');
const reviewsRoutes = require('./routes/reviews');
const profilesRoutes = require('./routes/profiles');
const analyticsRoutes = require('./routes/analytics');
const availabilityRoutes = require('./routes/availability');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const calendarRoutes = require('./routes/calendar');
const aiChatRoutes = require('./routes/ai-chat');

const { errorHandler } = require('./middleware/errorHandler');
const { connectDatabase } = require('./database/connection');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/ai-chat', aiChatRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
}

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        logger.info('Starting TutorConnect server...');
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Target port: ${PORT}`);

        // Log configuration details
        logger.info('Server configuration:');
        logger.info(`   • Frontend URL: ${process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || 'Not set' : 'http://localhost:3000'}`);
        logger.info(`   • Rate limit: ${process.env.NODE_ENV === 'production' ? '100' : '1000'} requests per 15 minutes`);
        logger.info(`   • Body size limit: 10MB`);
        logger.info(`   • CORS enabled: Yes`);
        logger.info(`   • Helmet security: Yes`);

        // Connect to database first
        logger.info('Connecting to database...');
        await connectDatabase();
        logger.info('Database connection established');

        // Start HTTP server
        logger.info('Starting HTTP server...');
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info('Server started successfully!');
            logger.info(`Server running on http://0.0.0.0:${PORT}`);
            logger.info(`Local access: http://localhost:${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`API endpoints: http://localhost:${PORT}/api/`);
        });

        // Initialize Socket.io
        try {
            const { Server } = require('socket.io');
            const jwt = require('jsonwebtoken');
            const { setIO } = require('./utils/socket');

            const io = new Server(server, {
                cors: {
                    origin: corsOptions.origin,
                    credentials: true
                }
            });

            // Authenticate socket connections
            io.use(async (socket, next) => {
                try {
                    const authHeader = socket.handshake.headers?.authorization;
                    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
                        ? authHeader.split(' ')[1]
                        : null;
                    const token = socket.handshake.auth?.token || tokenFromHeader;
                    if (!token) return next(new Error('Authentication error: token missing'));

                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.user = { id: decoded.userId, role: decoded.role };
                    return next();
                } catch (err) {
                    return next(new Error('Authentication error'));
                }
            });

            io.on('connection', (socket) => {
                try {
                    const userId = socket.user?.id;
                    if (userId) {
                        socket.join(`user:${userId}`);
                        logger.info(`Socket connected and joined room user:${userId}`);
                    }

                    socket.on('disconnect', () => {
                        logger.debug(`Socket disconnected for user:${userId}`);
                    });
                } catch (e) {
                    logger.warn('Socket connection handler error', e);
                }
            });

            setIO(io);
            logger.info('Socket.io initialized');
        } catch (e) {
            logger.error('Failed to initialize Socket.io', e);
        }

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use`);
                logger.error('Try using a different port or stop the existing process');
            } else if (error.code === 'EACCES') {
                logger.error(`Permission denied to bind to port ${PORT}`);
                logger.error('Try using a port number above 1024 or run with elevated privileges');
            } else {
                logger.error('Server error:', error);
            }
            process.exit(1);
        });

        // Log when server is ready to accept connections
        server.on('listening', () => {
            const address = server.address();
            logger.info(`Server is listening on ${address.address}:${address.port}`);
            logger.info('Ready to accept connections');
        });

        // Log incoming connections
        server.on('connection', (socket) => {
            logger.debug(`New connection from ${socket.remoteAddress}:${socket.remotePort}`);

            socket.on('close', () => {
                logger.debug(`Connection closed from ${socket.remoteAddress}:${socket.remotePort}`);
            });
        });

        // Graceful shutdown handlers
        const gracefulShutdown = (signal) => {
            logger.info(`${signal} received. Initiating graceful shutdown...`);

            server.close((err) => {
                if (err) {
                    logger.error('Error during server shutdown:', err);
                    process.exit(1);
                } else {
                    logger.info('HTTP server closed');

                    // Close database connections
                    const { pool } = require('./database/connection');
                    const dbPool = pool();
                    if (dbPool && typeof dbPool.end === 'function') {
                        dbPool.end(() => {
                            logger.info('Database connections closed');
                            logger.info('Server shutdown complete');
                            process.exit(0);
                        });
                    } else {
                        logger.info('Server shutdown complete');
                        process.exit(0);
                    }
                }
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after 10 seconds');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });

    } catch (error) {
        logger.error('Failed to start server:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });

        // Provide specific error guidance
        if (error.message.includes('Database')) {
            logger.error('Database connection failed - Check your database configuration');
            logger.error('Ensure PostgreSQL is running and connection parameters are correct');
        }

        process.exit(1);
    }
}

startServer();

module.exports = app;