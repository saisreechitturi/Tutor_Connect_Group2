const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const logger = require('./src/utils/logger');
require('dotenv').config();

async function runMigration() {
    let pool;

    try {
        logger.info('Starting tasks table simplification migration...');
        logger.info('Connecting to database...');

        // Use the same connection logic as the main app
        const connectionConfig = process.env.DATABASE_URL
            ? {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? {
                    rejectUnauthorized: false
                } : false
            }
            : {
                host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
                port: process.env.DATABASE_PORT || process.env.DB_PORT || 5432,
                database: process.env.DATABASE_NAME || process.env.DB_NAME,
                user: process.env.DATABASE_USER || process.env.DB_USER,
                password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '',
                ssl: process.env.DB_SSL_REQUIRED === 'true' ? {
                    rejectUnauthorized: false
                } : false
            };

        pool = new Pool(connectionConfig);

        // Test connection
        await pool.query('SELECT NOW()');
        logger.info('Database connected successfully');

        // Execute migration statements individually
        logger.info('Adding subject column...');
        await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subject VARCHAR(100)');

        logger.info('Dropping tutor_id column...');
        await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS tutor_id');

        logger.info('Dropping subject_id column...');
        await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS subject_id');

        logger.info('Dropping actual_hours column...');
        await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS actual_hours');

        logger.info('Dropping difficulty_level column...');
        await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS difficulty_level');

        logger.info('Dropping attachments column...');
        await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS attachments');

        logger.info('Updating existing tasks with default subject...');
        await pool.query("UPDATE tasks SET subject = 'General' WHERE subject IS NULL OR subject = ''");

        logger.info('Fixing completed tasks progress percentage...');
        await pool.query("UPDATE tasks SET progress_percentage = 100 WHERE status = 'completed' AND (progress_percentage IS NULL OR progress_percentage = 0)");

        logger.info('✅ Migration completed successfully!');
        logger.info('Tasks table has been simplified:');
        logger.info('  - Added: subject (VARCHAR)');
        logger.info('  - Removed: tutor_id, subject_id, actual_hours, difficulty_level, attachments');
        logger.info('  - Fixed: completed tasks now show 100% progress');

        await pool.end();
        process.exit(0);
    } catch (error) {
        logger.error('❌ Migration failed:', error);
        if (pool) await pool.end();
        process.exit(1);
    }
}

runMigration();
