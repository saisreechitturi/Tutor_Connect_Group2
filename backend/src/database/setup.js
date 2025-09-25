// Load environment variables
require('dotenv').config();

const { connectDatabase, query } = require('./connection');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const setupDatabase = async () => {
    try {
        logger.info('[INFO] Starting database setup...');

        // Initialize database connection first
        await connectDatabase();

        // Read and execute the schema file directly
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        logger.info('[INFO] Executing database schema...');
        await query(schemaSQL);

        logger.info('[SUCCESS] Database setup completed successfully');
        return true;

    } catch (error) {
        logger.error('[ERROR] Database setup failed:', error);
        throw error;
    }
};

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase()
        .then(() => {
            logger.info('[SUCCESS] Database setup completed');
            process.exit(0);
        })
        .catch(error => {
            logger.error('[ERROR] Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupDatabase };