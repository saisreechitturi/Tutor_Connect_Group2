const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const connectDatabase = async () => {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Test the connection
        const client = await pool.connect();
        logger.info('Successfully connected to PostgreSQL database');
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