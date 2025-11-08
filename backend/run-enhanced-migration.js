const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');

// Database configuration
const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'TutorConnect',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'admin',
    ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
};

async function runMigration() {
    console.log('\n🚀 Running Enhanced Tutor Analytics & Availability Migration...');
    console.log('============================================================');

    const client = new Client(dbConfig);

    try {
        // Connect to database
        await client.connect();
        console.log('✅ Connected to database');

        // Read the complete migration file
        const migrationFile = path.join(__dirname, 'src/database/migrations/003_tutor_analytics_and_availability.sql');
        const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

        // Execute the entire migration as one transaction
        await client.query('BEGIN');

        console.log('📝 Executing migration...');
        await client.query(migrationSQL);

        await client.query('COMMIT');
        console.log('✅ Migration executed successfully');

        // Test the new tables
        console.log('\n🧪 Testing new table structures...');

        const tables = [
            'tutor_availability_slots',
            'tutor_earnings',
            'tutor_performance_metrics',
            'student_progress_tracking'
        ];

        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`✅ ${table}: Ready (${result.rows[0].count} records)`);
            } catch (error) {
                console.log(`❌ ${table}: Error - ${error.message}`);
            }
        }

        // Test functions
        console.log('\n🔧 Testing functions...');
        try {
            const functionsQuery = `
                SELECT p.proname as function_name 
                FROM pg_proc p 
                WHERE p.proname IN ('update_tutor_performance_metrics', 'update_tutor_profile_stats')
            `;
            const result = await client.query(functionsQuery);

            if (result.rows.length === 2) {
                console.log('✅ All functions created successfully');
            } else {
                console.log('⚠️  Some functions may not have been created');
            }
        } catch (error) {
            console.log(`❌ Function test failed: ${error.message}`);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📊 New features available:');
        console.log('   • Tutor availability management');
        console.log('   • Earnings tracking and analytics');
        console.log('   • Performance metrics dashboard');
        console.log('   • Student progress tracking');
        console.log('   • Automated triggers for data updates');
        console.log('\n🎯 Ready for tutor analytics and availability features!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run migration
runMigration().catch(console.error);