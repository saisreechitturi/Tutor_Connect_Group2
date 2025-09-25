const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const connectDatabase = async () => {
    try {
        // Support both DATABASE_URL and individual connection parameters
        const connectionConfig = process.env.DATABASE_URL
            ? {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? {
                    rejectUnauthorized: false
                } : false
            }
            : {
                host: process.env.DATABASE_HOST,
                port: process.env.DATABASE_PORT || 5432,
                database: process.env.DATABASE_NAME,
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                ssl: process.env.DB_SSL_REQUIRED === 'true' ? {
                    rejectUnauthorized: false
                } : false
            };

        pool = new Pool({
            ...connectionConfig,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Test the connection
        const client = await pool.connect();
        logger.info('Successfully connected to PostgreSQL database');
        logger.info(`Database: ${process.env.DATABASE_NAME || 'from URL'}`);
        client.release();

        return pool;
    } catch (error) {
        logger.error('Database connection failed:', error);
        throw error;
    }
};

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        logger.error('Database query error:', error);
        throw error;
    }
};

const getClient = async () => {
    try {
        return await pool.connect();
    } catch (error) {
        logger.error('Failed to get database client:', error);
        throw error;
    }
};

module.exports = {
    connectDatabase,
    query,
    getClient,
    pool: () => pool
};