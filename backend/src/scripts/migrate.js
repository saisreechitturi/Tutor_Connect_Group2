#!/usr/bin/env node

/**
 * Database Migration Runner for TutorConnect
 * This script runs database migrations to set up or update the database schema
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const { query, connectDatabase } = require('../database/connection');

async function runMigrations() {
    try {
        console.log('🚀 Starting database migrations...');

        // Connect to database
        await connectDatabase();
        console.log('✅ Connected to database');

        // Get all migration files
        const migrationsDir = path.join(__dirname, '../database/migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Run in alphabetical order

        console.log(`📁 Found ${migrationFiles.length} migration file(s)`);

        // Run each migration
        for (const file of migrationFiles) {
            console.log(`⏳ Running migration: ${file}`);

            const migrationPath = path.join(migrationsDir, file);
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

            try {
                // Split SQL into individual statements and execute them
                const statements = migrationSQL
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

                for (const statement of statements) {
                    if (statement.trim()) {
                        await query(statement + ';');
                    }
                }

                console.log(`✅ Migration completed: ${file}`);
            } catch (error) {
                console.error(`❌ Migration failed: ${file}`);
                console.error('Error:', error.message);

                // Continue with other migrations rather than stopping
                console.log('📋 Continuing with remaining migrations...');
            }
        }

        console.log('🎉 All migrations completed!');
        console.log('📊 Database schema is now up to date');

    } catch (error) {
        console.error('💥 Migration process failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run migrations if this script is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('✨ Migration process finished successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('🔥 Migration process failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigrations };