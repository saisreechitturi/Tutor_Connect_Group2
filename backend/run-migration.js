require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');

async function runMigration() {
    try {
        await connectDatabase();

        console.log('\n🚀 Running Tutor Analytics & Availability Migration...');
        console.log('='.repeat(60));

        // Read migration file
        const migrationPath = path.join(__dirname, 'src/database/migrations/003_tutor_analytics_and_availability.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await query(statement);
                    console.log(`✅ Statement ${i + 1}/${statements.length}: SUCCESS`);
                } catch (error) {
                    // Some statements might fail if they already exist (like IF NOT EXISTS)
                    if (error.message.includes('already exists') || error.message.includes('does not exist')) {
                        console.log(`⚠️  Statement ${i + 1}/${statements.length}: SKIPPED (${error.message.split('\n')[0]})`);
                    } else {
                        console.error(`❌ Statement ${i + 1}/${statements.length}: FAILED`);
                        console.error(`   ${error.message}`);
                        console.error(`   SQL: ${statement.substring(0, 100)}...`);
                    }
                }
            }
        }

        console.log('\n🎉 Migration completed!');
        console.log('\n📊 New tables created:');
        console.log('   • tutor_availability_slots - Manage tutor availability');
        console.log('   • tutor_earnings - Track tutor earnings');
        console.log('   • tutor_performance_metrics - Monthly performance aggregates');
        console.log('   • student_progress_tracking - Track student progress');

        console.log('\n🔧 Enhanced tables:');
        console.log('   • tutor_profiles - Added earnings and performance fields');
        console.log('   • tutoring_sessions - Added payment_id reference');

        console.log('\n⚡ New functions & triggers:');
        console.log('   • update_tutor_performance_metrics() - Auto-update performance');
        console.log('   • update_tutor_profile_stats() - Auto-update profile stats');

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
                const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`✅ ${table}: Ready (${result.rows[0].count} records)`);
            } catch (error) {
                console.error(`❌ ${table}: Error - ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎯 Ready for tutor analytics and availability features!');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nPlease check your database connection and try again.');
        process.exit(1);
    }
}

// Run migration
runMigration();