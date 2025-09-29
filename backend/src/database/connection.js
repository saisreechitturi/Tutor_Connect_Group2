const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const connectDatabase = async () => {
    try {
        logger.info('Initializing database connection...');

        // Support both DATABASE_URL and individual connection parameters
        const connectionConfig = process.env.DATABASE_URL
            ? {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? {
                    rejectUnauthorized: false
                } : false
            }
            : {
                host: process.env.DATABASE_HOST || process.env.DB_HOST,
                port: process.env.DATABASE_PORT || process.env.DB_PORT || 5432,
                database: process.env.DATABASE_NAME || process.env.DB_NAME,
                user: process.env.DATABASE_USER || process.env.DB_USER,
                password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
                ssl: process.env.DB_SSL_REQUIRED === 'true' ? {
                    rejectUnauthorized: false
                } : false
            };

        // Enhanced connection logging
        if (process.env.DATABASE_URL) {
            logger.info('Using DATABASE_URL connection string');
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`SSL enabled: ${connectionConfig.ssl ? 'Yes' : 'No'}`);
        } else {
            logger.info('Using individual connection parameters');
            logger.info(`Host: ${connectionConfig.host || 'NOT SET'}`);
            logger.info(`Port: ${connectionConfig.port}`);
            logger.info(`Database: ${connectionConfig.database || 'NOT SET'}`);
            logger.info(`User: ${connectionConfig.user || 'NOT SET'}`);
            logger.info(`Password: ${connectionConfig.password ? 'SET' : 'NOT SET'}`);
            logger.info(`SSL enabled: ${connectionConfig.ssl ? 'Yes' : 'No'}`);
        }

        // Validate required connection parameters
        if (!process.env.DATABASE_URL && (!connectionConfig.host || !connectionConfig.database || !connectionConfig.user)) {
            const missingParams = [];
            if (!connectionConfig.host) missingParams.push('DATABASE_HOST/DB_HOST');
            if (!connectionConfig.database) missingParams.push('DATABASE_NAME/DB_NAME');
            if (!connectionConfig.user) missingParams.push('DATABASE_USER/DB_USER');

            logger.error(`Missing required database parameters: ${missingParams.join(', ')}`);
            throw new Error(`Missing required database parameters: ${missingParams.join(', ')}`);
        }

        pool = new Pool({
            ...connectionConfig,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Set up pool event listeners for monitoring
        pool.on('connect', (client) => {
            logger.info('New database client connected');
        });

        pool.on('error', (err, client) => {
            logger.error('Database pool error:', err);
        });

        pool.on('acquire', (client) => {
            logger.debug('Database client acquired from pool');
        });

        pool.on('release', (err, client) => {
            if (err) {
                logger.error('Error releasing database client:', err);
            } else {
                logger.debug('Database client released back to pool');
            }
        });

        // Test the connection
        logger.info('Testing database connection...');
        const client = await pool.connect();

        // Get database info
        const dbInfoResult = await client.query('SELECT version(), current_database(), current_user');
        const dbInfo = dbInfoResult.rows[0];

        logger.info('Successfully connected to PostgreSQL database');
        logger.info(`Database: ${dbInfo.current_database}`);
        logger.info(`Connected as: ${dbInfo.current_user}`);
        logger.info(`PostgreSQL version: ${dbInfo.version.split(' ')[0]} ${dbInfo.version.split(' ')[1]}`);

        // Test a simple query to ensure full functionality
        await client.query('SELECT 1 as test');
        logger.info('Database connectivity test passed');

        client.release();

        logger.info('Database connection pool initialized successfully');
        return pool;
    } catch (error) {
        logger.error('Database connection failed:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            stack: error.stack
        });

        // Provide helpful error messages for common issues
        if (error.code === 'ECONNREFUSED') {
            logger.error('Connection refused - Is PostgreSQL running and accepting connections?');
        } else if (error.code === 'ENOTFOUND') {
            logger.error('Host not found - Check your database host configuration');
        } else if (error.code === '28P01') {
            logger.error('Authentication failed - Check your username and password');
        } else if (error.code === '3D000') {
            logger.error('Database does not exist - Check your database name');
        }

        throw error;
    }
};

const query = async (text, params) => {
    const start = Date.now();
    const queryId = Math.random().toString(36).substr(2, 9);

    try {
        // Log query start
        logger.debug(`[${queryId}] Executing query:`, {
            text: text.replace(/\s+/g, ' ').trim(),
            params: params || [],
            timestamp: new Date().toISOString()
        });

        if (!pool) {
            logger.error('Database pool not initialized');
            throw new Error('Database pool not initialized');
        }

        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        logger.debug(`[${queryId}] Query completed:`, {
            duration: `${duration}ms`,
            rowCount: res.rowCount,
            command: res.command
        });

        // Log slow queries as warnings
        if (duration > 1000) {
            logger.warn(`[${queryId}] Slow query detected (${duration}ms):`, {
                text: text.replace(/\s+/g, ' ').trim(),
                params: params || []
            });
        }

        return res;
    } catch (error) {
        const duration = Date.now() - start;
        logger.error(`[${queryId}] Query failed after ${duration}ms:`, {
            error: error.message,
            code: error.code,
            query: text.replace(/\s+/g, ' ').trim(),
            params: params || [],
            detail: error.detail,
            hint: error.hint
        });

        // Provide helpful error context
        if (error.code === '42P01') {
            logger.error('Table does not exist - Check your database schema');
        } else if (error.code === '42703') {
            logger.error('Column does not exist - Check your column names');
        } else if (error.code === '23505') {
            logger.error('Unique constraint violation - Duplicate entry detected');
        } else if (error.code === '23503') {
            logger.error('Foreign key constraint violation - Referenced record does not exist');
        }

        throw error;
    }
};

const getClient = async () => {
    try {
        if (!pool) {
            logger.error('Database pool not initialized when requesting client');
            throw new Error('Database pool not initialized');
        }

        logger.debug('Acquiring database client from pool...');
        const client = await pool.connect();
        logger.debug('Database client acquired successfully');
        return client;
    } catch (error) {
        logger.error('Failed to get database client:', {
            message: error.message,
            code: error.code,
            poolTotalCount: pool?.totalCount || 'N/A',
            poolIdleCount: pool?.idleCount || 'N/A',
            poolWaitingCount: pool?.waitingCount || 'N/A'
        });
        throw error;
    }
};

module.exports = {
    connectDatabase,
    query,
    getClient,
    pool: () => pool
};