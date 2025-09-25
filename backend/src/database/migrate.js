// Load environment variables
require('dotenv').config();

const { connectDatabase, query } = require('./connection');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const createTables = async () => {
    try {
        logger.info('[INFO] Starting database migration...');
        
        // Initialize database connection first
        await connectDatabase();
        
        // Read and execute the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        logger.info('[INFO] Executing database schema...');
        await query(schemaSQL);
        
        logger.info('[SUCCESS] Database migration completed successfully');
        
    } catch (error) {
        logger.error('[ERROR] Database migration failed:', error);
        throw error;
    }
};

const dropTables = async () => {
    try {
        logger.info('[INFO] Dropping all tables...');
        
        // Initialize database connection first
        await connectDatabase();
        
        // Drop tables in reverse order to handle foreign key constraints
        const dropTablesSQL = `
            DROP VIEW IF EXISTS tutor_search_view CASCADE;
            DROP TABLE IF EXISTS user_preferences CASCADE;
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS payments CASCADE;
            DROP TABLE IF EXISTS messages CASCADE;
            DROP TABLE IF EXISTS session_reviews CASCADE;
            DROP TABLE IF EXISTS tutoring_sessions CASCADE;
            DROP TABLE IF EXISTS student_profiles CASCADE;
            DROP TABLE IF EXISTS tutor_subjects CASCADE;
            DROP TABLE IF EXISTS tutor_profiles CASCADE;
            DROP TABLE IF EXISTS subjects CASCADE;
            DROP TABLE IF EXISTS user_addresses CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
        `;
        
        await query(dropTablesSQL);
        logger.info('[SUCCESS] All tables dropped successfully');
        
    } catch (error) {
        logger.error('[ERROR] Failed to drop tables:', error);
        throw error;
    }
};

const resetDatabase = async () => {
    logger.info('[INFO] Resetting database...');
    await dropTables();
    await createTables();
    logger.info('[SUCCESS] Database reset completed');
};

// Main migration function
const migrate = async () => {
    try {
        logger.info('[INFO] Database migration started');
        await createTables();
        logger.info('[SUCCESS] Database migration completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('[ERROR] Migration failed:', error);
        process.exit(1);
    }
};

// Run migration if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--reset')) {
        resetDatabase().catch(error => {
            logger.error('[ERROR] Reset failed:', error);
            process.exit(1);
        });
    } else {
        migrate();
    }
}

module.exports = {
    createTables,
    dropTables,
    resetDatabase,
    migrate
};